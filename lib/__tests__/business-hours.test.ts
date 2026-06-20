import { describe, it, expect } from 'vitest';
import {
  isBusinessHours,
  getNextAvailableMessage,
  getBusinessHoursStatus
} from '../business-hours';

describe('Business Hours Utility', () => {
  describe('isBusinessHours', () => {
    it('returns true during weekday business hours', () => {
      // Tuesday 10:00 AM ET (15:00 UTC)
      const date = new Date('2024-01-16T15:00:00Z');
      expect(isBusinessHours(date)).toBe(true);
    });

    it('returns false on weekends', () => {
      // Saturday 10:00 AM ET (15:00 UTC)
      const date = new Date('2024-01-20T15:00:00Z');
      expect(isBusinessHours(date)).toBe(false);
    });

    it('returns false before opening time', () => {
      // Monday 7:00 AM ET (12:00 UTC) - before 7:30 AM opening
      const date = new Date('2024-01-15T12:00:00Z');
      expect(isBusinessHours(date)).toBe(false);
    });

    it('returns false after closing time', () => {
      // Monday 5:00 PM ET (22:00 UTC) - after 4:00 PM closing
      const date = new Date('2024-01-15T22:00:00Z');
      expect(isBusinessHours(date)).toBe(false);
    });

    it('returns true at opening time (7:30 AM ET)', () => {
      // Monday 7:30 AM ET (12:30 UTC)
      const date = new Date('2024-01-15T12:30:00Z');
      expect(isBusinessHours(date)).toBe(true);
    });

    it('returns false at closing time (4:00 PM ET)', () => {
      // Monday 4:00 PM ET (21:00 UTC) - boundary is exclusive
      const date = new Date('2024-01-15T21:00:00Z');
      expect(isBusinessHours(date)).toBe(false);
    });

    it('returns false on Sunday', () => {
      // Sunday 10:00 AM ET
      const date = new Date('2024-01-21T15:00:00Z');
      expect(isBusinessHours(date)).toBe(false);
    });
  });

  describe('getNextAvailableMessage', () => {
    it('returns "shortly" during business hours', () => {
      // Tuesday 10:00 AM ET
      const date = new Date('2024-01-16T15:00:00Z');
      expect(getNextAvailableMessage(date)).toBe('shortly');
    });

    it('returns "Monday morning" on Friday after hours', () => {
      // Friday 5:00 PM ET (22:00 UTC)
      const date = new Date('2024-01-19T22:00:00Z');
      expect(getNextAvailableMessage(date)).toBe('Monday morning');
    });

    it('returns "Monday morning" on weekends', () => {
      // Saturday 10:00 AM ET
      const date = new Date('2024-01-20T15:00:00Z');
      expect(getNextAvailableMessage(date)).toBe('Monday morning');
    });

    it('returns "tomorrow morning" on weekday evenings', () => {
      // Monday 5:00 PM ET (after hours)
      const date = new Date('2024-01-15T22:00:00Z');
      expect(getNextAvailableMessage(date)).toBe('tomorrow morning');
    });

    it('returns "tomorrow morning" on Thursday evening', () => {
      // Thursday 5:00 PM ET
      const date = new Date('2024-01-18T22:00:00Z');
      expect(getNextAvailableMessage(date)).toBe('tomorrow morning');
    });
  });

  describe('getBusinessHoursStatus', () => {
    it('returns open status during business hours', () => {
      // Wednesday 2:00 PM ET
      const date = new Date('2024-01-17T19:00:00Z');
      const status = getBusinessHoursStatus(date);

      expect(status.isBusinessHours).toBe(true);
      expect(status.isAfterHours).toBe(false);
      expect(status.isWeekend).toBe(false);
      expect(status.nextAvailable).toBe('shortly');
    });

    it('returns closed status after hours', () => {
      // Monday 6:00 PM ET
      const date = new Date('2024-01-15T23:00:00Z');
      const status = getBusinessHoursStatus(date);

      expect(status.isBusinessHours).toBe(false);
      expect(status.isAfterHours).toBe(true);
      expect(status.isWeekend).toBe(false);
      expect(status.nextAvailable).toContain('tomorrow morning');
    });

    it('returns closed status on weekends', () => {
      // Saturday 12:00 PM ET
      const date = new Date('2024-01-20T17:00:00Z');
      const status = getBusinessHoursStatus(date);

      expect(status.isBusinessHours).toBe(false);
      expect(status.isAfterHours).toBe(false);
      expect(status.isWeekend).toBe(true);
      expect(status.nextAvailable).toContain('Monday morning');
    });

    it('correctly identifies Friday evening', () => {
      // Friday 5:00 PM ET (after hours)
      const date = new Date('2024-01-19T22:00:00Z');
      const status = getBusinessHoursStatus(date);

      expect(status.isBusinessHours).toBe(false);
      expect(status.isAfterHours).toBe(true);
      expect(status.isWeekend).toBe(false);
      expect(status.nextAvailable).toBe('Monday morning');
    });

    it('correctly identifies Sunday', () => {
      // Sunday 12:00 PM ET (next business day is Monday, which is tomorrow)
      const date = new Date('2024-01-21T17:00:00Z');
      const status = getBusinessHoursStatus(date);

      expect(status.isBusinessHours).toBe(false);
      expect(status.isAfterHours).toBe(false);
      expect(status.isWeekend).toBe(true);
      // Sunday → Monday is "tomorrow morning"
      expect(status.nextAvailable).toBe('tomorrow morning');
    });
  });
});
