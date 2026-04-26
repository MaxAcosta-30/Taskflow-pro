import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Contexto
  environment: process.env.NODE_ENV,

  // No capturar errores de base de datos en local para evitar ruido
  // pero sí en producción
  debug: false,
});
