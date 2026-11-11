import {api, createdId} from "./client.tsx";
import type {ChangePasswordDto} from "./dto/ChangePasswordDto.tsx";
import type {DeleteAccountDto} from "./dto/DeleteAccountDto.tsx";
import type {IdentityProvider} from "./dto/IdentityProvider.tsx";
import type {LinkGitHubDto} from "./dto/LinkGitHubDto.tsx";
import type {LinkGoogleDto} from "./dto/LinkGoogleDto.tsx";
import type {PagedModel} from "./dto/PagedModel.tsx";
import type {RegisterDto} from "./dto/RegisterDto.tsx";
import type {UnlinkIdentityDto} from "./dto/UnlinkIdentityDto.tsx";
import type {UserDto} from "./dto/UserDto.tsx";
import type {UserStatsDto} from "./dto/UserStatsDto.tsx";
import type {UserUpdateDto} from "./dto/UserUpdateDto.tsx";

// Returns the new user's ID.
export async function register(registerDto: RegisterDto): Promise<number> {
    return createdId(await api.post("/users", registerDto));
}

export async function getCurrentUser(): Promise<UserDto> {
    return (await api.get<UserDto>("/users/me")).data;
}

export async function getCurrentUserStats(): Promise<UserStatsDto> {
    return (await api.get<UserStatsDto>("/users/me/stats")).data;
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

// The Google account may have another email than the user.
export async function linkGoogle(linkGoogleDto: LinkGoogleDto): Promise<void> {
    await api.post("/users/me/identities/google", linkGoogleDto);
}

// The server checks the password before it uses the code, which works once, so a wrong one can be retried.
export async function linkGitHub(linkGitHubDto: LinkGitHubDto): Promise<void> {
    await api.post("/users/me/identities/github", linkGitHubDto);
}

// The provider's path is its name in lower case, e.g. `/users/me/identities/google`.
export async function unlinkIdentity(provider: IdentityProvider, unlinkIdentityDto: UnlinkIdentityDto): Promise<void> {
    await api.delete(`/users/me/identities/${provider.toLowerCase()}`, {data: unlinkIdentityDto});
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
