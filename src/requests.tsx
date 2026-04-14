import axios from "axios";
import type {LoginDto} from "./interface/dto/LoginDto.tsx";
import type {ChangePasswordDto} from "./interface/dto/ChangePasswordDto.tsx";

const headers = {
    'Content-Type': 'application/json'
}

export async function login(loginDto: LoginDto) {
    return await axios.post("http://localhost:8080/auth", loginDto, {headers});
}

export async function changePassword(changePasswordDto: ChangePasswordDto) {
    return await axios.post("http://localhost:8080/auth/forgottenPassword", changePasswordDto, {headers})
}