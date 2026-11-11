import {screen, within} from "@testing-library/react";
import {SignInMethods} from "@/features/profile/components/SignInMethods.tsx";
import {user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

// Each method's name and status.
function methods() {
    return within(screen.getByRole("list")).getAllByRole("listitem")
        .map(item => [...item.querySelectorAll("p")].map(part => part.textContent));
}

describe("SignInMethods", () => {
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
});
