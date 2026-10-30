import {act, screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {AxiosError} from "axios";
import {EmailLinkForm} from "@/features/auth/components/EmailLinkForm.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {httpError} from "@test/support/data.tsx";

function renderForm(send: (email: string) => Promise<unknown>, defaultEmail?: string) {
    return renderWithProviders(
        <EmailLinkForm
            submitLabel="Send link"
            sentMessage="Link sent."
            send={send}
            cooldownKey="test"
            defaultEmail={defaultEmail}
        />
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
        expect(screen.getByRole("button", {name: "Send link"})).toBeEnabled();
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

    describe("waiting between links", () => {
        beforeEach(() => {
            // `shouldAdvanceTime` keeps the clock moving for user-event and `findBy`, which wait on timers too.
            vi.useFakeTimers({shouldAdvanceTime: true});
            user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("counts down a minute after sending", async () => {
            renderForm(vi.fn().mockResolvedValue(undefined), "jan@example.com");

            await user.click(screen.getByRole("button", {name: "Send link"}));

            expect(await screen.findByRole("button", {name: "Send again in 60 s"})).toBeDisabled();
            act(() => vi.advanceTimersByTime(59_000));
            expect(screen.getByRole("button", {name: "Send again in 1 s"})).toBeDisabled();
            act(() => vi.advanceTimersByTime(1_000));
            expect(screen.getByRole("button", {name: "Send link"})).toBeEnabled();
        });

        it("keeps counting down after a reload", async () => {
            const {unmount} = renderForm(vi.fn().mockResolvedValue(undefined), "jan@example.com");
            await user.click(screen.getByRole("button", {name: "Send link"}));
            await screen.findByText("Link sent.");
            unmount();
            vi.advanceTimersByTime(20_000);

            renderForm(vi.fn(), "jan@example.com");

            expect(screen.getByRole("button", {name: "Send again in 40 s"})).toBeDisabled();
            expect(screen.queryByText("Link sent.")).not.toBeInTheDocument();
        });

        it("waits for each email apart", async () => {
            renderForm(vi.fn().mockResolvedValue(undefined), "jan@exmaple.com");
            await user.click(screen.getByRole("button", {name: "Send link"}));
            await screen.findByRole("button", {name: "Send again in 60 s"});
            const email = screen.getByRole("textbox", {name: "Email"});

            await user.clear(email);
            await user.type(email, "jan@example.com");
            expect(screen.getByRole("button", {name: "Send link"})).toBeEnabled();

            await user.clear(email);
            await user.type(email, "jan@exmaple.com");
            expect(screen.getByRole("button", {name: /^Send again in/})).toBeDisabled();

            await user.clear(email);
            await user.type(email, "Jan@Exmaple.com");
            expect(screen.getByRole("button", {name: /^Send again in/})).toBeDisabled();
        });

        it("counts down a minute after too many requests", async () => {
            renderForm(vi.fn().mockRejectedValue(httpError(429)), "jan@example.com");

            await user.click(screen.getByRole("button", {name: "Send link"}));

            expect(await screen.findByText("Too many attempts. Wait a moment and try again.")).toBeInTheDocument();
            expect(screen.getByRole("button", {name: "Send again in 60 s"})).toBeDisabled();
        });
    });
});
