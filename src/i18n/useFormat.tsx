import {useMemo} from "react";
import {useTranslation} from "react-i18next";

// Formats dates and numbers with `Intl` in the current language (`en-GB` keeps the British day/month order). The date
// formatters are made once per language, number formatters per call since `options` vary; `useTranslation` re-renders
// the caller when the language changes.
export function useFormat() {
    const {i18n} = useTranslation();
    const locale = i18n.language;

    return useMemo(() => {
        const dates = new Intl.DateTimeFormat(locale, {dateStyle: "medium"});
        const dateTimes = new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"});
        return {
            date: (date: Date) => dates.format(date),
            dateTime: (date: Date) => dateTimes.format(date),
            // `options` for percentages and the like, e.g. `{style: "percent"}`.
            number: (value: number, options?: Intl.NumberFormatOptions) =>
                new Intl.NumberFormat(locale, options).format(value),
        };
    }, [locale]);
}
