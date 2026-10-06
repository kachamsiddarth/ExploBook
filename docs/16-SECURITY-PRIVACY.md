# 16 — Security and Privacy

## Authentication

Clerk is the canonical authentication provider.

- Do not implement or store application passwords.
- Use `@clerk/nextjs` in the Next.js application.
- Use `clerkMiddleware()` in Next.js for Clerk integration and resource-level protection.
- Use `@clerk/express` `clerkMiddleware()` before protected Express routes. Clerk's middleware validates the session JWT and attaches authentication state to the request.
- Use the verified Clerk `userId` as the identity boundary.
- Store only the local profile and the Clerk subject (`clerkUserId`) in MongoDB; never store Clerk secret keys or raw session tokens.
- Keep `CLERK_SECRET_KEY` server-side only.
- Use Clerk's hosted/prebuilt authentication flows or Clerk components for sign-in/sign-up rather than building password forms.

## Authorization

Every user-owned query must be scoped to the authenticated principal.

Bad:
```ts
findReview({ _id: req.params.id })
```

Good:
```ts
findReview({ _id: req.params.id, userId: auth.userId })
```

## Secrets

Never expose:
- `MONGODB_URI`
- `ELEVENLABS_API_KEY`
- `SERPAPI_KEY`
- Sentry auth tokens
- model provider credentials

## AI privacy

- Do not send unnecessary user data to external providers.
- Minimize review text sent to external services.
- Local Gemma should be preferred for sensitive semantic processing where practical.
- Do not infer sensitive personal attributes from reading behavior.

## Prompt injection

Treat book metadata, search results and user reviews as untrusted content. They are data, not instructions.

## External links

Purchase/search links must be displayed as external links. Do not claim endorsement or guarantee price/availability.

## Copyright

Do not host or generate full copyrighted books. The reading demo should use public-domain material, user-provided content where legally permitted, or external legal acquisition links.

## Abuse controls

- Rate-limit AI generation.
- Rate-limit voice generation more aggressively because it incurs provider cost.
- Cap review length.
- Cap TTS text length.
- Cache identical voice requests.
