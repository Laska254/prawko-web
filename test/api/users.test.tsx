import {apiUrl, mockRequest} from "@test/support/server.tsx";
import {gitHubSignInDto, registerDto, tokens, user} from "@test/support/data.tsx";
import {getRefreshToken, onSessionEnded, saveTokens} from "@/api/tokens.tsx";
import type {UserStatsDto} from "@/api/dto/UserStatsDto.tsx";
import {
    confirmAccountDeletion,
    deleteUser,
    getCurrentUser,
    getCurrentUserStats,
    getUser,
    getUsers,
    linkGitHub,
    linkGoogle,
    register,
    requestAccountDeletion,
    unlinkIdentity,
    updateUser,
} from "@/api/users.tsx";

describe("users", () => {
    it("registers and returns the new user's ID from Location", async () => {
        const requests = mockRequest("post", "/users",
            {status: 201, headers: {Location: apiUrl("/users/5")}});

        expect(await register(registerDto)).toBe(5);
        expect(requests).toEqual([{search: "", body: registerDto}]);
    });

    it("gets the current user", async () => {
        const requests = mockRequest("get", "/users/me", {body: user});

        expect(await getCurrentUser()).toEqual(user);
        expect(requests).toEqual([{search: "", body: undefined}]);
    });

    it("gets the current user's exam statistics", async () => {
        const stats: UserStatsDto = {
            examsTaken: 3,
            examsPassed: 1,
            averageScore: 63.5,
            bestScore: 72,
            categories: [{category: "B", examsTaken: 3, examsPassed: 1, averageScore: 63.5, bestScore: 72}],
        };
        const requests = mockRequest("get", "/users/me/stats", {body: stats});

        expect(await getCurrentUserStats()).toEqual(stats);
        expect(requests).toEqual([{search: "", body: undefined}]);
    });

    it("updates a user and returns them", async () => {
        const requests = mockRequest("patch", "/users/1", {body: {...user, firstName: "Anna"}});

        expect(await updateUser(1, {firstName: "Anna"})).toEqual({...user, firstName: "Anna"});
        expect(requests).toEqual([{search: "", body: {firstName: "Anna"}}]);
    });

    it("requests the own account's deletion with the password", async () => {
        const requests = mockRequest("post", "/users/me/deletion", {status: 204});

        await expect(requestAccountDeletion({password: "secret1"})).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: {password: "secret1"}}]);
    });

    it("confirms the account's deletion and ends the session as deleted", async () => {
        saveTokens(tokens);
        const listener = vi.fn();
        const stopListening = onSessionEnded(listener);
        const requests = mockRequest("post", "/users/deletion/confirm", {status: 204});

        await expect(confirmAccountDeletion({token: "token"})).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: {token: "token"}}]);
        expect(getRefreshToken()).toBeNull();
        expect(listener).toHaveBeenCalledExactlyOnceWith("accountDeleted");
        stopListening();
    });

    it("confirms the account's deletion signed out without ending a session", async () => {
        const listener = vi.fn();
        const stopListening = onSessionEnded(listener);
        mockRequest("post", "/users/deletion/confirm", {status: 204});

        await expect(confirmAccountDeletion({token: "token"})).resolves.toBeUndefined();
        expect(listener).not.toHaveBeenCalled();
        stopListening();
    });

    it("keeps the session when confirming the deletion failed", async () => {
        saveTokens(tokens);
        const listener = vi.fn();
        const stopListening = onSessionEnded(listener);
        mockRequest("post", "/users/deletion/confirm", {status: 400});

        await expect(confirmAccountDeletion({token: "token"})).rejects.toMatchObject({response: {status: 400}});
        expect(getRefreshToken()).toBe(tokens.refreshToken);
        expect(listener).not.toHaveBeenCalled();
        stopListening();
    });

    it("links a GitHub account with the current password", async () => {
        const requests = mockRequest("post", "/users/me/identities/github", {status: 204});

        await expect(linkGitHub({...gitHubSignInDto, currentPassword: "secret1"})).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: {...gitHubSignInDto, currentPassword: "secret1"}}]);
    });

    it("links a Google account with the current password", async () => {
        const requests = mockRequest("post", "/users/me/identities/google", {status: 204});

        await expect(linkGoogle({idToken: "google-id-token", currentPassword: "secret1"})).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: {idToken: "google-id-token", currentPassword: "secret1"}}]);
    });

    it.each([
        ["GOOGLE", "/users/me/identities/google"],
        ["GITHUB", "/users/me/identities/github"],
    ] as const)("unlinks %s with the current password", async (provider, path) => {
        const requests = mockRequest("delete", path, {status: 204});

        await expect(unlinkIdentity(provider, {currentPassword: "secret1"})).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: {currentPassword: "secret1"}}]);
    });

    it("gets a page of users", async () => {
        const page = {content: [user], page: {size: 20, number: 2, totalElements: 41, totalPages: 3}};
        const requests = mockRequest("get", "/users", {body: page});

        expect(await getUsers(2)).toEqual(page);
        expect(requests).toEqual([{search: "?page=2", body: undefined}]);
    });

    it("gets a user by ID", async () => {
        const requests = mockRequest("get", "/users/1", {body: user});

        expect(await getUser(1)).toEqual(user);
        expect(requests).toEqual([{search: "", body: undefined}]);
    });

    it("deletes a user by ID", async () => {
        const requests = mockRequest("delete", "/users/1", {status: 204});

        await expect(deleteUser(1)).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: undefined}]);
    });
});
