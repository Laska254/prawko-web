import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {
    type ApiError,
    errorMessage,
    type FieldErrors,
    type FieldMessages,
    fieldErrors,
    type GenericMessageKey,
    hasFieldErrors,
    type StatusMessages,
    toApiError,
} from "@/api/errors.tsx";

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
        const marked = fieldErrors(error, fieldMessages);
        if (hasFieldErrors(marked)) {
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
    const mutation = useMutation({mutationFn: send, onSuccess});
    // The error `clear` hid. Hidden in state, not with `mutation.reset()`, which renders only after a tick and so
    // can't clear while rendering; the error of a send still running, or of a later one, shows.
    const [clearedError, setClearedError] = useState<Error | null>(null);
    const {fieldErrors, failure} = submissionErrors(shownError(mutation.error, clearedError), fieldMessages,
        statusMessages);

    // Ignored while sending, so the form isn't sent twice; never rejects, the errors show the failure instead.
    function submit(variables: V): void {
        if (!mutation.isPending) {
            mutation.mutate(variables);
        }
    }

    // Drops the errors shown, e.g. when the form's own check fails. Can be called while rendering.
    function clear(): void {
        setClearedError(mutation.error);
    }

    return {submit, isSending: mutation.isPending, fieldErrors, failure, clear};
}
