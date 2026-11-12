import {useEffect, useState} from "react";

const STORAGE_PREFIX = "cooldown.";
// Fired on `window` when a cooldown starts, so the hooks already showing one render again.
const START_EVENT = "cooldownstart";

// Starts the cooldown under `key` from outside the hook, e.g. before opening the page that shows it, or in another
// component while one shows it.
export function startCooldown(key: string, duration: number): void {
    sessionStorage.setItem(STORAGE_PREFIX + key, String(Date.now() + duration));
    window.dispatchEvent(new Event(START_EVENT));
}

// A wait between two actions, e.g. sending email links. The end time is kept in `sessionStorage` under `key`, so
// a reload doesn't reset it; `secondsLeft` counts down to 0 once a second.
export function useCooldown(key: string, duration: number) {
    // Only re-renders: the end time and the clock are read on every render, so a new `key` shows its own cooldown.
    const [, setTick] = useState(0);
    // A missing value is `Number(null)`, i.e. 0: no cooldown.
    const end = Number(sessionStorage.getItem(STORAGE_PREFIX + key));
    const secondsLeft = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    const running = secondsLeft > 0;

    // Any key's start re-renders: cheap, and the end time is read again anyway.
    useEffect(() => {
        function rerender(): void {
            setTick(tick => tick + 1);
        }
        window.addEventListener(START_EVENT, rerender);
        return () => window.removeEventListener(START_EVENT, rerender);
    }, []);

    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => setTick(tick => tick + 1), 1000);
        return () => clearInterval(timer);
    }, [running]);

    function start(): void {
        startCooldown(key, duration);
    }

    return {secondsLeft, start};
}
