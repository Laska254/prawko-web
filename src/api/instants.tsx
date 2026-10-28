// Fields the server sends as UTC instant strings (`2026-10-23T12:00:00Z`).
const instantFields = new Set(["created", "updated", "expires"]);

// Returns a copy of parsed JSON with every instant field, at any depth, turned into a `Date`.
export function parseInstants(data: unknown): unknown {
    if (Array.isArray(data)) {
        return data.map(parseInstants);
    }
    if (data === null || typeof data !== "object") {
        return data;
    }
    // Leaves non-JSON objects (a `Blob`, an `ArrayBuffer`) as they are.
    if (Object.getPrototypeOf(data) !== Object.prototype) {
        return data;
    }
    return Object.fromEntries(Object.entries(data).map(([key, value]) => {
        if (instantFields.has(key) && typeof value === "string") {
            return [key, new Date(value)];
        }
        return [key, parseInstants(value)];
    }));
}
