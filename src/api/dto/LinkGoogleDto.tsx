import type {GoogleSignInDto} from "./GoogleSignInDto.tsx";

export interface LinkGoogleDto extends GoogleSignInDto {
    // Required when the user has a password, `null` without one.
    readonly currentPassword: string | null;
}
