import {isAxiosError} from "axios";
import type {ProblemDetail} from "./dto/ProblemDetail.tsx";

export type ApiError =
    | {readonly kind: "network"}
    | {readonly kind: "timeout"}
    // A response with errors per field; `fields` maps each field name to the server's message.
    | {readonly kind: "validation"; readonly status: number; readonly fields: Readonly<Record<string, string>>}
    // Any other error response; `problem` is missing when the body isn't a ProblemDetail (e.g. a proxy's page).
    | {readonly kind: "http"; readonly status: number; readonly problem?: ProblemDetail}
    | {readonly kind: "unknown"; readonly cause: unknown};

function isObject(data: unknown): data is object {
    return typeof data === "object" && data !== null;
}

function isProblemDetail(data: unknown): data is ProblemDetail {
    if (!isObject(data)) {
        return false;
    }
    const {type, title, status, details} = data as ProblemDetail;
    return typeof type === "string" && typeof title === "string" && typeof status === "number"
        && (details === undefined || isObject(details));
}

// Turns whatever a request rejected with into an `ApiError`.
export function toApiError(error: unknown): ApiError {
    if (!isAxiosError(error)) {
        return {kind: "unknown", cause: error};
    }
    // Needs `transitional.clarifyTimeoutError`; without it axios also reports a timeout as the
    // `ECONNABORTED` it uses for requests the browser dropped, which end up as unknown here.
    if (error.code === "ETIMEDOUT") {
        return {kind: "timeout"};
    }
    if (error.code === "ERR_NETWORK") {
        return {kind: "network"};
    }
    if (!error.response) {
        return {kind: "unknown", cause: error};
    }
    const {status, data} = error.response;
    if (!isProblemDetail(data)) {
        return {kind: "http", status};
    }
    if (data.details) {
        return {kind: "validation", status, fields: data.details};
    }
    return {kind: "http", status, problem: data};
}

// Messages are translation keys (`K`), which the caller translates: api/ can't import i18n/.

// The client's message per response status. The server's own texts can't be shown.
export type StatusMessages<K extends string = string> = Readonly<Partial<Record<number, K>>>;

// The client's messages for each form field. The server's texts don't say which rule failed, so a field has one
// message per status (e.g. `400` invalid, `409` taken).
export type FieldMessages<F extends string, K extends string = string> = Readonly<Record<F, StatusMessages<K>>>;

// The client message per field of a form; fields without an error are left out.
export type FieldErrors<F extends string, K extends string = string> = Partial<Record<F, K>>;

// The client messages for the fields of a validation error. Fields (or statuses) missing from `messages` are left out.
export function fieldErrors<F extends string, K extends string>(
    error: ApiError,
    messages: FieldMessages<F, K>,
): FieldErrors<F, K> {
    if (error.kind !== "validation") {
        return {};
    }
    const errors: FieldErrors<F, K> = {};
    for (const field of Object.keys(messages) as F[]) {
        const message = messages[field][error.status];
        if (error.fields[field] !== undefined && message !== undefined) {
            errors[field] = message;
        }
    }
    return errors;
}

// Whether any field is marked; without one, the form has to show a general error instead.
export function hasFieldErrors(errors: FieldErrors<string>): boolean {
    return Object.keys(errors).length > 0;
}

// Keys in the `errors` namespace; a key missing there fails the build where it's translated.
export type GenericMessageKey =
    `errors:${"network" | "timeout" | "unexpected" | "tooManyRequests" | "unavailable"}`;

const GENERIC_MESSAGES = {
    network: "errors:network",
    timeout: "errors:timeout",
    unexpected: "errors:unexpected",
} as const;

const GENERIC_STATUS_MESSAGES: StatusMessages<GenericMessageKey> = {
    429: "errors:tooManyRequests",
    503: "errors:unavailable",
};

// The message for an error no form field shows: the caller's own for the status, else a generic one.
export function errorMessage<K extends string = never>(
    error: ApiError,
    messages: StatusMessages<K> = {},
): NoInfer<K> | GenericMessageKey {
    switch (error.kind) {
        case "network":
        case "timeout":
            return GENERIC_MESSAGES[error.kind];
        case "validation":
        case "http":
            return messages[error.status] ?? GENERIC_STATUS_MESSAGES[error.status] ?? GENERIC_MESSAGES.unexpected;
        case "unknown":
            return GENERIC_MESSAGES.unexpected;
    }
}
