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
    // Called once GitHub's code is used up or the user cancelled linking.
    readonly onGitHubLinkDone: () => void;
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
    readonly isOnlyMethod: boolean;
}

// The icon only repeats what the text says.
function MethodStatus({method, isOnlyMethod}: MethodStatusProps) {
    const {t} = useTranslation("profile");

    if (method.isSet) {
        return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <CheckCircle color="success" fontSize="small" aria-hidden/>
                <Typography variant="body2" color="success.main" fontWeight={600}>{t(method.setLabel)}</Typography>
                {isOnlyMethod && (
                    <>
                        <Typography component="span" variant="body2" color="text.secondary" aria-hidden>·</Typography>
                        <Typography variant="body2" color="text.secondary">{t("signInMethods.onlyMethod")}</Typography>
                    </>
                )}
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
    readonly isOnlyMethod: boolean;
    readonly gitHubLink: GitHubSignInDto | undefined;
    readonly onGitHubLinkDone: () => void;
}

// The only way to sign in can't be unlinked; its status says why. A provider is linked only with its client ID, and
// GitHub only where the browser can start its authorization.
function ProviderAction({user, provider, name, isOnlyMethod, gitHubLink, onGitHubLinkDone}: ProviderActionProps) {
    const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const gitHubClientId: string | undefined = import.meta.env.VITE_GITHUB_CLIENT_ID;

    if (!user.providers.includes(provider)) {
        if (provider === "GOOGLE" && googleClientId) {
            return <LinkGoogle clientId={googleClientId} name={name} hasPassword={user.hasPassword}/>;
        }
        if (provider === "GITHUB" && gitHubClientId && isGitHubAuthorizationSupported()) {
            return (
                <LinkGitHub clientId={gitHubClientId} name={name} hasPassword={user.hasPassword} gitHubLink={gitHubLink}
                            onDone={onGitHubLinkDone}/>
            );
        }
        return null;
    }
    if (isOnlyMethod) {
        return null;
    }
    return <UnlinkProvider provider={provider} name={name} hasPassword={user.hasPassword}/>;
}

// The ways the user can sign in: their password and each provider account linked to them.
export function SignInMethods({user, gitHubLink, onGitHubLinkDone}: SignInMethodsProps) {
    const {t} = useTranslation("profile");
    const methodCount = user.providers.length + Number(user.hasPassword);
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
                {methods.map(method => {
                    // Said only of a provider, as it explains the missing Unlink button the password never has.
                    const isOnlyMethod = method.provider !== null && method.isSet && methodCount === 1;

                    return (
                        <Stack key={method.name} component="li" direction="row" flexWrap="wrap" alignItems="center"
                               columnGap={1}>
                            {method.icon}
                            <Typography fontWeight={600}>{t(method.name)}</Typography>
                            <MethodStatus method={method} isOnlyMethod={isOnlyMethod}/>
                            {method.provider && (
                                <Box ml="auto">
                                    <ProviderAction user={user} provider={method.provider} name={t(method.name)}
                                                    isOnlyMethod={isOnlyMethod} gitHubLink={gitHubLink}
                                                    onGitHubLinkDone={onGitHubLinkDone}/>
                                </Box>
                            )}
                        </Stack>
                    );
                })}
            </Stack>
        </Panel>
    );
}
