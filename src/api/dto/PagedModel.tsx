// Spring's `PagedModel`: one page of `content` and where it sits in the whole list.
export interface PagedModel<T> {
    readonly content: readonly T[];
    readonly page: PageMetadata;
}

export interface PageMetadata {
    readonly size: number;
    // Zero-based.
    readonly number: number;
    readonly totalElements: number;
    readonly totalPages: number;
}
