import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Contexto
  environment: process.env.NODE_ENV,
  
  // Ignorar errores ruidosos de extensiones de navegador
  ignoreErrors: [
    "top.GLOBALS",
    "OriginalConnect",
    "webkitStorageInfo",
    "ResizeObserver loop limit exceeded",
  ],

  debug: false,
});
