/**
 * Chat escalation utility for detecting high-priority conversations and creating leads
 * Handles staff handoff when AI chat reaches its limits or detects high intent
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { isBusinessHours, getNextAvailableMessage } from '@/lib/business-hours';

/**
 * Chat message structure for intent detection
 */
interface ChatMessage {
  role: string;
  content: string;
  createdAt?: Date;
}

/**
 * Intent detection result
 */
interface IntentResult {
  shouldEscalate: boolean;
  priority: 'high' | 'normal' | null;
  reason: string | null;
  signals: string[];
}

/**
 * High-intent signals that indicate ready-to-buy or urgent need
 */
const HIGH_INTENT_SIGNALS = {
  readyToOrder: [
    /\b(want to|ready to|need to)\s+(order|buy|purchase|get)/i,
    /\bhow (do|can) i (order|buy|purchase)\b/i,
    /\bplace (an )?order\b/i,
    /\bwhen can (i|you)\b/i,
  ],
  largeQuantity: [
    /\b\d+\s*(tons?|yards?|loads?|trucks?)\b/i,
    /\b(large|bulk|commercial) (order|quantity|project)/i,
    /\bcontractor\b/i,
    /\bmultiple (loads?|trucks?|deliveries)\b/i,
  ],
  urgency: [
    /\b(urgent|asap|immediately|right away|soon as possible)\b/i,
    /\b(today|tomorrow|this week)\b/i,
    /\bneed (it|this|that) (now|today|asap)\b/i,
  ],
  frustration: [
    /\b(frustrated|confused|don'?t understand|not helpful|can'?t help)\b/i,
    /\b(talk to|speak to|speak with) (a )?(person|human|someone|staff)\b/i,
    /\bis (there|anyone) (there|available)\b/i,
    /\blet me (talk|speak)\b/i,
  ],
  specificQuestions: [
    /\bdelivery (rate|cost|fee|price|charge)/i,
    /\b(custom|special) (order|pricing|quote)/i,
    /\b(can you|do you) (deliver|haul|truck)\b/i,
    /\bproject (estimate|quote|consultation)/i,
  ],
};

/**
 * Uncertainty signals that indicate the AI doesn't have the answer
 */
const UNCERTAINTY_SIGNALS = [
  /\bi don'?t (know|have)\b/i,
  /\bcall (us )?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|for)/i,
  /\bemail (us|for)\b/i,
  /\b(please|you'?ll need to) (call|contact|reach out)\b/i,
  /\bcan'?t (help|answer|provide)\b/i,
];

/**
 * Detects high-intent signals in chat messages and determines escalation need
 * @param messages - Array of chat messages to analyze
 * @returns Intent analysis result with escalation recommendation
 */
export function detectHighIntent(messages: ChatMessage[]): IntentResult {
  const result: IntentResult = {
    shouldEscalate: false,
    priority: null,
    reason: null,
    signals: [],
  };

  if (!messages || messages.length === 0) {
    return result;
  }

  // Analyze all messages, giving more weight to recent ones
  const recentMessages = messages.slice(-5);
  const allContent = messages.map((m) => m.content).join(' ');
  const recentContent = recentMessages.map((m) => m.content).join(' ');

  // Check for explicit human request (highest priority)
  const hasFrustration = HIGH_INTENT_SIGNALS.frustration.some((pattern) =>
    pattern.test(recentContent)
  );

  if (hasFrustration) {
    result.shouldEscalate = true;
    result.priority = 'high';
    result.reason = 'Customer requested to speak with a person';
    result.signals.push('human_request');
    return result;
  }

  // Check if AI has expressed uncertainty (auto-escalate)
  const hasUncertainty = UNCERTAINTY_SIGNALS.some((pattern) => {
    // Only check assistant messages for uncertainty
    const assistantMessages = recentMessages.filter((m) => m.role === 'assistant');
    return assistantMessages.some((m) => pattern.test(m.content));
  });

  if (hasUncertainty) {
    result.shouldEscalate = true;
    result.priority = 'normal';
    result.reason = 'AI unable to provide complete answer';
    result.signals.push('ai_uncertainty');
  }

  // Check for ready-to-order signals
  const hasReadyToOrder = HIGH_INTENT_SIGNALS.readyToOrder.some((pattern) =>
    pattern.test(allContent)
  );

  if (hasReadyToOrder) {
    result.shouldEscalate = true;
    result.priority = 'high';
    result.reason = 'Customer ready to place order';
    result.signals.push('ready_to_order');
  }

  // Check for large quantity signals
  const hasLargeQuantity = HIGH_INTENT_SIGNALS.largeQuantity.some((pattern) =>
    pattern.test(allContent)
  );

  if (hasLargeQuantity) {
    result.shouldEscalate = true;
    result.priority = 'high';
    result.reason = 'Large quantity or commercial project';
    result.signals.push('large_quantity');
  }

  // Check for urgency signals
  const hasUrgency = HIGH_INTENT_SIGNALS.urgency.some((pattern) =>
    pattern.test(recentContent)
  );

  if (hasUrgency && (hasReadyToOrder || hasLargeQuantity)) {
    result.priority = 'high';
    result.signals.push('urgency');
    result.reason = result.reason
      ? `${result.reason} with urgency`
      : 'Urgent request';
  }

  // Check for specific complex questions
  const hasSpecificQuestion = HIGH_INTENT_SIGNALS.specificQuestions.some(
    (pattern) => pattern.test(recentContent)
  );

  if (hasSpecificQuestion && !result.shouldEscalate) {
    result.shouldEscalate = true;
    result.priority = 'normal';
    result.reason = 'Complex question requiring staff expertise';
    result.signals.push('specific_question');
  }

  return result;
}

/**
 * Creates a lead from an escalated chat conversation
 * Links the conversation to the lead and marks it as escalated
 * @param conversationId - The chat conversation ID to escalate
 * @param reason - Reason for escalation
 * @returns The created lead or null if creation failed
 */
export async function createLeadFromConversation(
  conversationId: string,
  reason: string
): Promise<{ leadId: string; priority: string } | null> {
  try {
    // Fetch the conversation with messages
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      logger.warn('Conversation not found for escalation', { conversationId });
      return null;
    }

    // If already escalated, don't create duplicate lead
    if (conversation.leadId) {
      logger.info('Conversation already escalated', {
        conversationId,
        existingLeadId: conversation.leadId,
      });
      return {
        leadId: conversation.leadId,
        priority: conversation.priority || 'normal',
      };
    }

    // Detect intent to determine priority
    const intentResult = detectHighIntent(conversation.messages);
    const priority = intentResult.priority || 'normal';

    // Build message context from conversation
    const messageContext = conversation.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const leadMessage = `Chat escalation - ${reason}\n\n--- Chat Transcript ---\n${messageContext}`;

    // Determine contact info (use what's available)
    const leadName = conversation.name || 'Chat Visitor';
    const leadEmail = conversation.email || '';
    const leadPhone = conversation.phone || null;

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        source: 'chat-escalation',
        status: 'new',
        message: leadMessage,
      },
    });

    // Update conversation with escalation details
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        leadId: lead.id,
        escalatedAt: new Date(),
        escalationReason: reason,
        priority,
        status: 'escalated',
      },
    });

    logger.info('Lead created from chat escalation', {
      conversationId,
      leadId: lead.id,
      priority,
      reason,
    });

    return {
      leadId: lead.id,
      priority,
    };
  } catch (error) {
    logger.error('Failed to create lead from conversation', error, {
      conversationId,
      reason,
    });
    return null;
  }
}

/**
 * Gets escalation acknowledgment message based on current business hours
 * @returns Message string to display to the customer
 */
export function getEscalationAcknowledgment(): string {
  const inBusinessHours = isBusinessHours();
  const nextAvailable = getNextAvailableMessage();

  if (inBusinessHours) {
    return "Thank you! I've passed your request to our team. Someone will reach out to you shortly during business hours.";
  }

  return `Thank you! I've captured your request. Our team will follow up with you ${nextAvailable}. We're open Monday-Friday, 7:30 AM - 4:00 PM ET.`;
}

/**
 * Checks if a conversation should auto-escalate based on message count
 * Long conversations without resolution may indicate AI is struggling
 * @param messageCount - Number of messages in the conversation
 * @returns true if conversation should auto-escalate
 */
export function shouldAutoEscalateByLength(messageCount: number): boolean {
  // Auto-escalate after 10 back-and-forth exchanges (20 messages)
  return messageCount >= 20;
}

/**
 * Extracts contact information from chat messages using pattern matching
 * Helps identify contact details even if not captured in form
 * @param messages - Array of chat messages to analyze
 * @returns Extracted contact information
 */
export function extractContactInfo(messages: ChatMessage[]): {
  email: string | null;
  phone: string | null;
} {
  const result = {
    email: null as string | null,
    phone: null as string | null,
  };

  const allContent = messages.map((m) => m.content).join(' ');

  // Extract email
  const emailMatch = allContent.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  );
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Extract phone (US format)
  const phoneMatch = allContent.match(
    /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/
  );
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }

  return result;
}
