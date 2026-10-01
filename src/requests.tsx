import axios from "axios";
import type {LoginDto} from "./interface/dto/LoginDto.tsx";
import type {ChangePasswordDto} from "./interface/dto/ChangePasswordDto.tsx";
import type {RegisterDto} from "./interface/dto/RegisterDto.tsx";

const headers = {
    'Content-Type': 'application/json'
}

export async function login(loginDto: LoginDto) {
    return await axios.post("http://localhost:8080/auth", loginDto, {headers});
}

export async function register(registerDto: RegisterDto) {
    return await axios.post("http://localhost:8080/users", registerDto, {headers});
}

export async function changePassword(changePasswordDto: ChangePasswordDto) {
    return await axios.post("http://localhost:8080/auth/forgottenPassword", changePasswordDto, {headers})
}