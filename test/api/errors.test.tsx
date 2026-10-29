import axios, {AxiosError} from "axios";
import {delay, http, HttpResponse} from "msw";
import {problem} from "@test/support/data.tsx";
import {apiUrl, server} from "@test/support/server.tsx";
import {type ApiError, errorMessage, fieldErrors, hasFieldErrors, toApiError} from "@/api/errors.tsx";

// Sends a request answered by `resolver` and returns what it rejected with.
async function rejectionOf(resolver: () => Response | Promise<Response>, timeout = 0): Promise<unknown> {
    server.use(http.get(apiUrl("/test"), resolver));
    const config = {timeout, transitional: {clarifyTimeoutError: true}};
    return axios.get(apiUrl("/test"), config).then(() => expect.fail("resolved"), (error: unknown) => error);
}

describe("toApiError", () => {
    it("recognises a network error", async () => {
        const error = await rejectionOf(() => HttpResponse.error());

        expect(toApiError(error)).toEqual({kind: "network"});
    });

    it("recognises a timeout", async () => {
        const error = await rejectionOf(async () => {
            await delay(100);
            return new HttpResponse(null, {status: 204});
        }, 10);

        expect(toApiError(error)).toEqual({kind: "timeout"});
    });

    it("treats an aborted request as unknown, not as a timeout", () => {
        const error = new AxiosError("Request aborted", AxiosError.ECONNABORTED);

        expect(toApiError(error)).toEqual({kind: "unknown", cause: error});
    });

    it.each([400, 409])("maps the details of a %i to fields", async status => {
        const details = {email: "Email is taken."};
        const error = await rejectionOf(() => HttpResponse.json(problem(status, details), {status}));

        expect(toApiError(error)).toEqual({kind: "validation", status, fields: details});
    });

    it("keeps the ProblemDetail of other error responses", async () => {
        const error = await rejectionOf(() => HttpResponse.json(problem(404), {status: 404}));

        expect(toApiError(error)).toEqual({kind: "http", status: 404, problem: problem(404)});
    });

    it.each([
        ["no body", 401, () => new HttpResponse(null, {status: 401})],
        ["a text body", 502, () => new HttpResponse("Bad gateway", {status: 502})],
        ["JSON that isn't a ProblemDetail", 500, () => HttpResponse.json({error: "Bad"}, {status: 500})],
        ["a ProblemDetail without a title", 500, () => HttpResponse.json({status: 500}, {status: 500})],
        ["a ProblemDetail without a type", 500, () => HttpResponse.json({title: "Title", status: 500}, {status: 500})],
        ["details that aren't an object", 400, () => HttpResponse.json({...problem(400), details: "oops"}, {status: 400})],
        ["null details", 400, () => HttpResponse.json({...problem(400), details: null}, {status: 400})],
    ])("returns only the status of a response with %s", async (_, status, resolver) => {
        const error = await rejectionOf(resolver);

        expect(toApiError(error)).toEqual({kind: "http", status});
    });

    it("treats an axios error without a response as unknown", () => {
        const error = new AxiosError("canceled", AxiosError.ERR_CANCELED);

        expect(toApiError(error)).toEqual({kind: "unknown", cause: error});
    });

    it.each([new Error("bug"), "text", null])("treats %s as unknown", error => {
        expect(toApiError(error)).toEqual({kind: "unknown", cause: error});
    });
});

describe("fieldErrors", () => {
    const messages = {
        userName: {400: "Invalid username.", 409: "Username is taken."},
        password: {400: "Invalid password."},
    };

    function validation(status: number, fields: Record<string, string>): ApiError {
        return {kind: "validation", status, fields};
    }

    it("maps each field to its message for the status", () => {
        const error = validation(400, {userName: "Size must be 3-31.", password: "Required."});

        expect(fieldErrors(error, messages)).toEqual({userName: "Invalid username.", password: "Invalid password."});
    });

    it("picks the message of the status", () => {
        expect(fieldErrors(validation(409, {userName: "Exists."}), messages)).toEqual({userName: "Username is taken."});
    });

    it("leaves out fields without a message for the status", () => {
        const error = validation(409, {userName: "Exists.", password: "Exists."});

        expect(fieldErrors(error, messages)).toEqual({userName: "Username is taken."});
    });

    it("leaves out fields the form doesn't have", () => {
        expect(fieldErrors(validation(400, {token: "Required."}), messages)).toEqual({});
    });

    it.each<ApiError>([
        {kind: "network"},
        {kind: "http", status: 400},
        {kind: "unknown", cause: null},
    ])("maps no fields for a $kind error", error => {
        expect(fieldErrors(error, messages)).toEqual({});
    });
});

describe("hasFieldErrors", () => {
    it("is true with a marked field", () => {
        expect(hasFieldErrors({userName: "Invalid username."})).toBe(true);
    });

    it("is false without one", () => {
        expect(hasFieldErrors({})).toBe(false);
    });
});

describe("errorMessage", () => {
    const unexpected = "Something went wrong. Please try again later.";

    it.each<[string, ApiError, string]>([
        ["no connection", {kind: "network"}, "Can't reach the server. Check your connection and try again."],
        ["a timeout", {kind: "timeout"}, "The server took too long to answer. Please try again."],
        ["a 429", {kind: "http", status: 429}, "Too many attempts. Wait a moment and try again."],
        ["a 503", {kind: "http", status: 503}, "The service is temporarily unavailable. Please try again later."],
        ["another status", {kind: "http", status: 500}, unexpected],
        ["a validation error", {kind: "validation", status: 400, fields: {}}, unexpected],
        ["an unknown error", {kind: "unknown", cause: null}, unexpected],
    ])("has a generic message for %s", (_, error, message) => {
        expect(errorMessage(error)).toBe(message);
    });

    it.each<ApiError>([
        {kind: "http", status: 401},
        {kind: "validation", status: 401, fields: {}},
    ])("prefers the caller's message for the status of a $kind error", error => {
        expect(errorMessage(error, {401: "Wrong password."})).toBe("Wrong password.");
    });

    it("overrides a generic status message", () => {
        expect(errorMessage({kind: "http", status: 429}, {429: "Too many sign-ins."})).toBe("Too many sign-ins.");
    });

    it("falls back to the generic message for other statuses", () => {
        expect(errorMessage({kind: "http", status: 500}, {401: "Wrong password."})).toBe(unexpected);
    });
});
