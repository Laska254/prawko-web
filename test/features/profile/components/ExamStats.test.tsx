import {screen, waitFor, within} from "@testing-library/react";
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

function renderStats() {
    saveTokens(tokens);
    renderAtRoute(<ExamStats/>, "/profile");
}

function panel() {
    return screen.getByRole("region", {name: "Exam statistics"});
}

// The value next to each label of the totals' description list.
function totals() {
    return within(panel()).getAllByRole("term").map(term => [term.textContent, term.nextElementSibling?.textContent]);
}

// The text of each cell, row by row, header row first.
function categoryRows() {
    return within(screen.getByRole("table", {name: "By category"})).getAllByRole("row")
        .map(row => [...row.children].map(cell => cell.textContent));
}

describe("ExamStats", () => {
    it("shows the totals and a row per category", async () => {
        const requests = mockRequest("get", "/users/me/stats", {body: stats});
        renderStats();

        await screen.findByRole("table", {name: "By category"});

        expect(totals()).toEqual([
            ["Finished exams", "3"],
            ["Passed", "1"],
            ["Pass rate", "33%"],
            ["Average score", "64.3"],
            ["Best score", "72"],
        ]);
        expect(categoryRows()).toEqual([
            ["Category", "Finished exams", "Passed", "Pass rate", "Average score", "Best score"],
            ["A", "1", "0", "0%", "51", "51"],
            ["B", "2", "1", "50%", "71", "72"],
        ]);
        expect(requests).toHaveLength(1);
    });

    it("shows the loading while the stats are fetched", async () => {
        const {respond} = mockPendingRequest("get", "/users/me/stats", {body: stats});
        renderStats();

        expect(within(panel()).getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();

        respond();

        expect(await screen.findByRole("table", {name: "By category"})).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("links to a new exam without any finished one", async () => {
        mockRequest("get", "/users/me/stats", {body: noExams});
        const userEvents = userEvent.setup();
        renderStats();

        expect(await screen.findByText("You haven't finished any exams yet. Your results will show up here."))
            .toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();

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

        expect(await screen.findByRole("table", {name: "By category"})).toBeInTheDocument();
    });
});
