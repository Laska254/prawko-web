import {screen} from "@testing-library/react";
import {ProfilePage} from "@/features/profile/pages/ProfilePage.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("ProfilePage", () => {
    it("shows a placeholder", () => {
        renderWithProviders(<ProfilePage/>);

        expect(screen.getByRole("heading", {name: "Profile"})).toBeInTheDocument();
        expect(screen.getByText("Your account details will show up here.")).toBeInTheDocument();
    });
});
