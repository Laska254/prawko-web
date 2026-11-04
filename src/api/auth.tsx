import {api, tokenApi, withRefreshLock} from "./client.tsx";
import type {LoginDto} from "./dto/LoginDto.tsx";
import type {VerifyEmailDto} from "./dto/VerifyEmailDto.tsx";
import type {ResendVerificationDto} from "./dto/ResendVerificationDto.tsx";
import type {ForgotPasswordDto} from "./dto/ForgotPasswordDto.tsx";
import type {ResetPasswordDto} from "./dto/ResetPasswordDto.tsx";
import type {AuthTokensDto} from "./dto/AuthTokensDto.tsx";
import type {RefreshTokenDto} from "./dto/RefreshTokenDto.tsx";
import {clearTokens, endSession, getRefreshToken, saveTokens} from "./tokens.tsx";

export async function login(loginDto: LoginDto) {
    clearTokens();
    const response = await api.post<AuthTokensDto>("/auth", loginDto);
    saveTokens(response.data);
    return response;
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
