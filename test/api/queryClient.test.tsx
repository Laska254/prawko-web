import axios, {AxiosError} from "axios";
import {MutationObserver} from "@tanstack/react-query";
import {http, HttpResponse} from "msw/http";
import {apiUrl, server} from "@test/support/server.tsx";
import {createTestQueryClient} from "@test/support/render.tsx";
import {httpError} from "@test/support/data.tsx";
import {createQueryClient, shouldRetry} from "@/api/queryClient.tsx";

function emptyResponse(status: number) {
    return () => new HttpResponse(null, {status});
}

// Answers GET and POST `/test` with what `response` returns; returns how many requests came in.
function mockResponse(response: () => Response) {
    let requestCount = 0;
    const respond = () => {
        requestCount++;
        return response();
    };
    server.use(http.get(apiUrl("/test"), respond), http.post(apiUrl("/test"), respond));
    return () => requestCount;
}

describe("queryClient", () => {
    describe("shouldRetry", () => {
        it.each([
            ["a network error", new AxiosError("Network Error", AxiosError.ERR_NETWORK)],
            ["a 500", httpError(500)],
            ["a 503", httpError(503)],
        ])("retries %s", (_, error) => {
            expect(shouldRetry(0, error)).toBe(true);
            expect(shouldRetry(2, error)).toBe(true);
        });

        it.each([
            ["a 400", httpError(400)],
            ["a 401", httpError(401)],
            ["a 404", httpError(404)],
            ["an error from our code", new TypeError("x is undefined")],
        ])("doesn't retry %s", (_, error) => {
            expect(shouldRetry(0, error)).toBe(false);
        });

        it("gives up after three retries", () => {
            expect(shouldRetry(3, httpError(500))).toBe(false);
        });
    });

    describe("createQueryClient", () => {
        it("returns a new client each time", () => {
            expect(createQueryClient()).not.toBe(createQueryClient());
        });

        it.each([
            ["a network error", 4, () => HttpResponse.error()],
            ["a 500", 4, emptyResponse(500)],
            ["a 404", 1, emptyResponse(404)],
        ])("sends a query that fails with %s %i times", async (_, expected, response) => {
            const requestCount = mockResponse(response);

            const query = createTestQueryClient().fetchQuery({
                queryKey: ["test"],
                queryFn: () => axios.get(apiUrl("/test")),
            });

            await expect(query).rejects.toThrow();
            expect(requestCount()).toBe(expected);
        });

        it("doesn't retry a mutation", async () => {
            const requestCount = mockResponse(emptyResponse(500));
            const mutation = new MutationObserver(createTestQueryClient(), {
                mutationFn: () => axios.post(apiUrl("/test")),
            });

            await expect(mutation.mutate()).rejects.toThrow();
            expect(requestCount()).toBe(1);
        });
    });
});
