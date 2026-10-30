import {useEffect, useState} from "react";

const STORAGE_PREFIX = "cooldown.";

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
        const started = Date.now();
        sessionStorage.setItem(storageKey, String(started + duration));
        setEnd(started + duration);
        setNow(started);
    }

    return {secondsLeft, start};
}
