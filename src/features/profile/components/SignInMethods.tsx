import type {ReactNode} from "react";
import {Box, Stack, Typography} from "@mui/material";
import {CheckCircle, GitHub, Google, Password, RadioButtonUnchecked} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import type {IdentityProvider} from "@/api/dto/IdentityProvider.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {isGitHubAuthorizationSupported} from "@/components/github/gitHubAuthorization.tsx";
import {Panel} from "@/components/layout/Panel.tsx";
import {LinkGitHub} from "./LinkGitHub.tsx";
import {LinkGoogle} from "./LinkGoogle.tsx";
import {UnlinkProvider} from "./UnlinkProvider.tsx";

interface SignInMethodsProps {
    readonly user: UserDto;
    // GitHub's code, when the user just agreed to linking it on GitHub's page.
    readonly gitHubLink?: GitHubSignInDto;
}

interface SignInMethod {
    readonly name: ParseKeys<"profile">;
    readonly icon: ReactNode;
    readonly isSet: boolean;
    // The status shown when the method is set, and when it isn't.
    readonly setLabel: ParseKeys<"profile">;
    readonly unsetLabel: ParseKeys<"profile">;
    // `null` for the password.
    readonly provider: IdentityProvider | null;
}

interface MethodStatusProps {
    readonly method: SignInMethod;
}

// The icon only repeats what the text says.
function MethodStatus({method}: MethodStatusProps) {
    const {t} = useTranslation("profile");

    if (method.isSet) {
        return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <CheckCircle color="success" fontSize="small" aria-hidden/>
                <Typography variant="body2" color="success.main" fontWeight={600}>{t(method.setLabel)}</Typography>
            </Stack>
        );
    }
    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <RadioButtonUnchecked color="action" fontSize="small" aria-hidden/>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>{t(method.unsetLabel)}</Typography>
        </Stack>
    );
}

interface ProviderActionProps {
    readonly user: UserDto;
    readonly provider: IdentityProvider;
    readonly name: string;
    readonly gitHubLink: GitHubSignInDto | undefined;
}

// The server keeps at least one way to sign in, so the last one can't be unlinked. A provider is linked only with its
// client ID, and GitHub only where the browser can start its authorization.
function ProviderAction({user, provider, name, gitHubLink}: ProviderActionProps) {
    const {t} = useTranslation("profile");
    const methodCount = user.providers.length + Number(user.hasPassword);
    const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const gitHubClientId: string | undefined = import.meta.env.VITE_GITHUB_CLIENT_ID;

    if (!user.providers.includes(provider)) {
        if (provider === "GOOGLE" && googleClientId) {
            return <LinkGoogle clientId={googleClientId} name={name} hasPassword={user.hasPassword}/>;
        }
        if (provider === "GITHUB" && gitHubClientId && isGitHubAuthorizationSupported()) {
            return (
                <LinkGitHub clientId={gitHubClientId} name={name} hasPassword={user.hasPassword} returned={gitHubLink}/>
            );
        }
        return null;
    }
    if (methodCount === 1) {
        return <Typography variant="body2" color="text.secondary">{t("signInMethods.onlyMethod")}</Typography>;
    }
    return <UnlinkProvider provider={provider} name={name} hasPassword={user.hasPassword}/>;
}

// The ways the user can sign in: their password and each provider account linked to them.
export function SignInMethods({user, gitHubLink}: SignInMethodsProps) {
    const {t} = useTranslation("profile");
    const methods: readonly SignInMethod[] = [
        {
            name: "signInMethods.password",
            icon: <Password color="action" aria-hidden/>,
            isSet: user.hasPassword,
            setLabel: "signInMethods.passwordSet",
            unsetLabel: "signInMethods.passwordNotSet",
            provider: null,
        },
        {
            name: "signInMethods.google",
            icon: <Google color="action" aria-hidden/>,
            isSet: user.providers.includes("GOOGLE"),
            setLabel: "signInMethods.linked",
            unsetLabel: "signInMethods.notLinked",
            provider: "GOOGLE",
        },
        {
            name: "signInMethods.gitHub",
            icon: <GitHub color="action" aria-hidden/>,
            isSet: user.providers.includes("GITHUB"),
            setLabel: "signInMethods.linked",
            unsetLabel: "signInMethods.notLinked",
            provider: "GITHUB",
        },
    ];

    return (
        <Panel p={3} spacing={2}>
            <Typography variant="h6" component="h2" fontWeight={700}>{t("signInMethods.title")}</Typography>
            <Stack component="ul" spacing={1.5} m={0} p={0} sx={{listStyle: "none"}}>
                {methods.map(method => (
                    <Stack key={method.name} component="li" direction="row" flexWrap="wrap" alignItems="center"
                           columnGap={1}>
                        {method.icon}
                        <Typography fontWeight={600}>{t(method.name)}</Typography>
                        <MethodStatus method={method}/>
                        {method.provider && (
                            <Box ml="auto">
                                <ProviderAction user={user} provider={method.provider} name={t(method.name)}
                                                gitHubLink={gitHubLink}/>
                            </Box>
                        )}
                    </Stack>
                ))}
            </Stack>
        </Panel>
    );
}
