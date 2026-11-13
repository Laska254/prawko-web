import {startCooldown} from "@/utils/useCooldown.tsx";

// The server sends a new link at most once a minute; earlier requests are skipped without an error.
export const COOLDOWN_MS = 60_000;

// One per server link with a per-account wait; forms sending the same link share its cooldown.
export type EmailLinkType = "verification" | "passwordReset";

// The server's wait is per account, so each email has its own; a mistyped one doesn't hold up the right one.
// The server finds the account ignoring case, so the key does too.
export function emailLinkCooldownKey(linkType: EmailLinkType, email: string): string {
    return `${linkType}.${email.toLowerCase()}`;
}

// Starts the wait for `email` outside the form, e.g. when another request has just sent it a link.
export function startEmailLinkCooldown(linkType: EmailLinkType, email: string): void {
    startCooldown(emailLinkCooldownKey(linkType, email), COOLDOWN_MS);
}
