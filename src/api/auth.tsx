import {api, tokenApi, withLockedSession, withRefreshLock} from "./client.tsx";
import type {ChangePasswordDto} from "./dto/ChangePasswordDto.tsx";
import type {GitHubSignInDto} from "./dto/GitHubSignInDto.tsx";
import type {GoogleSignInDto} from "./dto/GoogleSignInDto.tsx";
import type {LoginDto} from "./dto/LoginDto.tsx";
import type {VerifyEmailDto} from "./dto/VerifyEmailDto.tsx";
import type {ResendVerificationDto} from "./dto/ResendVerificationDto.tsx";
import type {ForgotPasswordDto} from "./dto/ForgotPasswordDto.tsx";
import type {ResetPasswordDto} from "./dto/ResetPasswordDto.tsx";
import type {AuthTokensDto} from "./dto/AuthTokensDto.tsx";
import type {RefreshTokenDto} from "./dto/RefreshTokenDto.tsx";
import {clearTokens, endSession, expireSession, getRefreshToken, saveTokens} from "./tokens.tsx";

async function requestTokens(path: string, body: LoginDto | GoogleSignInDto | GitHubSignInDto) {
    clearTokens();
    const response = await api.post<AuthTokensDto>(path, body);
    saveTokens(response.data);
    return response;
}

export function login(loginDto: LoginDto) {
    return requestTokens("/auth", loginDto);
}

export function loginWithGoogle(googleSignInDto: GoogleSignInDto) {
    return requestTokens("/auth/google", googleSignInDto);
}

export function loginWithGitHub(gitHubSignInDto: GitHubSignInDto) {
    return requestTokens("/auth/github", gitHubSignInDto);
}

// Ends the session in every tab, then asks the server to revoke its refresh token. Ending it first works offline too;
// a failed request is ignored, as the token is gone from this browser either way and expires on the server.
export async function logout(): Promise<void> {
    // Under the refresh lock: a refresh already sent would store a new token after this one is gone, signing every tab
    // in again.
    const refreshToken = await withRefreshLock(async () => {
        const token = getRefreshToken();
        endSession();
        return token;
    });
    // None when another tab signed out first.
    if (refreshToken) {
        const body: RefreshTokenDto = {refreshToken};
        await tokenApi.post("/auth/logout", body).catch(() => undefined);
    }
}

// Changes the password, then signs in again with the new one, as the server revokes the refresh token of every session.
// Both under the refresh lock, so no tab refreshes with a revoked token in between. The new tokens replace the old ones
// without clearing them first, so other tabs keep the session and take the new refresh token on their next refresh.
// Rejects with the change's error; when signing in again fails, the session expires and the user signs in themselves.
export async function changePassword(userName: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    await withLockedSession(async authorization => {
        await tokenApi.patch("/users/me/password", changePasswordDto, {headers: {Authorization: authorization}});
        const loginDto: LoginDto = {userName, password: changePasswordDto.newPassword};
        try {
            saveTokens((await tokenApi.post<AuthTokensDto>("/auth", loginDto)).data);
        } catch {
            expireSession();
        }
    });
}

export async function verifyEmail(verifyEmailDto: VerifyEmailDto) {
    return await api.post("/auth/verify", verifyEmailDto);
}

export async function resendVerification(resendVerificationDto: ResendVerificationDto) {
    return await api.post("/auth/verify/resend", resendVerificationDto);
}

export async function forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return await api.post("/auth/password/forgot", forgotPasswordDto);
}

export async function resetPassword(resetPasswordDto: ResetPasswordDto) {
    return await api.post("/auth/password/reset", resetPasswordDto);
}
