import {isGitHubAuthorizationSupported, takeGitHubAuthorization} from "@/components/github/gitHubAuthorization.tsx";
import {startSignIn} from "@test/support/gitHubSignIn.tsx";

// The example of RFC 7636, appendix B.
const VERIFIER_BYTES = [
    116, 24, 223, 180, 151, 153, 224, 37, 79, 250, 96, 125, 216, 173, 187, 186,
    22, 212, 37, 77, 105, 214, 191, 240, 91, 88, 5, 88, 83, 132, 141, 121,
];
const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

describe("gitHubAuthorization", () => {
    afterEach(() => vi.restoreAllMocks());

    it("sends the browser to GitHub's consent page with the client ID, callback and scope", async () => {
        const url = await startSignIn("my-client");

        expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
        expect(url.searchParams.get("client_id")).toBe("my-client");
        expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/auth/github/callback");
        expect(url.searchParams.get("scope")).toBe("user:email");
        expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    });

    it("sends the S256 challenge of the verifier it stored", async () => {
        vi.spyOn(crypto, "getRandomValues").mockImplementation(array => {
            (array as unknown as Uint8Array).set(VERIFIER_BYTES.slice(0, (array as unknown as Uint8Array).length));
            return array;
        });

        const {searchParams} = await startSignIn();

        expect(searchParams.get("code_challenge")).toBe(CHALLENGE);
        expect(takeGitHubAuthorization(searchParams.get("state"))?.codeVerifier).toBe(VERIFIER);
    });

    it("uses a different state and verifier for each sign in", async () => {
        const first = await startSignIn();
        const second = await startSignIn();

        expect(first.searchParams.get("state")).not.toBe(second.searchParams.get("state"));
        expect(first.searchParams.get("code_challenge")).not.toBe(second.searchParams.get("code_challenge"));
    });

    it("is supported with crypto.subtle", () => {
        expect(isGitHubAuthorizationSupported()).toBe(true);
    });

    it("isn't supported without crypto.subtle, as outside a secure context", () => {
        vi.spyOn(crypto, "subtle", "get").mockReturnValue(undefined as unknown as SubtleCrypto);

        expect(isGitHubAuthorizationSupported()).toBe(false);
    });

    it("gives the started sign in for its state, only once", async () => {
        const {searchParams} = await startSignIn();
        const state = searchParams.get("state");

        expect(takeGitHubAuthorization(state)).toEqual({
            codeVerifier: expect.stringMatching(/^[\w-]{43}$/),
            redirectUri: "http://localhost:3000/auth/github/callback",
        });
        expect(takeGitHubAuthorization(state)).toBeNull();
    });

    it("gives nothing for another state, and ends the started sign in", async () => {
        const {searchParams} = await startSignIn();

        expect(takeGitHubAuthorization("forged")).toBeNull();
        expect(takeGitHubAuthorization(searchParams.get("state"))).toBeNull();
    });

    it("gives nothing for a link without a state, and ends the started sign in", async () => {
        const {searchParams} = await startSignIn();

        expect(takeGitHubAuthorization(null)).toBeNull();
        expect(takeGitHubAuthorization(searchParams.get("state"))).toBeNull();
    });

    it("gives nothing when there's no state and no sign in was started", () => {
        expect(takeGitHubAuthorization(null)).toBeNull();
    });

    it("redirects back to the given page of this origin, and gives that redirect URI back", async () => {
        const {searchParams} = await startSignIn("client-id", "/auth/github/callback/link");

        expect(searchParams.get("redirect_uri")).toBe(`${window.location.origin}/auth/github/callback/link`);
        expect(takeGitHubAuthorization(searchParams.get("state"))?.redirectUri)
            .toBe(`${window.location.origin}/auth/github/callback/link`);
    });
});
