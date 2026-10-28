// The text of every CSS rule that applies to `element`. jsdom can't compute some `var()` values (e.g. `border-color`),
// so tests read those from the rules instead.
export function cssRules(element: Element) {
    return [...document.styleSheets]
        .flatMap((sheet) => [...sheet.cssRules])
        .filter((rule) => rule instanceof CSSStyleRule && element.matches(rule.selectorText))
        .map((rule) => rule.cssText)
        .join("\n");
}
