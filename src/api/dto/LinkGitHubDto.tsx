import type {GitHubSignInDto} from "./GitHubSignInDto.tsx";

export interface LinkGitHubDto extends GitHubSignInDto {
    // Required when the user has a password, `null` without one.
    readonly currentPassword: string | null;
}
