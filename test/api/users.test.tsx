import {apiUrl, mockRequest} from "@test/support/server.tsx";
import {registerDto, user} from "@test/support/data.tsx";
import {
    changePassword,
    deleteAccount,
    deleteUser,
    getCurrentUser,
    getUser,
    getUsers,
    register,
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

    it("updates a user and returns them", async () => {
        const requests = mockRequest("patch", "/users/1", {body: {...user, firstName: "Anna"}});

        expect(await updateUser(1, {firstName: "Anna"})).toEqual({...user, firstName: "Anna"});
        expect(requests).toEqual([{search: "", body: {firstName: "Anna"}}]);
    });

    it("changes the password", async () => {
        const changePasswordDto = {currentPassword: "secret1", newPassword: "secret2"};
        const requests = mockRequest("patch", "/users/me/password", {status: 204});

        await expect(changePassword(changePasswordDto)).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: changePasswordDto}]);
    });

    it("deletes the own account with the password", async () => {
        const requests = mockRequest("delete", "/users/me", {status: 204});

        await expect(deleteAccount({password: "secret1"})).resolves.toBeUndefined();
        expect(requests).toEqual([{search: "", body: {password: "secret1"}}]);
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
