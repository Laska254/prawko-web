import {withRefreshLock} from "@/api/client.tsx";

// Holds the refresh lock, as a refresh in flight here or in another tab would, so anything waiting for it shows as
// busy. Resolves once the lock is granted (a tick after it's requested), with a way to free it that resolves once it
// is freed.
export async function holdRefreshLock() {
    let granted!: () => void;
    const isGranted = new Promise<void>(resolve => granted = resolve);
    let release!: () => void;
    const held = withRefreshLock(() => {
        granted();
        return new Promise<void>(resolve => release = resolve);
    });
    await isGranted;
    return async () => {
        release();
        await held;
    };
}
