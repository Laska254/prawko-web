import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {UserStatsDto} from "@/api/dto/UserStatsDto.tsx";
import {saveTokens} from "@/api/tokens.tsx";
import {ExamStats} from "@/features/profile/components/ExamStats.tsx";
import {tokens} from "@test/support/data.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockPendingRequest, mockRequest} from "@test/support/server.tsx";

const stats: UserStatsDto = {
    examsTaken: 3,
    examsPassed: 1,
    averageScore: 64.33333333333333,
    bestScore: 72,
    categories: [
        {category: "A", examsTaken: 1, examsPassed: 0, averageScore: 51, bestScore: 51},
        {category: "B", examsTaken: 2, examsPassed: 1, averageScore: 71, bestScore: 72},
    ],
};

const noExams: UserStatsDto = {examsTaken: 0, examsPassed: 0, averageScore: null, bestScore: null, categories: []};

// Returns the query client.
function renderStats() {
    saveTokens(tokens);
    return renderAtRoute(<ExamStats/>, "/profile").queryClient;
}

function panel() {
    return screen.getByRole("region", {name: "Exam statistics"});
}

// The value next to each label of the scores' description list.
function scores() {
    return within(panel()).getAllByRole("term").map(term => [term.textContent, term.nextElementSibling?.textContent]);
}

// A meter's label, value, maximum and spoken value, e.g. ["Pass rate", "1", "3", "33%"].
function meter(element: HTMLElement) {
    return [element.getAttribute("aria-label"), ...["now", "max", "text"].map(name => element.getAttribute(`aria-value${name}`))];
}

// Each category card's title, counts, figures and meters.
function categoryCards() {
    return within(screen.getByRole("list", {name: "By category"})).getAllByRole("listitem").map(card => ({
        title: within(card).getByRole("heading").textContent,
        texts: [...card.querySelectorAll("p")].map(text => text.textContent),
        meters: within(card).getAllByRole("meter").map(meter),
    }));
}

describe("ExamStats", () => {
    it("shows the pass rate, the scores and a card per category", async () => {
        const requests = mockRequest("get", "/users/me/stats", {body: stats});
        renderStats();

        await screen.findByRole("list", {name: "By category"});

        expect(within(panel()).getByText("33%")).toBeInTheDocument();
        expect(within(panel()).getByText("Pass rate · 1 of 3 passed")).toBeInTheDocument();
        expect(within(panel()).getAllByRole("meter").map(meter)[0]).toEqual(["Pass rate", "1", "3", "33%"]);
        expect(scores()).toEqual([
            ["Average score", "64.3"],
            ["Best score", "72 / 74"],
        ]);
        expect(categoryCards()).toEqual([
            {
                title: "Category A",
                texts: ["Finished: 1 · passed: 0", "Pass rate", "0%", "Average score", "51 · best 51"],
                meters: [["Pass rate", "0", "1", "0%"], ["Average score", "51", "74", "51"]],
            },
            {
                title: "Category B",
                texts: ["Finished: 2 · passed: 1", "Pass rate", "50%", "Average score", "71 · best 72"],
                meters: [["Pass rate", "1", "2", "50%"], ["Average score", "71", "74", "71"]],
            },
        ]);
        expect(within(panel()).getByText("Pass mark: 68 of 74 points")).toBeInTheDocument();
        expect(requests).toHaveLength(1);
    });

    it("shows the loading while the stats are fetched", async () => {
        const {respond} = mockPendingRequest("get", "/users/me/stats", {body: stats});
        renderStats();

        expect(within(panel()).getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();

        respond();

        expect(await screen.findByRole("list", {name: "By category"})).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("links to a new exam without any finished one", async () => {
        mockRequest("get", "/users/me/stats", {body: noExams});
        const userEvents = userEvent.setup();
        renderStats();

        expect(await screen.findByText("You haven't finished any exams yet. Your results will show up here."))
            .toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();

        await userEvents.click(screen.getByRole("link", {name: "Start an exam"}));

        expect(currentLocation().pathname).toBe("/exam");
    });

    it("shows the error and loads the stats on trying again", async () => {
        mockRequest("get", "/users/me/stats", {status: 404});
        const userEvents = userEvent.setup();
        renderStats();

        const error = await within(panel()).findByRole("alert");
        expect(error).toHaveTextContent("Something went wrong. Please try again later.");

        const {respond} = mockPendingRequest("get", "/users/me/stats", {body: stats});
        await userEvents.click(within(error).getByRole("button", {name: "Try again"}));

        await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
        expect(within(panel()).getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();

        respond();

        expect(await screen.findByRole("list", {name: "By category"})).toBeInTheDocument();
    });

    it("keeps the stats loaded before when fetching them again fails", async () => {
        mockRequest("get", "/users/me/stats", {body: stats});
        const queryClient = renderStats();
        await screen.findByRole("list", {name: "By category"});

        mockRequest("get", "/users/me/stats", {status: 404});
        await act(() => queryClient.refetchQueries());

        expect(queryClient.getQueryState(["users", "me", "stats"])?.status).toBe("error");
        expect(screen.getByRole("list", {name: "By category"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
