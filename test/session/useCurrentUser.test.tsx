import type {ReactNode} from "react";
import {renderHook} from "@testing-library/react";
import {QueryClientProvider} from "@tanstack/react-query";
import {SessionProvider} from "@/session/SessionProvider.tsx";
import {useCurrentUser} from "@/session/useCurrentUser.tsx";
import {createTestQueryClient} from "@test/support/render.tsx";

interface WrapperProps {
    readonly children: ReactNode;
}

// A session without stored tokens, so signed out.
function signedOut({children}: WrapperProps) {
    return (
        <QueryClientProvider client={createTestQueryClient()}>
            <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
    );
}

// The signed-in user is read through `ProfilePage`'s tests, behind `RequireAuth`.
describe("useCurrentUser", () => {
    afterEach(() => vi.restoreAllMocks());

    it("fails outside a signed-in session", () => {
        // React reports the thrown error to the console.
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => renderHook(() => useCurrentUser(), {wrapper: signedOut}))
            .toThrow("useCurrentUser must be used inside a signed-in session.");
    });
});
