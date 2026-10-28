// Query keys per resource. Every key starts with the resource's `all`, so invalidating `all` after a change
// refetches everything loaded from that resource; more specific keys refetch less.

export const userKeys = {
    all: ["users"] as const,
    me: () => [...userKeys.all, "me"] as const,
    list: (page: number) => [...userKeys.all, "list", page] as const,
    detail: (id: number) => [...userKeys.all, "detail", id] as const,
};

export const examKeys = {
    all: ["exams"] as const,
    list: (userId: number, page: number) => [...examKeys.all, "list", userId, page] as const,
    detail: (id: number) => [...examKeys.all, "detail", id] as const,
};

export const questionKeys = {
    all: ["questions"] as const,
    // A missing category or type is picked at random by the server.
    random: (category?: string, type?: string) => [...questionKeys.all, "random", {category, type}] as const,
    list: (page: number) => [...questionKeys.all, "list", page] as const,
    detail: (id: number) => [...questionKeys.all, "detail", id] as const,
};
