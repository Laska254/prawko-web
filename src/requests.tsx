import axios from "axios";
import type {LoginDto} from "./interface/dto/LoginDto.tsx";
import type {ChangePasswordDto} from "./interface/dto/ChangePasswordDto.tsx";
import type {RegisterDto} from "./interface/dto/RegisterDto.tsx";
import {clearCredentials, getCredentials, saveCredentials} from "./auth.tsx";

const api = axios.create({
    baseURL: "http://localhost:8080",
    headers: {'Content-Type': 'application/json'}
});

api.interceptors.request.use(config => {
    const credentials = getCredentials();
    if (credentials) {
        config.headers.Authorization = `Basic ${credentials}`;
    }
    return config;
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

export async function changePassword(changePasswordDto: ChangePasswordDto) {
    return await api.post("/auth/forgottenPassword", changePasswordDto)
}
