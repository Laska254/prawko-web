import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import type {ProblemDetail} from "@/api/dto/ProblemDetail.tsx";
import type {RegisterDto} from "@/api/dto/RegisterDto.tsx";

export const credentials: LoginDto = {userName: "jan", password: "secret"};

export const registerDto: RegisterDto = {
    firstName: "Jan",
    lastName: "Kowalski",
    userName: "jan",
    email: "jan@example.com",
    password: "secret1",
};

// A ProblemDetail of `status`; `details` are the errors per field of a `400`/`409`.
export function problem(status: number, details?: Readonly<Record<string, string>>): ProblemDetail {
    return {type: "about:blank", title: "Title", status, detail: "Detail.", details};
}
