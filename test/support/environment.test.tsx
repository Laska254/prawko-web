import {http, HttpResponse} from "msw/http";
import type {Dispatcher} from "undici";
import {api} from "@/api/client.tsx";
import environment, {closeEachConnection} from "./environment.tsx";
import {apiUrl, server} from "./server.tsx";

describe("environment", () => {
    // The tests run in it, so jsdom already sends these requests with its dispatcher.
    it("sends each request of jsdom on a connection of its own", async () => {
        const connections: (string | null)[] = [];
        server.use(http.post(apiUrl("/auth/verify"), ({request}) => {
            connections.push(request.headers.get("Connection"));
            return new HttpResponse(null, {status: 204});
        }));

        await api.post("/auth/verify");
        await api.post("/auth/verify");

        expect(connections).toEqual(["close", "close"]);
    });

    it("sets up jsdom on the given global", async () => {
        const global = {};

        const {teardown} = await environment.setup(global, {});

        expect(global).toHaveProperty("document");
        await teardown(global);
    });

    it("dispatches each request with a connection that's closed after it", () => {
        const dispatch = vi.fn<Dispatcher["dispatch"]>().mockReturnValue(true);
        const request: Dispatcher.DispatchOptions = {origin: "http://localhost:3000", path: "/", method: "GET"};
        const handler: Dispatcher.DispatchHandler = {};

        closeEachConnection(dispatch)(request, handler);

        expect(dispatch).toHaveBeenCalledExactlyOnceWith({...request, reset: true}, handler);
    });
});
