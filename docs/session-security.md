# Session secret configuration

Tradeix signs session cookies using `SESSION_SECRET`.

## Local development

Copy `.env.example` to `.env.local` and replace the placeholder with a unique secret. A development-only fallback is retained for local work when `NODE_ENV` is not `production`.

## Production

**Required:** Set `SESSION_SECRET` to a unique, unpredictable value of at least 32 characters. The application now rejects signing new sessions if the production secret is absent or too short; it will not silently sign with the documented development fallback.

Generate a secret with:

```bash
openssl rand -base64 48
```

Store the value in your deployment platform's secret manager, not in Git or Docker images. Use the same secret across instances serving the same sessions. Rotating it invalidates existing sessions, requiring users to sign in again.

## Validation

```bash
npm test
npm run build
```

This safeguard is a minimum length check, **not** an entropy validator: avoid predictable repeated strings and shared passwords. Confirm production environment variables are available to the runtime, not exposed as `NEXT_PUBLIC_*` values.
