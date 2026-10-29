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
