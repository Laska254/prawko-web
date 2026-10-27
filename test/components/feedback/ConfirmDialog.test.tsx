import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

const onConfirm = vi.fn();
const onCancel = vi.fn();

function renderDialog({open = true, loading = false} = {}) {
    renderWithProviders(
        <ConfirmDialog open={open} title="Delete account?" text="This can't be undone." confirmLabel="Delete"
                       loading={loading} onConfirm={onConfirm} onCancel={onCancel}/>
    );
}

describe("ConfirmDialog", () => {
    afterEach(() => vi.clearAllMocks());

    it("shows the title and text", () => {
        renderDialog();

        expect(screen.getByRole("dialog", {name: "Delete account?", description: "This can't be undone."})).toBeInTheDocument();
    });

    it("is hidden when closed", () => {
        renderDialog({open: false});

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("confirms", async () => {
        renderDialog();

        await userEvent.setup().click(screen.getByRole("button", {name: "Delete"}));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("cancels with the button", async () => {
        renderDialog();

        await userEvent.setup().click(screen.getByRole("button", {name: "Cancel"}));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("cancels with Escape", async () => {
        renderDialog();

        await userEvent.setup().keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("can't be closed while loading", async () => {
        renderDialog({loading: true});

        await userEvent.setup().keyboard("{Escape}");

        expect(onCancel).not.toHaveBeenCalled();
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        expect(screen.getByRole("button", {name: "Delete"})).toBeDisabled();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
});
