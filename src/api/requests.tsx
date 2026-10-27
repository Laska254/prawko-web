import axios from "axios";
import type {LoginDto} from "./dto/LoginDto.tsx";
import type {RegisterDto} from "./dto/RegisterDto.tsx";
import type {VerifyEmailDto} from "./dto/VerifyEmailDto.tsx";
import type {ResendVerificationDto} from "./dto/ResendVerificationDto.tsx";
import type {ForgotPasswordDto} from "./dto/ForgotPasswordDto.tsx";
import type {ResetPasswordDto} from "./dto/ResetPasswordDto.tsx";
import {clearCredentials, getCredentials, saveCredentials} from "./credentials.tsx";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {'Content-Type': 'application/json'}
});

api.interceptors.request.use(config => {
    const credentials = getCredentials();
    if (credentials) {
        config.headers.Authorization = `Basic ${credentials}`;
    }
    return config;
});

api.interceptors.response.use(undefined, error => {
    if (error.response?.status === 401 && getCredentials()) {
        clearCredentials();
        window.location.assign("/auth");
    }
    return Promise.reject(error);
});

export async function login(loginDto: LoginDto) {
    clearCredentials();
    const response = await api.post("/auth", loginDto);
    saveCredentials(loginDto);
    return response;
}

export async function register(registerDto: RegisterDto) {
    return await api.post("/users", registerDto);
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
