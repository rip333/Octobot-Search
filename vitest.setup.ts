import { afterEach } from 'vitest';

/**
 * Testing Library's auto-cleanup only registers when a DOM exists, so this
 * unmounts between tests in jsdom files and does nothing in node ones.
 */
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
