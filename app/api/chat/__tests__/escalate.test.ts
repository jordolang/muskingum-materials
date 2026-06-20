import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '../escalate/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

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
}));

vi.mock('@/lib/email-service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates lead and links to conversation', async () => {
    // Mock conversation
    const mockConversation = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLead = {
      id: 'lead-123',
      name: 'Test User',
      email: 'test@example.com',
      phone: null,
      source: 'chat',
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(mockConversation as any);
    vi.mocked(prisma.lead.create).mockResolvedValue(mockLead as any);
    vi.mocked(prisma.chatConversation.update).mockResolvedValue({
      ...mockConversation,
      leadId: 'lead-123',
      escalatedAt: new Date(),
    } as any);

    // Test escalation request
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
    expect(data.leadId).toBeDefined();
    expect(data.message).toBeDefined();
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
    const mockConversation = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLead = {
      id: 'lead-123',
      name: 'Anonymous',
      email: null,
      phone: null,
      source: 'chat',
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(mockConversation as any);
    vi.mocked(prisma.lead.create).mockResolvedValue(mockLead as any);
    vi.mocked(prisma.chatConversation.update).mockResolvedValue({
      ...mockConversation,
      leadId: 'lead-123',
      escalatedAt: new Date(),
    } as any);

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
    // Mock conversation that is already escalated
    const mockConversation = {
      id: 'conv-123',
      visitorId: 'visitor-123',
      name: 'Test User',
      email: 'test@example.com',
      phone: null,
      status: 'active',
      metadata: null,
      escalatedAt: new Date(),
      leadId: 'existing-lead-id',
      lead: { id: 'existing-lead-id', name: 'Test User' },
      priority: 'high',
      escalationReason: 'user_requested',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(mockConversation as any);

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

    // Should return success but not create a new lead
    expect(response.status).toBe(200);
    expect(data.leadId).toBe('existing-lead-id');
    expect(vi.mocked(prisma.lead.create)).not.toHaveBeenCalled();
  });

  it('sets high priority for high_intent reason', async () => {
    const mockConversation = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLead = {
      id: 'lead-123',
      name: 'Anonymous',
      email: null,
      phone: null,
      source: 'chat',
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.chatConversation.findUnique).mockResolvedValue(mockConversation as any);
    vi.mocked(prisma.lead.create).mockResolvedValue(mockLead as any);
    vi.mocked(prisma.chatConversation.update).mockResolvedValue({
      ...mockConversation,
      leadId: 'lead-123',
      escalatedAt: new Date(),
      priority: 'high',
      escalationReason: 'high_intent',
    } as any);

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

    // Verify update was called with high priority
    const updateCall = vi.mocked(prisma.chatConversation.update).mock.calls[0];
    expect(updateCall[0].data).toMatchObject({
      priority: 'high',
      escalationReason: 'high_intent',
    });
  });
});
