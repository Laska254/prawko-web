import type {JsonBodyType} from "msw";
import {http, HttpResponse} from "msw/http";
import {setupServer} from "msw/node";

export const server = setupServer();

export function apiUrl(path: string): string {
    return `${import.meta.env.VITE_API_URL}${path}`;
}

// Answers POST `path` with `status` (and `body` as JSON); returns the received request bodies.
export function mockPost(path: string, status = 204, body?: JsonBodyType): unknown[] {
    const requests: unknown[] = [];
    server.use(http.post(apiUrl(path), async ({request}) => {
        requests.push(await request.json());
        return body === undefined ? new HttpResponse(null, {status}) : HttpResponse.json(body, {status});
    }));
    return requests;
}

// Like `mockPost`, but holds the response until `respond()` is called, to check the UI while sending.
export function mockPendingPost(path: string, status = 204) {
    let respond!: () => void;
    const responded = new Promise<void>(resolve => respond = resolve);
    let requestCount = 0;
    server.use(http.post(apiUrl(path), async () => {
        requestCount++;
        await responded;
        return new HttpResponse(null, {status});
    }));
    return {respond, requestCount: () => requestCount};
}

export function mockNetworkError(path: string): void {
    server.use(http.post(apiUrl(path), () => HttpResponse.error()));
}

interface MockResponse {
    readonly status?: number;
    readonly body?: JsonBodyType;
    readonly headers?: Record<string, string>;
}

interface ReceivedRequest {
    readonly search: string;
    readonly body: unknown;
}

// Answers `method` `path` with `status`, `headers` (and `body` as JSON); returns each received request's query
// string and JSON body (`undefined` without one).
export function mockRequest(method: "get" | "post" | "patch" | "delete", path: string,
                            {status = 200, body, headers}: MockResponse = {}): ReceivedRequest[] {
    const requests: ReceivedRequest[] = [];
    server.use(http[method](apiUrl(path), async ({request}) => {
        const text = await request.text();
        let requestBody: unknown;
        if (text) {
            requestBody = JSON.parse(text);
        }
        requests.push({search: new URL(request.url).search, body: requestBody});
        if (body === undefined) {
            return new HttpResponse(null, {status, headers});
        }
        return HttpResponse.json(body, {status, headers});
    }));
    return requests;
}
