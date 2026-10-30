import {act, renderHook} from "@testing-library/react";
import {useCooldown} from "@/features/auth/hooks/useCooldown.tsx";

describe("useCooldown", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("isn't running before it starts", () => {
        const {result} = renderHook(() => useCooldown("test", 60_000));

        expect(result.current.secondsLeft).toBe(0);
    });

    it("counts down once a second until it ends", () => {
        const {result} = renderHook(() => useCooldown("test", 60_000));

        act(() => result.current.start());
        expect(result.current.secondsLeft).toBe(60);
        act(() => vi.advanceTimersByTime(59_000));
        expect(result.current.secondsLeft).toBe(1);
        act(() => vi.advanceTimersByTime(1_000));
        expect(result.current.secondsLeft).toBe(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("keeps running after a reload", () => {
        const first = renderHook(() => useCooldown("test", 60_000));
        act(() => first.result.current.start());
        first.unmount();
        vi.advanceTimersByTime(20_000);

        const {result} = renderHook(() => useCooldown("test", 60_000));

        expect(result.current.secondsLeft).toBe(40);
    });

    it("keeps each key apart", () => {
        const first = renderHook(() => useCooldown("test", 60_000));
        act(() => first.result.current.start());

        const {result} = renderHook(() => useCooldown("other", 60_000));

        expect(result.current.secondsLeft).toBe(0);
    });
});
