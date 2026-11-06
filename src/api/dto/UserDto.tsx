import type {IdentityProvider} from "./IdentityProvider.tsx";
import type {Role} from "./Role.tsx";

export interface UserDto {
    readonly id: number;
    // `null` when the provider the user signed up with didn't share it.
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly userName: string;
    readonly email: string;
    readonly pendingEmail: string | null;
    readonly awaitingNewEmailConfirmation: boolean;
    readonly awaitingCurrentEmailConfirmation: boolean;
    readonly role: Role;
    readonly hasPassword: boolean;
    readonly providers: readonly IdentityProvider[];
}
