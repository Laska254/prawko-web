import {act, renderHook} from "@testing-library/react";
import {chooseLanguage} from "@/i18n/i18n.tsx";
import {useFormat} from "@/i18n/useFormat.tsx";

// Local time, so the result doesn't depend on the machine's time zone.
const DATE = new Date(2026, 9, 29, 18, 30);

// `Intl` puts no-break spaces in numbers and, depending on the ICU version, before "PM".
function withPlainSpaces(text: string) {
    return text.replace(/\s/g, " ");
}

describe("useFormat", () => {
    it("formats in the browser language", () => {
        const {result} = renderHook(() => useFormat());

        expect(result.current.date(DATE)).toBe("Oct 29, 2026");
        expect(withPlainSpaces(result.current.dateTime(DATE))).toBe("Oct 29, 2026, 6:30 PM");
        expect(result.current.number(12345.5)).toBe("12,345.5");
        expect(result.current.number(0.92, {style: "percent"})).toBe("92%");
    });

    it("follows a language change", async () => {
        const {result} = renderHook(() => useFormat());

        await act(() => chooseLanguage("pl"));

        expect(result.current.date(DATE)).toBe("29 paź 2026");
        expect(result.current.dateTime(DATE)).toBe("29 paź 2026, 18:30");
        expect(withPlainSpaces(result.current.number(12345.5))).toBe("12 345,5");
        expect(result.current.number(0.92, {style: "percent"})).toBe("92%");
    });
});
