import {startGitHubAuthorization} from "@/components/github/gitHubAuthorization.tsx";

// Starts a sign in (or another GitHub flow returning to `redirectPath`) with the redirect held back, as jsdom can't
// navigate. Returns the URL the browser was sent to.
export async function startSignIn(clientId = "client-id", redirectPath = "/auth/github/callback"): Promise<URL> {
    const assign = vi.fn();
    vi.stubGlobal("location", {...window.location, assign});
    await startGitHubAuthorization(clientId, redirectPath);
    vi.unstubAllGlobals();
    expect(assign).toHaveBeenCalledTimes(1);
    return new URL(assign.mock.calls[0][0]);
}

// The `state` of a sign in this tab started, which GitHub hands back to the callback page.
export async function startedState(): Promise<string> {
    const {searchParams} = await startSignIn();
    return searchParams.get("state")!;
}
