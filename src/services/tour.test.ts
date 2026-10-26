import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTourCompleted,
  markTourCompleted,
  resetTourStatus,
  getTourStorageKey,
  ONBOARDING_TOUR_STEPS,
} from './tour';

// Mock storage implementation for node test environment
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

test('getTourStorageKey formats key with user id correctly', () => {
  assert.equal(getTourStorageKey('usr_sarah'), 'hirematch_tour_completed_usr_sarah');
  assert.equal(getTourStorageKey(''), 'hirematch_tour_completed_guest');
});

test('tour completion persistence lifecycle functions work accurately', () => {
  const storage = new MockStorage();
  const userId = 'usr_test_123';

  // Initially incomplete
  assert.equal(isTourCompleted(userId, storage), false);

  // Mark as completed
  markTourCompleted(userId, storage);
  assert.equal(isTourCompleted(userId, storage), true);
  assert.equal(storage.getItem('hirematch_tour_completed_usr_test_123'), 'true');

  // Reset status
  resetTourStatus(userId, storage);
  assert.equal(isTourCompleted(userId, storage), false);
  assert.equal(storage.getItem('hirematch_tour_completed_usr_test_123'), null);
});

test('onboarding tour steps are well-formed and contain all critical targets', () => {
  assert.ok(Array.isArray(ONBOARDING_TOUR_STEPS));
  assert.ok(ONBOARDING_TOUR_STEPS.length >= 8);

  const expectedTargets = [
    '#tour-command-center',
    '#tour-dashboard-kpis',
    '#tour-create-job-btn',
    '#tour-bulk-parse-btn',
    '#tour-recruitment-funnel',
    '#tour-priority-alerts',
    '#tour-global-search',
    '#tour-sidebar-nav',
    '#tour-theme-toggle',
    '#tour-user-menu',
  ];

  for (const target of expectedTargets) {
    const step = ONBOARDING_TOUR_STEPS.find((s) => s.target === target);
    assert.ok(step, `Missing expected tour step target: ${target}`);
    assert.ok(step.title && step.title.length > 0, `Step ${target} has no title`);
    assert.ok(step.content && step.content.length > 0, `Step ${target} has no content`);
  }
});
