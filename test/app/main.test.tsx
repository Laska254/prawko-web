import {act, screen} from "@testing-library/react";
// Loads main.tsx's dependencies before the test, so its timeout only covers mounting the app.
import "@/app/App.tsx";

describe("main", () => {
    it("mounts the app into #root", async () => {
        document.body.innerHTML = '<div id="root"></div>';

        await act(() => import("@/app/main.tsx"));

        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
    });
});
