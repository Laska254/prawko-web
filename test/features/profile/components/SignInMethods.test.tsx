import {screen, within} from "@testing-library/react";
import {SignInMethods} from "@/features/profile/components/SignInMethods.tsx";
import {user} from "@test/support/data.tsx";
import {googleScripts, loadGoogleScript} from "@test/support/googleScript.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

// Each method's name and status.
function methods() {
    return within(screen.getByRole("list")).getAllByRole("listitem")
        .map(item => [...item.querySelectorAll("p")].map(part => part.textContent));
}

describe("SignInMethods", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("shows the password set and no provider linked", () => {
        renderWithProviders(<SignInMethods user={user}/>);

        expect(screen.getByRole("heading", {name: "Sign-in methods"})).toBeInTheDocument();
        expect(methods()).toEqual([
            ["Password", "set"],
            ["Google", "not linked"],
            ["GitHub", "not linked"],
        ]);
    });

    it("shows the linked providers of an account without a password", () => {
        renderWithProviders(<SignInMethods user={{...user, hasPassword: false, providers: ["GOOGLE", "GITHUB"]}}/>);

        expect(methods()).toEqual([
            ["Password", "not set"],
            ["Google", "linked"],
            ["GitHub", "linked"],
        ]);
    });

    it("offers to unlink only the linked providers while another way to sign in is left", () => {
        renderWithProviders(<SignInMethods user={{...user, providers: ["GOOGLE"]}}/>);

        expect(screen.getByRole("button", {name: "Unlink Google"})).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Unlink GitHub"})).not.toBeInTheDocument();
    });

    it("tells why the only way to sign in can't be unlinked", () => {
        renderWithProviders(<SignInMethods user={{...user, hasPassword: false, providers: ["GITHUB"]}}/>);

        expect(methods()).toEqual([
            ["Password", "not set"],
            ["Google", "not linked"],
            ["GitHub", "linked", "Your only way to sign in"],
        ]);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("offers Google's button to link Google with its client ID", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
        renderWithProviders(<SignInMethods user={user}/>);

        loadGoogleScript();

        expect(await screen.findByRole("button", {name: "Continue with Google"})).toBeInTheDocument();
    });

    it("offers no way to link Google without its client ID", () => {
        renderWithProviders(<SignInMethods user={user}/>);

        expect(googleScripts()).toHaveLength(0);
    });
});
