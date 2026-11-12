import type {ApiError} from "@/api/errors.tsx";
import {startCooldown} from "@/utils/useCooldown.tsx";

// The server sends the links of an email change at most once a minute, answering earlier requests with a `429`.
export const EMAIL_CHANGE_COOLDOWN_MS = 60_000;

// The server's wait is per account.
export function emailChangeCooldownKey(userId: number): string {
    return `emailChange.${userId}`;
}

// A `429` says the links were sent less than the cooldown ago, e.g. from another tab.
export function isTooSoon(error: ApiError): boolean {
    return error.kind === "http" && error.status === 429;
}

// Starts the wait outside Resend, e.g. after `ChangeEmail` sent the links; Resend shows it once it renders again.
export function startEmailChangeCooldown(userId: number): void {
    startCooldown(emailChangeCooldownKey(userId), EMAIL_CHANGE_COOLDOWN_MS);
}
