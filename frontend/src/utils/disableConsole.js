/**
 * Disable console debug logs when running in production mode.
 * Keeps console.error so errors are still visible.
 */
 
if (import.meta.env.MODE === 'production') {
  ['log', 'debug', 'info', 'warn', 'trace'].forEach(method => {
    console[method] = () => {};
  });
} 