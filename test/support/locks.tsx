// What a lock task waits for: the tasks queued before it under the same name.
const queues = new Map<string, Promise<unknown>>();

// Web Locks for jsdom, which has none: tasks under one name run one at a time, also across module copies standing
// for other tabs. Only exclusive locks requested without options.
export const fakeLocks = {
    request<T>(name: string, task: LockGrantedCallback<T>): Promise<T> {
        const result = (queues.get(name) ?? Promise.resolve()).then(() => task({name, mode: "exclusive"}));
        // A failed task still frees the lock for the next one.
        queues.set(name, result.catch(() => undefined));
        return result;
    },
} as unknown as LockManager;
