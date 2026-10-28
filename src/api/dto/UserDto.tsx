import type {Role} from "./Role.tsx";

export interface UserDto {
    readonly id: number;
    readonly firstName: string;
    readonly lastName: string;
    readonly userName: string;
    readonly email: string;
    readonly pendingEmail: string | null;
    readonly awaitingNewEmailConfirmation: boolean;
    readonly awaitingCurrentEmailConfirmation: boolean;
    readonly role: Role;
}
