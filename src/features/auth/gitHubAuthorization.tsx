// GitHub's authorization code flow with PKCE, run in the browser. The server exchanges the code, as that takes the client
// secret: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const STATE_KEY = "gitHubState";
const CODE_VERIFIER_KEY = "gitHubCodeVerifier";
const STATE_BYTES = 16;
// Encodes to 43 characters, the shortest verifier PKCE allows.
const CODE_VERIFIER_BYTES = 32;

function base64Url(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomString(byteCount: number): string {
    return base64Url(crypto.getRandomValues(new Uint8Array(byteCount)));
}

async function codeChallenge(codeVerifier: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
    return base64Url(new Uint8Array(digest));
}

// Where GitHub sends the user back to. The server has to send the same one when it exchanges the code.
export function gitHubRedirectUri(): string {
    return `${window.location.origin}/auth/github/callback`;
}

// Whether a sign in can start: outside a secure context (HTTPS or localhost), browsers have no `crypto.subtle`.
export function isGitHubSignInSupported(): boolean {
    return crypto.subtle !== undefined;
}

// Leaves the app for GitHub's consent page.
export async function startGitHubSignIn(clientId: string): Promise<void> {
    const state = randomString(STATE_BYTES);
    const codeVerifier = randomString(CODE_VERIFIER_BYTES);
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: gitHubRedirectUri(),
        scope: "user:email",
        state,
        code_challenge: await codeChallenge(codeVerifier),
        code_challenge_method: "S256",
    });
    // In `sessionStorage`, as the page is left and this tab comes back to it.
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    window.location.assign(`${AUTHORIZE_URL}?${params}`);
}

// The code verifier of the sign in this tab started, if `state` is that sign in's; `null` for any other link, which may
// be forged. Either way the sign in can't be used again.
export function takeGitHubCodeVerifier(state: string | null): string | null {
    const storedState = sessionStorage.getItem(STATE_KEY);
    const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    if (state !== storedState) {
        return null;
    }
    return codeVerifier;
}
