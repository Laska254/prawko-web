import {api, createdId} from "./client.tsx";
import {expireSession, isAuthenticated} from "./tokens.tsx";
import type {ConfirmAccountDeletionDto} from "./dto/ConfirmAccountDeletionDto.tsx";
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

// Sends a link to the user's email; the account is deleted only once it's opened and confirmed.
export async function requestAccountDeletion(deleteAccountDto: DeleteAccountDto): Promise<void> {
    await api.post("/users/me/deletion", deleteAccountDto);
}

// Deletes the account of the emailed link, signed in or not, as the link may be opened on another device. The server
// ends that account's sessions, most likely the one in this browser, so a session here ends too, telling the user why.
// Rejects with the request's error and keeps the session.
export async function confirmAccountDeletion(confirmAccountDeletionDto: ConfirmAccountDeletionDto): Promise<void> {
    await api.post("/users/deletion/confirm", confirmAccountDeletionDto);
    if (isAuthenticated()) {
        expireSession("accountDeleted");
    }
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
