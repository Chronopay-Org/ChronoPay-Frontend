import { describe, it, expect } from 'vitest';
import {
  DISPUTE_CATEGORIES,
  DISPUTE_STATUS_LABELS,
  DISPUTE_RESOLUTION_LABELS,
} from './dispute-types';

describe('Dispute Types & Constants', () => {
  describe('DISPUTE_STATUS_LABELS', () => {
    it('should have correct labels for all DisputeStatus values', () => {
      expect(DISPUTE_STATUS_LABELS.draft).toBe('Draft');
      expect(DISPUTE_STATUS_LABELS.submitted).toBe('Submitted');
      expect(DISPUTE_STATUS_LABELS.under_review).toBe('Under Review');
      expect(DISPUTE_STATUS_LABELS.mediator_assigned).toBe('Mediator Assigned');
      expect(DISPUTE_STATUS_LABELS.evidence_review).toBe('Evidence Review');
      expect(DISPUTE_STATUS_LABELS.negotiation).toBe('Negotiation');
      expect(DISPUTE_STATUS_LABELS.resolved).toBe('Resolved');
      expect(DISPUTE_STATUS_LABELS.rejected).toBe('Rejected');
      expect(DISPUTE_STATUS_LABELS.escalated).toBe('Escalated');
    });

    it('should return undefined for invalid status', () => {
      // @ts-expect-error - testing invalid input
      expect(DISPUTE_STATUS_LABELS['invalid_status']).toBeUndefined();
    });

    it('should represent primary state transitions correctly', () => {
       // Validating the keys exist to support expected transition flows
       const initialStates = ['draft', 'submitted'];
       const activeStates = ['under_review', 'mediator_assigned', 'evidence_review', 'negotiation'];
       const terminalStates = ['resolved', 'rejected', 'escalated'];

       initialStates.forEach(state => expect(DISPUTE_STATUS_LABELS).toHaveProperty(state));
       activeStates.forEach(state => expect(DISPUTE_STATUS_LABELS).toHaveProperty(state));
       terminalStates.forEach(state => expect(DISPUTE_STATUS_LABELS).toHaveProperty(state));
    });
  });

  describe('DISPUTE_CATEGORIES', () => {
    it('should have labels and descriptions for all categories', () => {
      expect(DISPUTE_CATEGORIES.service_not_delivered.label).toBe('Service Not Delivered');
      expect(DISPUTE_CATEGORIES.quality_mismatch.label).toBe('Quality Mismatch');
      expect(DISPUTE_CATEGORIES.payment_issue.label).toBe('Payment Issue');
      expect(DISPUTE_CATEGORIES.cancellation_dispute.label).toBe('Cancellation Dispute');
      expect(DISPUTE_CATEGORIES.communication_issue.label).toBe('Communication Issue');
      expect(DISPUTE_CATEGORIES.other.label).toBe('Other');
    });

    it('should return undefined for invalid category', () => {
      // @ts-expect-error - testing invalid input
      expect(DISPUTE_CATEGORIES['invalid_category']).toBeUndefined();
    });
  });

  describe('DISPUTE_RESOLUTION_LABELS', () => {
    it('should have labels for all resolution types', () => {
      expect(DISPUTE_RESOLUTION_LABELS.full_refund).toBe('Full Refund');
      expect(DISPUTE_RESOLUTION_LABELS.partial_refund).toBe('Partial Refund');
      expect(DISPUTE_RESOLUTION_LABELS.service_redelivery).toBe('Service Redelivery');
      expect(DISPUTE_RESOLUTION_LABELS.no_action).toBe('No Action');
      expect(DISPUTE_RESOLUTION_LABELS.compromise).toBe('Compromise');
    });

    it('should return undefined for invalid resolution', () => {
      // @ts-expect-error - testing invalid input
      expect(DISPUTE_RESOLUTION_LABELS['invalid_resolution']).toBeUndefined();
    });
  });
});
