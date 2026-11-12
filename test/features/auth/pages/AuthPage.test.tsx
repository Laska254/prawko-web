import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AuthPage} from "@/features/auth/pages/AuthPage.tsx";
import {googleSignInDto} from "@test/support/data.tsx";
import {currentLocation, renderAtRoute, renderWithProviders} from "@test/support/render.tsx";
import {mockPendingPost, mockProblem} from "@test/support/server.tsx";
import {ShowLocation} from "@test/support/ShowLocation.tsx";
import {failGoogleScript, googleScripts, loadGoogleScript} from "@test/support/googleScript.tsx";

describe("AuthPage", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("shows the sign in form next to the app panel", () => {
        renderWithProviders(<AuthPage/>, {route: "/auth"});

        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(screen.getByText("Welcome back. Sign in to continue practicing.")).toBeInTheDocument();
        expect(screen.getByText(/^Don't have an account\?/)).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: "Prepare for your driving theory exam."})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Language"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Theme: system"})).toBeInTheDocument();
    });

    it.each([
        ["Official exam format", "The exact same exam format as the official one."],
        ["Every license category", "Practice for all categories."],
        ["Track your progress", "Review past attempts and see how your scores improve."],
    ])("lists the %s feature", (title, description) => {
        renderWithProviders(<AuthPage/>, {route: "/auth"});

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
    });

    it("has no Google sign in without a client ID", () => {
        renderWithProviders(<AuthPage/>, {route: "/auth"});

        expect(googleScripts()).toHaveLength(0);
        expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    });

    it("keeps the Google button on both forms with a client ID", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth"});
        const {configs} = loadGoogleScript();
        expect(await screen.findByRole("button", {name: "Continue with Google"})).toBeInTheDocument();
        expect(configs[0].client_id).toBe("client-id");

        await user.click(screen.getByRole("button", {name: "Create one"}));

        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Continue with Google"})).toBeInTheDocument();
    });

    it("keeps the GitHub button on both forms with a client ID", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth"});
        expect(screen.getByRole("button", {name: "Continue with GitHub"})).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Create one"}));

        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Continue with GitHub"})).toBeInTheDocument();
    });

    it("drops a Google error when switching forms, and the button still signs in", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth"});
        const {sendCredential} = loadGoogleScript();
        await screen.findByRole("button", {name: "Continue with Google"});
        mockProblem("/auth/google", 409);
        await sendCredential(googleSignInDto.idToken);
        expect(await screen.findByRole("alert")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Create one"}));

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(await screen.findByRole("button", {name: "Continue with Google"})).toBeInTheDocument();

        mockProblem("/auth/google", 401);
        await sendCredential(googleSignInDto.idToken);

        expect(await screen.findByRole("alert")).toHaveTextContent("Signing in with Google failed. Please try again.");
    });

    it("keeps a Google sign in going when switching forms, and shows its failure on the other form", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth"});
        const {sendCredential} = loadGoogleScript();
        await screen.findByRole("button", {name: "Continue with Google"});
        const {respond} = mockPendingPost("/auth/google", 401);
        await sendCredential(googleSignInDto.idToken);

        await user.click(screen.getByRole("button", {name: "Create one"}));

        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Continue with Google"}).parentElement).toHaveAttribute("inert");

        respond();

        expect(await screen.findByRole("alert")).toHaveTextContent("Signing in with Google failed. Please try again.");
        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
    });

    it("keeps Google's button when switching forms, without rendering it again", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth"});
        const {buttons} = loadGoogleScript();
        await screen.findByRole("button", {name: "Continue with Google"});

        await user.click(screen.getByRole("button", {name: "Create one"}));

        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
        expect(buttons).toHaveLength(1);
    });

    it("doesn't try Google's script again when switching forms", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth"});
        failGoogleScript();
        await waitFor(() => expect(screen.queryByRole("separator")).not.toBeInTheDocument());

        await user.click(screen.getByRole("button", {name: "Create one"}));

        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
        expect(googleScripts()).toHaveLength(0);
        expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    });

    it("switches between sign in and registration", async () => {
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth"});

        await user.click(screen.getByRole("button", {name: "Create one"}));
        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
        expect(screen.getByText("Start practicing for your exam in under a minute.")).toBeInTheDocument();
        expect(screen.getByText(/^Already have an account\?/)).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Sign in"}));
        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
    });

    it.each([
        ["verified", "Your email is verified. You can sign in with it now.", "SuccessOutlinedIcon"],
        ["passwordReset", "Your password has been changed. You can sign in now.", "SuccessOutlinedIcon"],
        ["sessionExpired", "Your session has expired. Sign in again to continue.", "InfoOutlinedIcon"],
    ])("shows the %s notice until the user switches forms", async (notice, message, icon) => {
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth", state: {notice}});

        expect(screen.getByRole("alert")).toHaveTextContent(message);
        expect(within(screen.getByRole("alert")).getByTestId(icon)).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Create one"}));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Sign in"}));
        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows a failure from another page as an error until the user switches forms", async () => {
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth", state: {failure: "messages.gitHubDenied"}});

        expect(screen.getByRole("alert")).toHaveTextContent("Signing in with GitHub was cancelled.");
        expect(within(screen.getByRole("alert")).getByTestId("ErrorOutlineIcon")).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Create one"}));

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows a generic failure from another page", () => {
        renderWithProviders(<AuthPage/>, {route: "/auth", state: {failure: "errors:network"}});

        expect(screen.getByRole("alert")).toHaveTextContent("Can't reach the server. Check your connection and try again.");
    });

    it("clears a failure from the navigation state, so a reload or going back doesn't show it again", () => {
        renderAtRoute(<><AuthPage/><ShowLocation/></>, "/auth", {failure: "messages.gitHubDenied"});

        expect(screen.getByRole("alert")).toHaveTextContent("Signing in with GitHub was cancelled.");
        expect(currentLocation()).toEqual({pathname: "/auth", search: "", state: null});
    });

    it("clears the notice from the navigation state, so a reload or going back doesn't show it again", () => {
        renderAtRoute(<><AuthPage/><ShowLocation/></>, "/auth", {notice: "sessionExpired"});

        expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired. Sign in again to continue.");
        expect(currentLocation()).toEqual({pathname: "/auth", search: "", state: null});
    });

    it("leaves the navigation state alone without a notice", () => {
        renderAtRoute(<><AuthPage/><ShowLocation/></>, "/auth", {other: true});

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(currentLocation()).toEqual({pathname: "/auth", search: "", state: {other: true}});
    });
});
