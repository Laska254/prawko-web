import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {SignInMethods} from "@/features/profile/components/SignInMethods.tsx";
import {user} from "@test/support/data.tsx";
import {googleScripts, loadGoogleScript} from "@test/support/googleScript.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockRequest} from "@test/support/server.tsx";

// Each method's name and status.
function methods() {
    return within(screen.getByRole("list")).getAllByRole("listitem")
        .map(item => [...item.querySelectorAll("p")].map(part => part.textContent));
}

// Opened without GitHub's code, as the profile is unless it comes back from GitHub's page.
function renderSignInMethods(signedInUser: UserDto) {
    renderWithProviders(<SignInMethods user={signedInUser} onGitHubLinkDone={vi.fn()}/>);
}

describe("SignInMethods", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("shows the password set and no provider linked", () => {
        renderSignInMethods(user);

        expect(screen.getByRole("heading", {name: "Sign-in methods"})).toBeInTheDocument();
        expect(methods()).toEqual([
            ["Password", "set"],
            ["Google", "not linked"],
            ["GitHub", "not linked"],
        ]);
    });

    it("leaves the focus alone when shown", () => {
        renderSignInMethods(user);

        expect(document.body).toHaveFocus();
    });

    it("shows the linked providers of an account without a password", () => {
        renderSignInMethods({...user, hasPassword: false, providers: ["GOOGLE", "GITHUB"]});

        expect(methods()).toEqual([
            ["Password", "not set"],
            ["Google", "linked"],
            ["GitHub", "linked"],
        ]);
    });

    it("offers to unlink only the linked providers while another way to sign in is left", () => {
        renderSignInMethods({...user, providers: ["GOOGLE"]});

        expect(screen.getByRole("button", {name: "Unlink Google"})).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Unlink GitHub"})).not.toBeInTheDocument();
    });

    it("tells why the only way to sign in can't be unlinked", () => {
        renderSignInMethods({...user, hasPassword: false, providers: ["GITHUB"]});

        expect(methods()).toEqual([
            ["Password", "not set"],
            ["Google", "not linked"],
            ["GitHub", "linked", "your only way to sign in"],
        ]);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    // As when the session ends while the user is fetched again, which clears the cache.
    it("closes the dialog when no user is left once it's fetched again", async () => {
        const userEvents = userEvent.setup();
        renderSignInMethods({...user, providers: ["GOOGLE"]});
        mockRequest("delete", "/users/me/identities/google", {status: 204});

        await userEvents.click(screen.getByRole("button", {name: "Unlink Google"}));
        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("offers Google's button to link Google with its client ID", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        renderSignInMethods(user);

        loadGoogleScript();

        expect(await screen.findByRole("button", {name: "Continue with Google"})).toBeInTheDocument();
    });

    it("offers no way to link Google without its client ID", () => {
        renderSignInMethods(user);

        expect(googleScripts()).toHaveLength(0);
    });

    it("offers GitHub's button to link GitHub with its client ID", () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        renderSignInMethods(user);

        expect(screen.getByRole("button", {name: "Continue with GitHub"})).toBeInTheDocument();
    });

    it("offers no way to link GitHub without its client ID", () => {
        renderSignInMethods(user);

        expect(screen.queryByRole("button", {name: "Continue with GitHub"})).not.toBeInTheDocument();
    });

    it("offers no way to link GitHub where the browser can't start its authorization", () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        vi.spyOn(crypto, "subtle", "get").mockReturnValue(undefined as unknown as SubtleCrypto);
        renderSignInMethods(user);

        expect(screen.queryByRole("button", {name: "Continue with GitHub"})).not.toBeInTheDocument();
    });
});
