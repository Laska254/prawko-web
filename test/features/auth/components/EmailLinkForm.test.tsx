import {screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {AxiosError} from "axios";
import {EmailLinkForm} from "@/features/auth/components/EmailLinkForm.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

function renderForm(send: (email: string) => Promise<unknown>, defaultEmail?: string) {
    renderWithProviders(
        <EmailLinkForm submitLabel="Send link" sentMessage="Link sent." send={send} defaultEmail={defaultEmail}/>
    );
}

describe("EmailLinkForm", () => {
    let user: UserEvent;

    beforeEach(() => {
        user = userEvent.setup();
    });

    it("sends the email and shows the sent message", async () => {
        const send = vi.fn().mockResolvedValue(undefined);
        renderForm(send);

        await user.type(screen.getByRole("textbox", {name: "Email"}), "jan@example.com");
        await user.click(screen.getByRole("button", {name: "Send link"}));

        expect(await screen.findByText("Link sent.")).toBeInTheDocument();
        expect(send).toHaveBeenCalledWith("jan@example.com");
    });

    it("fills in the default email", () => {
        renderForm(vi.fn(), "jan@example.com");

        expect(screen.getByRole("textbox", {name: "Email"})).toHaveValue("jan@example.com");
    });

    it("shows a generic error when sending fails", async () => {
        renderForm(vi.fn().mockRejectedValue(new Error()), "jan@example.com");

        await user.click(screen.getByRole("button", {name: "Send link"}));

        expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
    });

    it("shows the connection error without a connection", async () => {
        const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK);
        renderForm(vi.fn().mockRejectedValue(error), "jan@example.com");

        await user.click(screen.getByRole("button", {name: "Send link"}));

        expect(await screen.findByText("Can't reach the server. Check your connection and try again."))
            .toBeInTheDocument();
    });

    it("sends once while sending", async () => {
        let respond!: () => void;
        const send = vi.fn(() => new Promise<void>(resolve => respond = resolve));
        renderForm(send, "jan@example.com");

        await user.click(screen.getByRole("button", {name: "Send link"}));
        await user.keyboard("{Enter}");

        expect(screen.getByRole("button", {name: "Send link"})).toBeDisabled();
        respond();
        expect(await screen.findByText("Link sent.")).toBeInTheDocument();
        expect(send).toHaveBeenCalledTimes(1);
    });
});
