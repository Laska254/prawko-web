import type {ReactNode} from "react";
import {act, renderHook, waitFor} from "@testing-library/react";
import {QueryClientProvider} from "@tanstack/react-query";
import {getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {SessionProvider} from "@/session/SessionProvider.tsx";
import {useSignOut} from "@/session/useSignOut.tsx";
import {tokens, user} from "@test/support/data.tsx";
import {holdRefreshLock} from "@test/support/refreshLock.tsx";
import {createTestQueryClient} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";

interface WrapperProps {
    readonly children: ReactNode;
}

function wrapper({children}: WrapperProps) {
    return (
        <QueryClientProvider client={createTestQueryClient()}>
            <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
    );
}

describe("useSignOut", () => {
    it("is signing out until the session ended", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});
        const logouts = mockPost("/auth/logout");
        const release = await holdRefreshLock();
        const {result} = renderHook(() => useSignOut(), {wrapper});
        expect(result.current.isSigningOut).toBe(false);

        act(() => result.current.signOut());

        expect(result.current.isSigningOut).toBe(true);
        expect(getRefreshToken()).toBe("refresh-token");

        await release();

        await waitFor(() => expect(result.current.isSigningOut).toBe(false));
        expect(getRefreshToken()).toBeNull();
        expect(logouts).toEqual([{refreshToken: "refresh-token"}]);
    });
});
