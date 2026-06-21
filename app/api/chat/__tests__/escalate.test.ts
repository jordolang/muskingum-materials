import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '../escalate/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLeadFromConversation } from '@/lib/chat-escalation';
import { sendNotificationEmail } from '@/lib/email-service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    chatConversation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      create: vi.fn(),
    },
    chatMessage: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getClientIdentifier: vi.fn(() => 'test-client'),
}));

vi.mock('@/lib/email-service', () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-test' }),
}));

// The route delegates lead creation and acknowledgment wording to chat-escalation;
// mock it so these tests stay focused on the route's orchestration logic.
vi.mock('@/lib/chat-escalation', () => ({
  createLeadFromConversation: vi.fn(),
  getEscalationAcknowledgment: vi.fn(
    () => "Thank you! I've passed your request to our team."
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

/**
 * Builds a mock conversation matching the shape the route reads
 * (`prisma.chatConversation.findUnique` with `include: { messages }`).
 */
function buildConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conv-123',
    visitorId: 'visitor-123',
    name: null,
    email: null,
    phone: null,
    status: 'active',
    metadata: null,
    escalatedAt: null,
    leadId: null,
    lead: null,
    priority: null,
    escalationReason: null,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('POST /api/chat/escalate', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: rate limit not exceeded
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    });

    // Default: escalation succeeds with a normal-priority lead
    vi.mocked(createLeadFromConversation).mockResolvedValue({
      leadId: 'lead-123',
      priority: 'normal',
    });

    vi.mocked(sendNotificationEmail).mockResolvedValue({
      success: true,
      messageId: 'msg-test',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates lead and links to conversation', async () => {
    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(
      buildConversation() as any
    );
    vi.mocked(prisma.chatConversation.update).mockResolvedValue(
      buildConversation({ leadId: 'lead-123', escalatedAt: new Date() }) as any
    );

    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'visitor-123',
        reason: 'user_requested',
        contactInfo: {
          name: 'Test User',
          email: 'test@example.com',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.leadId).toBe('lead-123');
    expect(data.message).toBeDefined();
    expect(createLeadFromConversation).toHaveBeenCalledWith('conv-123', 'user_requested');
  });

  it('enforces rate limiting', async () => {
    // Mock rate limit exceeded
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'visitor-123',
        reason: 'user_requested',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeDefined();
  });

  it('validates visitor ID format', async () => {
    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'invalid-format!@#$%',
        reason: 'user_requested',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 404 for non-existent conversation', async () => {
    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'nonexistent-visitor',
        reason: 'user_requested',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  it('handles missing contact info gracefully', async () => {
    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(
      buildConversation() as any
    );

    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'visitor-123',
        reason: 'user_requested',
        // No contactInfo provided
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // No contact info means the conversation should not be updated with contact details.
    expect(prisma.chatConversation.update).not.toHaveBeenCalled();
  });

  it('validates reason enum', async () => {
    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'visitor-123',
        reason: 'invalid_reason',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('prevents duplicate escalation', async () => {
    // Conversation already escalated; createLeadFromConversation returns the
    // existing lead without creating a new one.
    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(
      buildConversation({
        name: 'Test User',
        email: 'test@example.com',
        escalatedAt: new Date(),
        leadId: 'existing-lead-id',
        lead: { id: 'existing-lead-id', name: 'Test User' },
        priority: 'high',
        escalationReason: 'user_requested',
      }) as any
    );
    vi.mocked(createLeadFromConversation).mockResolvedValue({
      leadId: 'existing-lead-id',
      priority: 'high',
    });

    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'visitor-123',
        reason: 'user_requested',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return success and reuse the existing lead.
    expect(response.status).toBe(200);
    expect(data.leadId).toBe('existing-lead-id');
    expect(vi.mocked(prisma.lead.create)).not.toHaveBeenCalled();
  });

  it('sets high priority for high_intent reason', async () => {
    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(
      buildConversation() as any
    );
    vi.mocked(createLeadFromConversation).mockResolvedValue({
      leadId: 'lead-123',
      priority: 'high',
    });

    const request = new Request('http://localhost:3000/api/chat/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: 'visitor-123',
        reason: 'high_intent',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // The route forwards the high_intent reason to lead creation, which derives
    // priority, then flags the staff notification as high priority.
    expect(createLeadFromConversation).toHaveBeenCalledWith('conv-123', 'high_intent');
    expect(sendNotificationEmail).toHaveBeenCalledTimes(1);
    const [subject] = vi.mocked(sendNotificationEmail).mock.calls[0];
    expect(subject).toContain('HIGH PRIORITY');
  });
});
