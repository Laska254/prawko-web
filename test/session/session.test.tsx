import {isAdmin, type SessionState} from "@/session/session.tsx";
import {user} from "@test/support/data.tsx";

describe("isAdmin", () => {
    it.each<[string, boolean, SessionState]>([
        ["a signed in admin", true, {status: "signedIn", user: {...user, role: "ADMIN"}}],
        ["a signed in user", false, {status: "signedIn", user}],
        ["a loading session", false, {status: "loading"}],
        ["a failed session", false, {status: "error", retry: () => {}}],
        ["a guest", false, {status: "signedOut"}],
    ])("for %s is %s", (_, expected, session) => {
        expect(isAdmin(session)).toBe(expected);
    });
});
