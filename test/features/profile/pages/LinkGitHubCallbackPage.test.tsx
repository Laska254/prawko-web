import {screen} from "@testing-library/react";
import {Route, Routes} from "react-router";
import {LinkGitHubCallbackPage} from "@/features/profile/pages/LinkGitHubCallbackPage.tsx";
import {startSignIn} from "@test/support/gitHubSignIn.tsx";
import {currentLocation, renderWithProviders} from "@test/support/render.tsx";
import {ShowLocation} from "@test/support/ShowLocation.tsx";

const PATH = "/auth/github/callback/link";

// The `state` of a link this tab started.
async function startedLink(): Promise<string> {
    const {searchParams} = await startSignIn("client-id", PATH);
    return searchParams.get("state")!;
}

// Opens the page as GitHub sends the user back, with `params` in the query string.
function renderCallback(params: Record<string, string>) {
    renderWithProviders(
        <Routes>
            <Route path={PATH} element={<LinkGitHubCallbackPage/>}/>
            <Route path="*" element={<ShowLocation/>}/>
        </Routes>,
        {route: `${PATH}?${new URLSearchParams(params)}`}
    );
}

describe("LinkGitHubCallbackPage", () => {
    it("hands GitHub's code to the profile with what it takes to exchange it", async () => {
        renderCallback({code: "code", state: await startedLink()});

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toEqual({
            pathname: "/profile",
            search: "",
            state: {
                gitHubLink: {
                    code: "code",
                    codeVerifier: expect.stringMatching(/^[\w-]{43}$/),
                    redirectUri: `${window.location.origin}${PATH}`,
                },
            },
        });
    });

    it("goes back to the profile without a word when consent was denied", async () => {
        renderCallback({error: "access_denied", state: await startedLink()});

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/profile", state: null});
    });

    it.each([
        ["a state this tab didn't start", async () => ({code: "code", state: "forged"})],
        ["no code", async () => ({state: await startedLink()})],
        ["another error from GitHub", async () => ({error: "redirect_uri_mismatch", state: await startedLink()})],
    ])("tells the profile that linking failed with %s", async (_, params) => {
        renderCallback(await params());

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/profile", state: {failure: "link.gitHubInvalid"}});
    });
});
