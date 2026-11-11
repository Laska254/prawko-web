# Configuration

## Server

Application URL: `http://localhost:5173/`

Server URL: `http://localhost:8080/` (set via `VITE_API_URL` in `.env.development`; set it in the environment or a `.env.production` for production builds)

Prawko Server must allow CORS requests from the application URL.

## Sign in with Google

Optional: without `VITE_GOOGLE_CLIENT_ID` the button isn't shown.

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), create an OAuth client ID of type
   *Web application*. Under *Authorized JavaScript origins* add the application URL of each environment; for development
   that's both `http://localhost` and `http://localhost:5173`.
2. Set its ID as `VITE_GOOGLE_CLIENT_ID`, in `.env.development.local` (not committed) or the environment of a production
   build.
3. Give the server the same ID, as it checks that ID tokens were issued for it; without it `POST /auth/google` answers
   `404`. In production set `GOOGLE_CLIENT_IDS`; locally set `google.client-ids` in `application-dev.yaml`, see the
   server's [Local configuration](https://github.com/Laska254/prawko-server/blob/main/docs/configuration.md#local-configuration).

A Content Security Policy has to allow Google's script: `https://accounts.google.com/gsi/client` in `script-src`,
`https://accounts.google.com/gsi/` in `frame-src` and `connect-src`, and `https://accounts.google.com/gsi/style` in
`style-src`.

## Sign in with GitHub

Optional: without `VITE_GITHUB_CLIENT_ID` the button isn't shown. It also needs HTTPS or `localhost`, as browsers can't
create the PKCE challenge anywhere else.

1. In [GitHub's developer settings](https://github.com/settings/developers), create an OAuth app for each environment
   and give it two callback URLs: the application URL followed by `/auth/github/callback` for signing in, and by
   `/auth/github/callback/link` for linking GitHub on the profile. For development those are
   `http://localhost:5173/auth/github/callback` and `http://localhost:5173/auth/github/callback/link`. GitHub matches
   each exactly, so leave wildcard matching off.
2. Set its client ID as `VITE_GITHUB_CLIENT_ID`, in `.env.development.local` (not committed) or the environment of a
   production build.
3. Generate a client secret and give the server both, as it exchanges the code for GitHub's access token; without them
   `POST /auth/github` answers `404`. In production set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`; locally set
   `github.client-id` and `github.client-secret` in `application-dev.yaml`, see the server's
   [Local configuration](https://github.com/Laska254/prawko-server/blob/main/docs/configuration.md#local-configuration).
