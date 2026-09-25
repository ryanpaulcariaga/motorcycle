# Feature Specification: Public User Authentication

**Feature Branch**: `008-public-user-authentication`

**Created**: 2026-09-26

**Status**: Implemented

**Input**: User description: "Implement user login for the public web app, similar to admin, using Facebook for now. Any Facebook user may sign in — no manual registration. Save the user's email. Design so a future Google (or other) sign-in method can resolve to the same account when a user has set the same email for both, since the API is shared by web and admin."

## Decisions

| Area | Decision |
|---|---|
| Audience | Public catalog visitors on `apps/web` (and any future first-party public frontend). Distinct from `AdminRole`-gated `apps/admin` sign-in. |
| Provider (now) | Facebook Authorization Code + PKCE, completed server-side by the shared API — same trust boundary as admin sign-in. Facebook access tokens never reach the browser. |
| Registration | None. Any active Facebook identity may sign in; a `User` record is created automatically on first sign-in. There is no admin approval step for public users. |
| Multi-provider identity | A durable `User` (internal identity) is linked to one or more `UserExternalLogin` rows, one per provider, keyed by `(Provider, ProviderUserId)`. This is the standard "external login" pattern used by ASP.NET Core Identity and most production auth systems, chosen over one-row-per-provider-per-account-type designs so a person is one account regardless of how many providers they used to sign in. |
| Account linking | A new external login only auto-links to an existing `User` by email when the provider confirms the email is **verified** (Facebook only returns `email` for verified accounts; a future Google provider would additionally check its `email_verified` claim). An unverified or missing email always creates a new `User`, since auto-merging on an unverified email would let anyone with knowledge of an email claim someone else's account. |
| Extensibility | External providers are a Strategy (`IExternalAuthProvider`), resolved by name through `IExternalAuthProviderFactory` — mirrors the existing `ISpecFilterStrategy` pattern in this codebase. Adding Google means adding one class and its config; the controller, session model, and linking rule do not change. |
| Session | A dedicated `UserAuth` cookie scheme (`mc_user_session`, 30-day sliding expiration) and `AuthenticatedUser` authorization policy, fully separate from the admin `AdminAuth` scheme/`ActiveAdministrator` policy. Session claims carry the internal `User.Id`, never a provider ID, so the session model is provider-independent. |
| API boundary | New anonymous-start, then session-scoped endpoints under `/api/auth/*` on the same shared API used by `apps/web` and `apps/admin`. No new API project or separate backend. |
| Persistence | New `users` and `user_external_logins` tables via EF Core migration, following existing snake_case/JSONB/raw-SQL-index conventions. A case-insensitive unique index on `users.email` (partial, `WHERE email IS NOT NULL`) enforces one account per verified email. |

## Why this shape (real-world precedent)

This follows the same "external login" design used by ASP.NET Core Identity, Firebase Auth, Auth0, and Supabase Auth: one internal user table, plus a join table of `(provider, provider_user_id)` rows pointing back to it. Provider-issued IDs are never reused as the primary key because:

1. A user must be able to add a second provider later without creating a duplicate account.
2. Providers can 401/rotate IDs in edge cases; the internal ID must be stable for foreign keys (future reviews, votes, orders, etc.).
3. Only *verified* provider emails are trusted for automatic linking — this is the same rule Auth0's automatic account linking and Firebase's "account exists with different credential" flow apply, to prevent account takeover through an unverified email claim.

## Out of Scope

- Password/email-only sign-in (no local credential store is introduced).
- Google implementation (config and domain model support it; no `IExternalAuthProvider` for Google is implemented yet).
- Manual linking/unlinking UI for a signed-in user to add a second provider to their own account (a future enhancement once a user profile page exists).
- Any authorization gating of public catalog routes — they remain anonymous; `AuthenticatedUser` is available for future features (reviews, voting) to require sign-in.

## Implementation Notes

- Domain: `Motorcycle.Domain.User`, `Motorcycle.Domain.UserExternalLogin`, `Motorcycle.Domain.ExternalAuthProviders` (provider name constants).
- Application: `IUserRepository`, `IUserAuthService`/`UserAuthService` (find-or-create + linking rule), `IExternalAuthProvider`/`IExternalAuthProviderFactory`, `UserSessionDto`.
- Infrastructure: `UserRepository`, `FacebookExternalAuthProvider`, `ExternalAuthProviderFactory`, EF mapping + `AddPublicUsers` migration.
- Api: `UserAuthenticationController` (`/api/auth/{provider}`, `/api/auth/{provider}/callback`, `/api/auth/session`, `/api/auth/signout`), `UserAuthOptions` (`UserAuth:WebAppUrl`, `UserAuth:Facebook:*`, `UserAuth:Google:*` reserved), second cookie scheme + `AuthenticatedUser` policy in `Program.cs`.
- Web: `apps/web/lib/api.ts` (`getUserSession`, `signOutUser`, `facebookSignInUrl`), `apps/web/components/Header.tsx` sign-in/sign-out control.
- Docs: `docs/database.md`, `docs/api.md`, `docs/architecture.md` updated.
