import {type ReactNode, useState} from "react";
import {act, renderHook, waitFor} from "@testing-library/react";
import {onlineManager, QueryClientProvider} from "@tanstack/react-query";
import {api} from "@/api/client.tsx";
import {useFormSubmission} from "@/features/auth/hooks/useFormSubmission.tsx";
import {createTestQueryClient} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost, mockProblem} from "@test/support/server.tsx";

interface FormDto {
    readonly name: string;
    readonly email: string;
}

const dto: FormDto = {name: "Jan", email: "jan@example.com"};

const FIELD_MESSAGES = {name: {400: "nameInvalid", 409: "nameTaken"}, email: {400: "emailInvalid"}} as const;

function sendForm(formDto: FormDto) {
    return api.post<string>("/form", formDto);
}

function wrapper({children}: {children: ReactNode}) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

function renderSubmission(onSuccess?: (result: unknown, variables: FormDto) => void) {
    return renderHook(() => useFormSubmission(sendForm, {
        fieldMessages: FIELD_MESSAGES,
        statusMessages: {401: "wrongCredentials"},
        onSuccess,
    }), {wrapper});
}

describe("useFormSubmission", () => {
    it("is idle before sending", () => {
        const {result} = renderSubmission();

        expect(result.current).toMatchObject({isSending: false, fieldErrors: {}, failure: null});
    });

    it("sends the form and hands the result and the form to onSuccess", async () => {
        const requests = mockPost("/form", 200, "created");
        const onSuccess = vi.fn();
        const {result} = renderSubmission(onSuccess);

        act(() => result.current.submit(dto));

        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
        expect(onSuccess.mock.calls[0][0]).toMatchObject({data: "created"});
        expect(onSuccess.mock.calls[0][1]).toEqual(dto);
        expect(requests).toEqual([dto]);
        expect(result.current).toMatchObject({isSending: false, fieldErrors: {}, failure: null});
    });

    it("is sending until the answer and sends once while sending", async () => {
        const request = mockPendingPost("/form");
        const {result} = renderSubmission();

        act(() => result.current.submit(dto));
        await waitFor(() => expect(result.current.isSending).toBe(true));
        act(() => result.current.submit(dto));
        request.respond();

        await waitFor(() => expect(result.current.isSending).toBe(false));
        expect(request.requestCount()).toBe(1);
    });

    it("sends once when submitted twice before it shows as sending", async () => {
        const request = mockPendingPost("/form");
        const {result} = renderSubmission();

        act(() => {
            result.current.submit(dto);
            result.current.submit(dto);
        });
        request.respond();

        await waitFor(() => expect(result.current.isSending).toBe(false));
        expect(request.requestCount()).toBe(1);
    });

    it("marks each field of a validation error with its message", async () => {
        mockProblem("/form", 400, {name: "Size must be 3-31.", email: "Required."});
        const {result} = renderSubmission();

        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.fieldErrors).toEqual({name: "nameInvalid", email: "emailInvalid"}));
        expect(result.current.failure).toBeNull();
    });

    it("marks only the fields with a message for the status", async () => {
        mockProblem("/form", 409, {name: "Name is taken.", email: "Email is taken."});
        const {result} = renderSubmission();

        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.fieldErrors).toEqual({name: "nameTaken"}));
        expect(result.current.failure).toBeNull();
    });

    it("fails with the generic message when no field of the form is invalid", async () => {
        mockProblem("/form", 400, {token: "Token is required."});
        const {result} = renderSubmission();

        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.failure).toMatchObject({
            error: {kind: "validation", status: 400},
            message: "errors:unexpected",
        }));
        expect(result.current.fieldErrors).toEqual({});
    });

    it("fails with a validation error when the form has no fields", async () => {
        mockProblem("/form", 400, {name: "Name is required."});
        const {result} = renderHook(() => useFormSubmission(sendForm), {wrapper});

        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.failure).toMatchObject({message: "errors:unexpected"}));
        expect(result.current.fieldErrors).toEqual({});
    });

    it("fails with the message for the status", async () => {
        mockPost("/form", 401);
        const {result} = renderSubmission();

        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.failure).toEqual({
            error: {kind: "http", status: 401},
            message: "wrongCredentials",
        }));
        expect(result.current.fieldErrors).toEqual({});
    });

    it.each([
        [500, "errors:unexpected"],
        [503, "errors:unavailable"],
    ])("fails with the generic message on a %i", async (status, message) => {
        mockPost("/form", status);
        const {result} = renderSubmission();

        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.failure).toMatchObject({message}));
    });

    it("fails with the connection message without a connection", async () => {
        mockNetworkError("/form");
        const {result} = renderSubmission();

        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.failure).toEqual({
            error: {kind: "network"},
            message: "errors:network",
        }));
    });

    it("fails with the connection message while offline instead of waiting for the connection", async () => {
        mockNetworkError("/form");
        onlineManager.setOnline(false);
        const {result} = renderSubmission();

        try {
            act(() => result.current.submit(dto));

            await waitFor(() => expect(result.current.failure).toEqual({
                error: {kind: "network"},
                message: "errors:network",
            }));
            expect(result.current.isSending).toBe(false);
        } finally {
            onlineManager.setOnline(true);
        }
    });

    it("drops the last errors when sending again", async () => {
        mockProblem("/form", 400, {name: "Name is required."});
        const {result} = renderSubmission();
        act(() => result.current.submit(dto));
        await waitFor(() => expect(result.current.fieldErrors).toEqual({name: "nameInvalid"}));

        const request = mockPendingPost("/form", 401);
        act(() => result.current.submit(dto));

        await waitFor(() => expect(result.current.isSending).toBe(true));
        expect(result.current.fieldErrors).toEqual({});
        expect(result.current.failure).toBeNull();
        request.respond();
        await waitFor(() => expect(result.current.failure).toMatchObject({message: "wrongCredentials"}));
    });

    it("drops the errors when cleared", async () => {
        mockPost("/form", 401);
        const {result} = renderSubmission();
        act(() => result.current.submit(dto));
        await waitFor(() => expect(result.current.failure).not.toBeNull());

        act(() => result.current.clear());

        expect(result.current).toMatchObject({isSending: false, fieldErrors: {}, failure: null});
    });

    it("drops the errors when cleared while rendering, so they're never shown with the new props", async () => {
        mockPost("/form", 401);
        const error = vi.spyOn(console, "error");
        const {result, rerender} = renderHook(({form}) => {
            const submission = useFormSubmission(sendForm, {statusMessages: {401: "wrongCredentials"}});
            const [prevForm, setPrevForm] = useState(form);
            if (form !== prevForm) {
                setPrevForm(form);
                submission.clear();
            }
            return submission;
        }, {wrapper, initialProps: {form: "login"}});
        act(() => result.current.submit(dto));
        await waitFor(() => expect(result.current.failure).not.toBeNull());

        rerender({form: "register"});

        expect(result.current.failure).toBeNull();
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it("shows the failure of a send still running when cleared", async () => {
        const request = mockPendingPost("/form", 401);
        const {result} = renderSubmission();
        act(() => result.current.submit(dto));
        await waitFor(() => expect(result.current.isSending).toBe(true));

        act(() => result.current.clear());
        request.respond();

        await waitFor(() => expect(result.current.failure).toMatchObject({message: "wrongCredentials"}));
    });
});
