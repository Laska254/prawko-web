import {parseInstants} from "@/api/instants.tsx";

describe("parseInstants", () => {
    it("turns the instant fields into dates", () => {
        expect(parseInstants({
            created: "2026-10-23T12:00:00Z",
            updated: "2026-10-23T12:10:00.123456Z",
            expires: "2026-10-23T12:25:00Z",
        })).toEqual({
            created: new Date(Date.UTC(2026, 9, 23, 12, 0)),
            updated: new Date(Date.UTC(2026, 9, 23, 12, 10, 0, 123)),
            expires: new Date(Date.UTC(2026, 9, 23, 12, 25)),
        });
    });

    it("parses instants inside nested objects and arrays", () => {
        expect(parseInstants({content: [{id: 1, created: "2026-10-23T12:00:00Z"}]}))
            .toEqual({content: [{id: 1, created: new Date(Date.UTC(2026, 9, 23, 12, 0))}]});
    });

    it("keeps other fields and non-string instant fields as they are", () => {
        const data = {name: "2026-10-23T12:00:00Z", created: null, score: 0, active: true, tags: ["B"]};

        expect(parseInstants(data)).toEqual(data);
    });

    it.each([null, "", "text", 1, true, new Blob(), new ArrayBuffer(1)])("returns %j unchanged", data => {
        expect(parseInstants(data)).toBe(data);
    });
});
