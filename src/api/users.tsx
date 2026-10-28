import {api, createdId} from "./client.tsx";
import type {ChangePasswordDto} from "./dto/ChangePasswordDto.tsx";
import type {DeleteAccountDto} from "./dto/DeleteAccountDto.tsx";
import type {PagedModel} from "./dto/PagedModel.tsx";
import type {RegisterDto} from "./dto/RegisterDto.tsx";
import type {UserDto} from "./dto/UserDto.tsx";
import type {UserUpdateDto} from "./dto/UserUpdateDto.tsx";

// Returns the new user's ID.
export async function register(registerDto: RegisterDto): Promise<number> {
    return createdId(await api.post("/users", registerDto));
}

export async function getCurrentUser(): Promise<UserDto> {
    return (await api.get<UserDto>("/users/me")).data;
}

// Admins can't change another user's email.
export async function updateUser(id: number, userUpdateDto: UserUpdateDto): Promise<UserDto> {
    return (await api.patch<UserDto>(`/users/${id}`, userUpdateDto)).data;
}

export async function changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    await api.patch("/users/me/password", changePasswordDto);
}

export async function deleteAccount(deleteAccountDto: DeleteAccountDto): Promise<void> {
    await api.delete("/users/me", {data: deleteAccountDto});
}

// Admin only, `page` is zero-based.
export async function getUsers(page: number): Promise<PagedModel<UserDto>> {
    return (await api.get<PagedModel<UserDto>>("/users", {params: {page}})).data;
}

// Admin only; users read themselves with `getCurrentUser`.
export async function getUser(id: number): Promise<UserDto> {
    return (await api.get<UserDto>(`/users/${id}`)).data;
}

// Admin only.
export async function deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
}
