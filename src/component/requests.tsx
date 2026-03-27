import axios from "axios";
import type {LoginDto} from "./interfaces.tsx";

const headers = {
    'Content-Type': 'application/json'
}

export async function login(loginDto: LoginDto) {
    return await axios.post("https://localhost:8080/auth/login", loginDto, {headers});
}