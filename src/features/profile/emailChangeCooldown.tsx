import {startCooldown} from "@/utils/useCooldown.tsx";

// The server sends the links of an email change at most once a minute, answering earlier requests with a `429`.
export const EMAIL_CHANGE_COOLDOWN_MS = 60_000;

// The server's wait is per account.
export function emailChangeCooldownKey(userId: number): string {
    return `emailChange.${userId}`;
}

// Starts the wait outside Resend, e.g. after `ChangeEmail` sent the links; Resend shows it once it renders again.
export function startEmailChangeCooldown(userId: number): void {
    startCooldown(emailChangeCooldownKey(userId), EMAIL_CHANGE_COOLDOWN_MS);
}
