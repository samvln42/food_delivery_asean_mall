/**
 * Disable console debug logs when running in production mode.
 * Keeps console.error so errors are still visible.
 */
/* eslint-disable no-console */
if (import.meta.env.MODE === 'production') {
  ['log', 'debug', 'info', 'warn', 'trace'].forEach(method => {
    console[method] = () => {};
  });
} 