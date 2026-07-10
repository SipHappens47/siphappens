import * as Sentry from '@sentry/node';

// Imported first thing in main.ts so Sentry can instrument the app. No-ops
// entirely until SENTRY_DSN is set, so this is safe to ship as-is.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0, // error reporting only; enable tracing later if desired
  });
}
