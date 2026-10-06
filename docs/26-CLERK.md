# 26 — Clerk Authentication Specification

## 1. Decision

Clerk is the canonical authentication and session provider for ExploBook. The application does not implement password hashing, login sessions, OAuth credential storage, or custom authentication flows.

Clerk's Next.js SDK provides prebuilt React components, hooks and server helpers. `clerkMiddleware()` integrates Clerk into the Next.js application, while `@clerk/express` middleware verifies Clerk session state for the separate Express API. urlClerk Next.js SDKhttps://clerk.com/docs/reference/nextjs/overview urlClerk Express middlewarehttps://clerk.com/docs/reference/express/clerk-middleware

## 2. Identity model

```text
Clerk user
   │
   │ userId
   ▼
Express auth middleware
   │
   ▼
local MongoDB users document
   │
   ├── _id: ObjectId
   ├── clerkUserId: string (unique)
   ├── email
   └── displayName
   │
   ▼
user-owned ExploBook data
```

The stable identity boundary is `clerkUserId`. Domain repositories may use the local MongoDB `_id` internally, but that local user must first be resolved from the verified Clerk identity.

## 3. Frontend

Use `@clerk/nextjs`.

Required concepts:

- `ClerkProvider` at the application root.
- `clerkMiddleware()` in the Next.js middleware/proxy file appropriate for the installed Next.js version.
- Clerk `SignIn`, `SignUp`, `UserButton`, `SignedIn` and `SignedOut` components/hooks as appropriate.
- Public pages: landing page, sign-in, sign-up.
- Protected pages: onboarding, home, recommendations, reading mode, reflection, history, Orbs, Reader DNA and missions.

Clerk's current Next.js quickstart documents `@clerk/nextjs`, `ClerkProvider`, `clerkMiddleware()` and the publishable/secret key environment variables. urlClerk Next.js Quickstarthttps://clerk.com/docs/nextjs/getting-started/quickstart

## 4. Backend

Use `@clerk/express`. Register `clerkMiddleware()` before protected routes. Clerk's Express middleware checks cookies/headers for the session JWT and attaches authentication state to the request. urlClerk Express middleware referencehttps://clerk.com/docs/reference/express/clerk-middleware

Conceptual request path:

```text
Browser
  │
  │ Clerk-authenticated request
  ▼
Express clerkMiddleware()
  │
  ├── unauthenticated → 401
  │
  └── authenticated
          │
          ▼
      getAuth(req)
          │
          ▼
       clerkUserId
          │
          ▼
     resolve local user
          │
          ▼
       repository
```

Do not accept `userId` from request bodies for user-owned operations. The backend derives identity from Clerk.

## 5. Local user provisioning

On the first authenticated request that requires an application profile:

1. Read the verified Clerk `userId`.
2. Look up `users.clerkUserId`.
3. If missing, create the local user using the verified Clerk profile fields available to the backend.
4. Create the default `readerProfiles` document.
5. Continue to the requested resource.

This avoids making the core product dependent on a Clerk webhook during the MVP. A later phase may add Clerk webhooks for profile synchronization/deletion.

## 6. Auth API

The application does **not** expose:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`

Clerk owns those flows. ExploBook exposes:

### `GET /api/v1/auth/me`

Requires a valid Clerk session. Returns:

```json
{
  "user": {
    "id": "local-mongodb-user-id",
    "clerkUserId": "user_...",
    "email": "reader@example.com",
    "displayName": "Reader"
  }
}
```

The frontend may use Clerk's client/server state directly for UI gating and call `/auth/me` when it needs the local application profile.

## 7. Authorization

Every user-owned operation follows:

```text
Clerk session
    ↓
verified clerkUserId
    ↓
local user lookup
    ↓
repository query scoped by local user ID
```

Example:

```ts
const { userId } = getAuth(req);
if (!userId) return res.status(401).json({ error: 'UNAUTHENTICATED' });

const user = await users.findByClerkUserId(userId);
const review = await reviews.findOne({ _id: reviewId, userId: user._id });
```

## 8. Environment variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Never expose `CLERK_SECRET_KEY` to browser code.

## 9. UI customization

Clerk's authentication components should be visually integrated into ExploBook instead of looking like an unrelated SaaS widget.

Theme requirements:

- warm ivory/cream background
- charcoal typography
- muted gold accents
- editorial serif/sans-serif pairing
- restrained borders and shadows
- generous whitespace

The sign-in page should feel like part of the ExploBook literary experience while Clerk remains responsible for authentication security.

## 10. Testing

Minimum tests:

- unauthenticated request → 401
- authenticated Clerk user → local user resolved
- first login → local user/profile created
- repeat request → no duplicate local user
- user A cannot read user B's reviews/sessions/Orbs
- expired/invalid Clerk session → rejected
- client-supplied `userId` cannot override authenticated identity
- public landing/sign-in/sign-up pages remain accessible
- protected application pages require authentication

## 11. Production checklist

- Configure separate Clerk development and production instances/environments as appropriate.
- Configure allowed origins and redirect URLs.
- Set production `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in deployment secrets.
- Verify Vercel frontend and Render API origins.
- Confirm cookies/session behavior across the deployed frontend/API topology.
- Never commit Clerk keys.
