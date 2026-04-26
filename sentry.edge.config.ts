import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Tracing (importante en edge para medir latencia de middleware)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Contexto
  environment: process.env.NODE_ENV,

  debug: false,
});
