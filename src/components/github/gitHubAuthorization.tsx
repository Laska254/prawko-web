// GitHub's authorization code flow with PKCE, run in the browser. The server exchanges the code, as that takes the client
// secret: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const STORAGE_KEY = "gitHubAuthorization";
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

// What the server needs, next to GitHub's code, to exchange it: the verifier of the authorization this tab started, and
// the redirect URI it was started with, which has to be sent again.
export interface GitHubAuthorization {
    readonly codeVerifier: string;
    readonly redirectUri: string;
}

// What this tab keeps of the authorization it started: `state` tells GitHub's answer to it from a forged link.
interface StartedAuthorization extends GitHubAuthorization {
    readonly state: string;
}

// Whether an authorization can start: outside a secure context (HTTPS or localhost), browsers have no `crypto.subtle`.
export function isGitHubAuthorizationSupported(): boolean {
    return crypto.subtle !== undefined;
}

// Leaves the app for GitHub's consent page, which sends the user back to `redirectPath` of this origin. GitHub accepts
// only a callback URL of the app's settings, matched exactly.
export async function startGitHubAuthorization(clientId: string, redirectPath: string): Promise<void> {
    const state = randomString(STATE_BYTES);
    const codeVerifier = randomString(CODE_VERIFIER_BYTES);
    const redirectUri = `${window.location.origin}${redirectPath}`;
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "user:email",
        state,
        code_challenge: await codeChallenge(codeVerifier),
        code_challenge_method: "S256",
    });
    // In `sessionStorage`, as the page is left and this tab comes back to it.
    const started: StartedAuthorization = {state, codeVerifier, redirectUri};
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(started));
    window.location.assign(`${AUTHORIZE_URL}?${params}`);
}

// The authorization this tab started, if `state` is that authorization's; `null` for any other link, which may be
// forged. Either way the authorization can't be used again.
export function takeGitHubAuthorization(state: string | null): GitHubAuthorization | null {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (stored === null) {
        return null;
    }
    const {state: startedState, codeVerifier, redirectUri}: StartedAuthorization = JSON.parse(stored);
    if (state !== startedState) {
        return null;
    }
    return {codeVerifier, redirectUri};
}
