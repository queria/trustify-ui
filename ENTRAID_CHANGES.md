# Entra ID E2E Test Authentication via Token Injection

## Problem

Running e2e tests against a TPA instance configured with Microsoft Entra ID as
OIDC provider is not possible when the only available user accounts are
corporate SSO-federated identities requiring 2FA. The existing e2e auth flow
fills a browser login form with `PLAYWRIGHT_AUTH_USER` / `PLAYWRIGHT_AUTH_PASSWORD`,
which cannot work with SSO/MFA-protected accounts. Creating local test users in
Entra ID is also not an option when user management permissions are restricted.

## Solution

Added a `token_injection` auth mode for UI tests. Instead of filling a login
form, the test runner:

1. Fetches the deployed frontend's `index.html` to discover `OIDC_SERVER_URL`
   and `OIDC_CLIENT_ID` from the `window._env` configuration.
2. Obtains an access token from Entra ID using the OAuth2 `client_credentials`
   grant with an App Registration's `client_id` + `client_secret`.
3. Injects the token into `sessionStorage` (via Playwright's `addInitScript`)
   using the key format `oidc.user:{authority}:{clientId}` before the React app
   loads.
4. When the app initializes, `react-oidc-context` finds the token in
   sessionStorage, considers the user authenticated, and skips the OIDC login
   redirect.

This requires an Azure App Registration with a client secret and appropriate
API permissions for the TPA backend, but does **not** require creating any user
accounts.

## Files Changed

### `e2e/tests/common/constants.ts`

Added three new exports:

- `UI_AUTH_MODE` (`PLAYWRIGHT_UI_AUTH_MODE`) - Selects auth mode: `form`
  (default, existing behavior) or `token_injection`.
- `AUTH_SCOPE` (`PLAYWRIGHT_AUTH_SCOPE`) - OAuth2 scope for the
  `client_credentials` token request (e.g., `api://<app-id>/.default`).
- `TRUSTIFY_UI_URL` (`TRUSTIFY_UI_URL`) - Frontend URL used to auto-discover
  OIDC settings from the deployment.

### `e2e/tests/ui/helpers/Auth.ts`

Restructured into two auth paths dispatched by `UI_AUTH_MODE`:

- `loginWithForm()` - Original browser form login, unchanged.
- `loginWithTokenInjection()` - New path using client credentials and
  sessionStorage injection.
- `login()` - Public entry point that selects the mode.

The token injection path reuses the existing `PLAYWRIGHT_AUTH_CLIENT_ID`,
`PLAYWRIGHT_AUTH_CLIENT_SECRET`, and `PLAYWRIGHT_AUTH_URL` env vars (shared
with API tests).

### `e2e/README.md`

Documented the new environment variables in the "For UI tests" table.

## Usage

```bash
export TRUSTIFY_UI_URL=https://your-tpa-instance.example.com
export AUTH_REQUIRED=true
export PLAYWRIGHT_UI_AUTH_MODE=token_injection
export PLAYWRIGHT_AUTH_CLIENT_ID=<App Registration client ID>
export PLAYWRIGHT_AUTH_CLIENT_SECRET=<App Registration client secret>
export PLAYWRIGHT_AUTH_SCOPE=api://<backend-app-id-uri>/.default
# Optional - auto-discovered from frontend if not set:
# export PLAYWRIGHT_AUTH_URL=https://login.microsoftonline.com/<tenant-id>/v2.0
```

## Permissions / Authorization

The `client_credentials` token represents an application identity, not a user.
Authorization depends on how the TPA backend is configured:

- **With `auth.yaml` on `trustd`**: If the backend's `auth.yaml` directly maps
  the API/CLI client ID to internal permissions (e.g., `read.sbom`,
  `create.advisory`), the token works without any `roles` claim in the JWT.
  This is useful when you lack Entra ID admin permissions to grant app role
  consent.
- **With Entra ID app roles**: If relying on the standard setup from the TPA
  docs, the API App Registration needs app roles (`API App / create:document`, etc.)
  assigned and admin-consented in API Permissions
  so they appear in the token's `roles` claim.
  The backend's `scopeMappings` then maps these to internal permissions.

## Other Limitations

The UI will display the API client ID (e.g., `660ae41f-...`) as the username
in the top-right corner, since the token has no user profile information. This
is cosmetic and does not affect test execution.
