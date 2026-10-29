import type {ApiError} from "@/api/errors.tsx";

// Whether the server rejected an email link's token: a `400` that marks no field of the form means the token is
// unknown, expired or blank.
export function isInvalidToken(error: ApiError): boolean {
    return (error.kind === "http" || error.kind === "validation") && error.status === 400;
}
