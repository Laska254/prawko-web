import {renderHook} from "@testing-library/react";
import {useSession} from "@/session/useSession.tsx";

describe("useSession", () => {
    afterEach(() => vi.restoreAllMocks());

    it("fails outside SessionProvider", () => {
        // React reports the thrown error to the console.
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() => renderHook(() => useSession())).toThrow("useSession must be used inside SessionProvider.");
    });
});
