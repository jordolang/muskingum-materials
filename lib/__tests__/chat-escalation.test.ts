import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectHighIntent, shouldAutoEscalateByLength } from '../chat-escalation';

describe('Chat Escalation Utility', () => {
  describe('detectHighIntent', () => {
    it('detects ready-to-order signals', () => {
      const messages = [
        { role: 'user' as const, content: 'I want to order 10 tons of gravel' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.priority).toBe('high');
      expect(result.signals).toContain('ready_to_order');
    });

    it('detects large quantity signals', () => {
      const messages = [
        { role: 'user' as const, content: 'I need 15 tons for my contractor project' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.priority).toBe('high');
      expect(result.signals).toContain('large_quantity');
    });

    it('detects human request with high priority', () => {
      const messages = [
        { role: 'user' as const, content: 'Can I talk to a person please?' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.priority).toBe('high');
      expect(result.reason).toContain('person');
    });

    it('detects AI uncertainty in assistant messages', () => {
      const messages = [
        { role: 'user' as const, content: 'What is your delivery rate to Columbus?' },
        { role: 'assistant' as const, content: 'I don\'t have that information. Please call us at...' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.signals).toContain('ai_uncertainty');
    });

    it('detects urgency combined with other signals', () => {
      const messages = [
        { role: 'user' as const, content: 'I need to order 20 tons ASAP for today' },
      ];
      const result = detectHighIntent(messages);
      expect(result.priority).toBe('high');
      expect(result.signals).toContain('urgency');
      expect(result.signals).toContain('ready_to_order');
      expect(result.signals).toContain('large_quantity');
    });

    it('returns no escalation for simple questions', () => {
      const messages = [
        { role: 'user' as const, content: 'What products do you have?' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(false);
    });

    it('detects "want to buy" keyword pattern', () => {
      const messages = [
        { role: 'user' as const, content: 'I want to buy some mulch' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.signals).toContain('ready_to_order');
    });

    it('detects contractor keyword in large quantity signals', () => {
      const messages = [
        { role: 'user' as const, content: 'I have a contractor project coming up' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.signals).toContain('large_quantity');
    });

    it('detects delivery questions as specific questions (normal priority)', () => {
      const messages = [
        { role: 'user' as const, content: 'What is the delivery rate to 123 Main St?' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.priority).toBe('normal');
      expect(result.signals).toContain('specific_question');
    });

    it('detects "not helpful" as frustration', () => {
      const messages = [
        { role: 'user' as const, content: 'This is not helpful at all' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.signals).toContain('human_request');
    });

    it('handles multiple signals correctly', () => {
      const messages = [
        { role: 'user' as const, content: 'I need 25 tons delivered ASAP to my construction site' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.priority).toBe('high');
      expect(result.signals.length).toBeGreaterThan(1);
    });

    it('is case-insensitive for keywords', () => {
      const messages = [
        { role: 'user' as const, content: 'I WANT TO ORDER GRAVEL' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
    });

    it('detects "talk to a person" requests', () => {
      const messages = [
        { role: 'user' as const, content: 'What\'s your phone number?' },
        { role: 'assistant' as const, content: 'You can call us at 740-453-0721' },
        { role: 'user' as const, content: 'Can I talk to a person instead?' },
      ];
      const result = detectHighIntent(messages);
      expect(result.shouldEscalate).toBe(true);
      expect(result.priority).toBe('high');
      expect(result.signals).toContain('human_request');
    });
  });

  describe('shouldAutoEscalateByLength', () => {
    it('returns false for short conversations', () => {
      expect(shouldAutoEscalateByLength(3)).toBe(false);
      expect(shouldAutoEscalateByLength(5)).toBe(false);
      expect(shouldAutoEscalateByLength(10)).toBe(false);
    });

    it('returns true for long conversations (20+ messages)', () => {
      expect(shouldAutoEscalateByLength(20)).toBe(true);
      expect(shouldAutoEscalateByLength(25)).toBe(true);
      expect(shouldAutoEscalateByLength(50)).toBe(true);
    });

    it('returns false at exactly 19 messages', () => {
      expect(shouldAutoEscalateByLength(19)).toBe(false);
    });

    it('returns true at exactly 20 messages', () => {
      expect(shouldAutoEscalateByLength(20)).toBe(true);
    });

    it('handles edge case of 0 messages', () => {
      expect(shouldAutoEscalateByLength(0)).toBe(false);
    });

    it('handles edge case of 1 message', () => {
      expect(shouldAutoEscalateByLength(1)).toBe(false);
    });
  });
});
