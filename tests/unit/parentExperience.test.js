import { describe, expect, it, vi } from 'vitest';
import { createParentDashboardService } from '#api/modules/parent-dashboard/index.js';

function makeService(overrides = {}) {
  return createParentDashboardService({ repositories: {
    getHouseholdPreferences: async () => null,
    saveHouseholdPreferences: async (_householdId, values) => values,
    recordProductAnalyticsEvent: vi.fn(),
    ...overrides
  } });
}

describe('parent experience privacy', () => {
  it('does not record product-improvement events without a parent opt-in', async () => {
    const recordProductAnalyticsEvent = vi.fn();
    const service = makeService({ recordProductAnalyticsEvent });
    await expect(service.recordProductEvent({ household_id: 'household' }, { eventName: 'device_handoff_selected' })).resolves.toEqual({ accepted: false });
    expect(recordProductAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('records only allowlisted events after a parent has opted in', async () => {
    const recordProductAnalyticsEvent = vi.fn();
    const service = makeService({ getHouseholdPreferences: async () => ({ productAnalyticsConsent: true }), recordProductAnalyticsEvent });
    await expect(service.recordProductEvent({ household_id: 'household' }, { eventName: 'device_handoff_selected' })).resolves.toEqual({ accepted: true });
    expect(recordProductAnalyticsEvent).toHaveBeenCalledWith('household', 'device_handoff_selected');
    await expect(service.recordProductEvent({ household_id: 'household' }, { eventName: 'child_free_text' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
