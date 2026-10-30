import {startCooldown} from "./hooks/useCooldown.tsx";

// The server sends a new link at most once a minute; earlier requests are skipped without an error.
export const COOLDOWN_MS = 60_000;

// The server's wait is per account, so each email has its own; a mistyped one doesn't hold up the right one.
export function emailLinkCooldownKey(cooldownKey: string, email: string): string {
    return `${cooldownKey}.${email}`;
}

// Starts the wait for `email` outside the form, e.g. when another request has just sent it a link.
export function startEmailLinkCooldown(cooldownKey: string, email: string): void {
    startCooldown(emailLinkCooldownKey(cooldownKey, email), COOLDOWN_MS);
}
