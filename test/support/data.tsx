import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import type {RegisterDto} from "@/api/dto/RegisterDto.tsx";

export const credentials: LoginDto = {userName: "jan", password: "secret"};

export const registerDto: RegisterDto = {
    firstName: "Jan",
    lastName: "Kowalski",
    userName: "jan",
    email: "jan@example.com",
    password: "secret1",
};

// The body the server sends for a `400`/`409` with errors per field.
export function validationProblem(status: number, details: Record<string, string>) {
    return {type: "about:blank", title: "Title", status, detail: "Detail.", instance: "/test", details};
}
