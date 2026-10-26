import type {LoginDto} from "../interface/dto/LoginDto.tsx";
import type {RegisterDto} from "../interface/dto/RegisterDto.tsx";

export const credentials: LoginDto = {userName: "jan", password: "secret"};

export const registerDto: RegisterDto = {
    firstName: "Jan",
    lastName: "Kowalski",
    userName: "jan",
    email: "jan@example.com",
    password: "secret1",
};
