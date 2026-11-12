import {AxiosError, type AxiosResponse} from "axios";
import type {AuthTokensDto} from "@/api/dto/AuthTokensDto.tsx";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import type {GoogleSignInDto} from "@/api/dto/GoogleSignInDto.tsx";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import type {ProblemDetail} from "@/api/dto/ProblemDetail.tsx";
import type {RegisterDto} from "@/api/dto/RegisterDto.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";

export const credentials: LoginDto = {userName: "jan", password: "secret"};

export const googleSignInDto: GoogleSignInDto = {idToken: "google-id-token"};

export const gitHubSignInDto: GitHubSignInDto = {
    code: "github-code",
    codeVerifier: "code-verifier",
    redirectUri: "http://localhost:3000/auth/github/callback",
};

export const tokens: AuthTokensDto = {accessToken: "access-token", refreshToken: "refresh-token", expiresIn: 900};

export const registerDto: RegisterDto = {
    firstName: "Jan",
    lastName: "Kowalski",
    userName: "jan",
    email: "jan@example.com",
    password: "secret1",
};

// The longest email the server accepts: 254 characters, every domain label within its 63.
export const longestEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(58)}.pl`;

export const user: UserDto = {
    id: 1,
    firstName: "Jan",
    lastName: "Kowalski",
    userName: "jan",
    email: "jan@example.com",
    pendingEmail: null,
    awaitingNewEmailConfirmation: false,
    awaitingCurrentEmailConfirmation: false,
    role: "USER",
    hasPassword: true,
    providers: [],
};

// `user` changing their email, neither link opened yet.
export const changingEmailUser: UserDto = {
    ...user,
    pendingEmail: "jan.nowy@example.com",
    awaitingNewEmailConfirmation: true,
    awaitingCurrentEmailConfirmation: true,
};

// `user` signed up with Google, so a new username or email needs no password.
export const userWithoutPassword: UserDto = {...user, hasPassword: false, providers: ["GOOGLE"]};

// `userWithoutPassword` changing their email, as `changingEmailUser`.
export const changingEmailUserWithoutPassword: UserDto = {
    ...changingEmailUser,
    hasPassword: userWithoutPassword.hasPassword,
    providers: userWithoutPassword.providers,
};

// A ProblemDetail of `status`; `details` are the errors per field of a `400`/`409`.
export function problem(status: number, details?: Readonly<Record<string, string>>): ProblemDetail {
    return {type: "about:blank", title: "Title", status, detail: "Detail.", details};
}

// The error axios rejects with when the server answers `status`.
export function httpError(status: number): AxiosError {
    return new AxiosError("Request failed", undefined, undefined, undefined, {status} as AxiosResponse);
}
