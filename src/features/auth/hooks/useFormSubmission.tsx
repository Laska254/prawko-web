import {useRef, useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {type ApiError, errorMessage, type GenericMessageKey, type StatusMessages, toApiError} from "@/api/errors.tsx";

// The client's messages for each form field. The server's texts don't say which rule failed, so a field has one
// message per status (e.g. `400` invalid, `409` taken).
export type FieldMessages<F extends string, K extends string> = Readonly<Record<F, StatusMessages<K>>>;

// The client message per field of a form; fields without an error are left out.
type FieldErrors<F extends string, K extends string> = Partial<Record<F, K>>;

// A failure no field of the form shows: the error, e.g. to add a link for its status, and its message.
interface SubmissionFailure<K extends string> {
    readonly error: ApiError;
    readonly message: K | GenericMessageKey;
}

interface FormSubmissionOptions<V, R, F extends string, K extends string> {
    // Marks the fields of a validation error; without them, every error is a failure.
    readonly fieldMessages?: FieldMessages<F, K>;
    // The message of a failure per response status, before the generic ones.
    readonly statusMessages?: StatusMessages<K>;
    readonly onSuccess?: (result: R, variables: V) => void;
}

interface SubmissionErrors<F extends string, K extends string> {
    readonly fieldErrors: FieldErrors<F, K>;
    readonly failure: SubmissionFailure<K> | null;
}

// The client messages for the fields of a validation error. Fields (or statuses) missing from `messages` are left out.
function markedFields<F extends string, K extends string>(
    error: ApiError,
    messages: FieldMessages<F, K>,
): FieldErrors<F, K> {
    if (error.kind !== "validation") {
        return {};
    }
    const marked: FieldErrors<F, K> = {};
    for (const field of Object.keys(messages) as F[]) {
        const message = messages[field][error.status];
        if (error.fields[field] !== undefined && message !== undefined) {
            marked[field] = message;
        }
    }
    return marked;
}

function submissionErrors<F extends string, K extends string>(
    caught: Error | null,
    fieldMessages: FieldMessages<F, K> | undefined,
    statusMessages: StatusMessages<K> | undefined,
): SubmissionErrors<F, K> {
    if (!caught) {
        return {fieldErrors: {}, failure: null};
    }
    const error = toApiError(caught);
    if (fieldMessages) {
        const marked = markedFields(error, fieldMessages);
        // Without a marked field, the failure shows as a general error instead.
        if (Object.keys(marked).length > 0) {
            return {fieldErrors: marked, failure: null};
        }
    }
    return {fieldErrors: {}, failure: {error, message: errorMessage(error, statusMessages)}};
}

function shownError(error: Error | null, clearedError: Error | null): Error | null {
    if (error === clearedError) {
        return null;
    }
    return error;
}

// Sends a form with `send`: busy until the answer, then the errors of its fields, or the failure no field shows.
// Messages are translation keys, which the form translates. Sending again drops the last errors.
export function useFormSubmission<V, R, F extends string = never, K extends string = never>(
    send: (variables: V) => Promise<R>,
    {fieldMessages, statusMessages, onSuccess}: FormSubmissionOptions<V, R, F, K> = {},
) {
    // Sent even offline, not paused until the connection is back: axios fails at once, and the form shows the network
    // error.
    const mutation = useMutation({mutationFn: send, onSuccess, networkMode: "always"});
    // The error `clear` hid. Hidden in state, not with `mutation.reset()`, which renders only after a tick and so
    // can't clear while rendering; the error of a send still running, or of a later one, shows.
    const [clearedError, setClearedError] = useState<Error | null>(null);
    const {fieldErrors, failure} = submissionErrors(shownError(mutation.error, clearedError), fieldMessages,
        statusMessages);

    // Set at once, unlike `mutation.isPending`, which TanStack Query renders only after a tick: a second submit within
    // it (a fast double click) would pass the check.
    const sending = useRef(false);

    // Ignored while sending, so the form isn't sent twice; never rejects, the errors show the failure instead.
    function submit(variables: V): void {
        if (sending.current) {
            return;
        }
        sending.current = true;
        mutation.mutate(variables, {
            onSettled: () => {
                sending.current = false;
            },
        });
    }

    // Drops the errors shown, e.g. when the form's own check fails. Can be called while rendering.
    function clear(): void {
        setClearedError(mutation.error);
    }

    return {submit, isSending: mutation.isPending, fieldErrors, failure, clear};
}
