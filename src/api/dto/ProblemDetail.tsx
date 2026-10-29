// Spring's RFC 9457 error body. The server's English texts are never shown as they are.
export interface ProblemDetail {
    readonly type: string;
    readonly title: string;
    readonly status: number;
    readonly detail?: string;
    readonly instance?: string;
    // Field name → message, sent with validation (`400`) and conflict (`409`) errors.
    readonly details?: Readonly<Record<string, string>>;
}
