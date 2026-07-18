import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

// The AWS/Google config (~auth/awsConfig) throws at module load when either of
// these is missing — stub harmless values so importing app modules is safe.
// Tests never hit AWS: the data adapter / auth provider are mocked instead.
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id.apps.googleusercontent.com');
vi.stubEnv('VITE_COGNITO_IDENTITY_POOL_ID', 'ap-southeast-2:00000000-0000-0000-0000-000000000000');

// Unmount React trees and reset mocks between tests.
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});

// jsdom has no matchMedia; stub it for components that may query it.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
