import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

function renderDialog({open = true, loading = false, confirmColor}: {open?: boolean; loading?: boolean; confirmColor?: "error"} = {}) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
        <ConfirmDialog open={open} title="Delete account?" text="This can't be undone." confirmLabel="Delete"
                       confirmColor={confirmColor} loading={loading} onConfirm={onConfirm} onCancel={onCancel}/>
    );
    return {onConfirm, onCancel};
}

describe("ConfirmDialog", () => {
    it("shows the title and text", () => {
        renderDialog();

        expect(screen.getByRole("dialog", {name: "Delete account?", description: "This can't be undone."})).toBeInTheDocument();
    });

    it("shows the confirm button in green by default", () => {
        renderDialog();

        expect(screen.getByRole("button", {name: "Delete"})).toHaveStyle({"--variant-containedBg": "var(--mui-palette-secondary-main)"});
    });

    it("shows a destructive confirm button in red", () => {
        renderDialog({confirmColor: "error"});

        expect(screen.getByRole("button", {name: "Delete"})).toHaveStyle({"--variant-containedBg": "var(--mui-palette-error-main)"});
    });

    it("is hidden when closed", () => {
        renderDialog({open: false});

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("confirms", async () => {
        const {onConfirm, onCancel} = renderDialog();

        await userEvent.setup().click(screen.getByRole("button", {name: "Delete"}));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("cancels with the button", async () => {
        const {onConfirm, onCancel} = renderDialog();

        await userEvent.setup().click(screen.getByRole("button", {name: "Cancel"}));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("cancels with Escape", async () => {
        const {onCancel} = renderDialog();

        await userEvent.setup().keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("can't be closed while loading", async () => {
        const {onCancel} = renderDialog({loading: true});

        await userEvent.setup().keyboard("{Escape}");

        expect(onCancel).not.toHaveBeenCalled();
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        expect(screen.getByRole("button", {name: "Delete"})).toBeDisabled();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
});
