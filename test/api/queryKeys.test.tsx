import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw/http";
import {apiUrl, server} from "@test/support/server.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {SampleUser} from "@test/support/SampleUser.tsx";
import {examKeys, questionKeys, userKeys} from "@/api/queryKeys.tsx";

// Serves `/users/me` from a stored name that `PATCH /users/1` changes; returns how many GETs came in.
function mockUser(getStatus = 200) {
    let firstName = "Jan";
    let getCount = 0;
    server.use(
        http.get(apiUrl("/users/me"), () => {
            getCount++;
            return HttpResponse.json({firstName}, {status: getStatus});
        }),
        http.patch(apiUrl("/users/1"), async ({request}) => {
            firstName = (await request.json() as {firstName: string}).firstName;
            return new HttpResponse(null, {status: 204});
        }),
    );
    return () => getCount;
}

describe("queryKeys", () => {
    it.each([
        [userKeys.me(), ["users", "me"]],
        [userKeys.list(2), ["users", "list", 2]],
        [userKeys.detail(1), ["users", "detail", 1]],
        [examKeys.list(1, 2), ["exams", "list", 1, 2]],
        [examKeys.detail(3), ["exams", "detail", 3]],
        [questionKeys.random(), ["questions", "random"]],
        [questionKeys.list(2), ["questions", "list", 2]],
        [questionKeys.detail(4), ["questions", "detail", 4]],
    ])("builds %j", (key, expected) => {
        expect(key).toEqual(expected);
    });

    it("loads a query and refetches it after a mutation invalidates the resource", async () => {
        const getCount = mockUser();
        renderWithProviders(<SampleUser/>);

        expect(screen.getByText("Loading")).toBeInTheDocument();
        expect(await screen.findByText("Jan")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", {name: "Rename"}));

        expect(await screen.findByText("Anna")).toBeInTheDocument();
        expect(getCount()).toBe(2);
    });

    it("shows the error of a query the server rejects, without retrying", async () => {
        const getCount = mockUser(404);
        renderWithProviders(<SampleUser/>);

        expect(await screen.findByText("Error")).toBeInTheDocument();
        expect(getCount()).toBe(1);
    });

    it("gives each render a fresh cache", async () => {
        mockUser();
        const {queryClient} = renderWithProviders(<SampleUser/>);
        await screen.findByText("Jan");

        expect(queryClient.getQueryData(userKeys.me())).toEqual({firstName: "Jan"});
        expect(renderWithProviders(<p/>).queryClient.getQueryData(userKeys.me())).toBeUndefined();
    });
});
