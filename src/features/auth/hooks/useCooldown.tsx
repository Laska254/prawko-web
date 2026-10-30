import {useEffect, useState} from "react";

const STORAGE_PREFIX = "cooldown.";

// Starts the cooldown under `key` from outside the hook, e.g. before opening the page that shows it, and returns
// its end time.
export function startCooldown(key: string, duration: number): number {
    const end = Date.now() + duration;
    sessionStorage.setItem(STORAGE_PREFIX + key, String(end));
    return end;
}

// A wait between two actions, e.g. sending email links. The end time is kept in `sessionStorage` under `key`, so
// a reload doesn't reset it; `secondsLeft` counts down to 0 once a second.
export function useCooldown(key: string, duration: number) {
    const storageKey = STORAGE_PREFIX + key;
    // A missing value is `Number(null)`, i.e. 0: no cooldown.
    const [end, setEnd] = useState(() => Number(sessionStorage.getItem(storageKey)));
    const [now, setNow] = useState(Date.now);
    const secondsLeft = Math.max(0, Math.ceil((end - now) / 1000));
    const running = secondsLeft > 0;

    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [running]);

    function start(): void {
        setEnd(startCooldown(key, duration));
        setNow(Date.now());
    }

    return {secondsLeft, start};
}
