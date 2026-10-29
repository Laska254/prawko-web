import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AuthPage} from "@/features/auth/pages/AuthPage.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("AuthPage", () => {
    it("shows the sign in form next to the app panel", () => {
        renderWithProviders(<AuthPage/>, {route: "/auth"});

        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
        expect(screen.getByText("Welcome back. Sign in to continue practicing.")).toBeInTheDocument();
        expect(screen.getByText(/^Don't have an account\?/)).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: "Prepare for your driving theory exam."})).toBeInTheDocument();
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
        ["verified", "Your email is verified. You can sign in now."],
        ["passwordReset", "Your password has been changed. You can sign in now."],
    ])("shows the %s notice only on sign in", async (notice, message) => {
        const user = userEvent.setup();
        renderWithProviders(<AuthPage/>, {route: "/auth", state: {notice}});

        expect(screen.getByText(message)).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Create one"}));
        expect(screen.queryByText(message)).not.toBeInTheDocument();
    });
});
