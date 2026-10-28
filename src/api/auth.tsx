import {api} from "./client.tsx";
import type {LoginDto} from "./dto/LoginDto.tsx";
import type {VerifyEmailDto} from "./dto/VerifyEmailDto.tsx";
import type {ResendVerificationDto} from "./dto/ResendVerificationDto.tsx";
import type {ForgotPasswordDto} from "./dto/ForgotPasswordDto.tsx";
import type {ResetPasswordDto} from "./dto/ResetPasswordDto.tsx";
import {clearCredentials, saveCredentials} from "./credentials.tsx";

export async function login(loginDto: LoginDto) {
    clearCredentials();
    const response = await api.post("/auth", loginDto);
    saveCredentials(loginDto);
    return response;
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
