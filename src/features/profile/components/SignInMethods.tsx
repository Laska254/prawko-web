import {type ReactNode, useEffect, useRef} from "react";
import {Box, Stack, Typography} from "@mui/material";
import {CheckCircle, GitHub, Google, Password, RadioButtonUnchecked} from "@mui/icons-material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import type {IdentityProvider} from "@/api/dto/IdentityProvider.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {isGitHubAuthorizationSupported} from "@/components/github/gitHubAuthorization.tsx";
import {Panel} from "@/components/layout/Panel.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";
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
    readonly isUnlinkBlocked: boolean;
}

// The icon only repeats what the text says.
function MethodStatus({method, isUnlinkBlocked}: MethodStatusProps) {
    const {t} = useTranslation("profile");

    if (method.isSet) {
        return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <CheckCircle color="success" fontSize="small" aria-hidden/>
                <Typography variant="body2" color="success.main" fontWeight={600}>{t(method.setLabel)}</Typography>
                {isUnlinkBlocked && (
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
    readonly isUnlinkBlocked: boolean;
    readonly gitHubLink: GitHubSignInDto | undefined;
    readonly onGitHubLinkDone: () => void;
    readonly refetchUser: () => Promise<void>;
}

// The only way to sign in can't be unlinked; its status says why. A provider is linked only with its client ID, and
// GitHub only where the browser can start its authorization.
function ProviderAction({user, provider, name, isUnlinkBlocked, gitHubLink, onGitHubLinkDone,
                            refetchUser}: ProviderActionProps) {
    const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const gitHubClientId: string | undefined = import.meta.env.VITE_GITHUB_CLIENT_ID;

    if (!user.providers.includes(provider)) {
        if (provider === "GOOGLE" && googleClientId) {
            return (
                <LinkGoogle clientId={googleClientId} name={name} hasPassword={user.hasPassword}
                            refetchUser={refetchUser}/>
            );
        }
        if (provider === "GITHUB" && gitHubClientId && isGitHubAuthorizationSupported()) {
            return (
                <LinkGitHub clientId={gitHubClientId} name={name} hasPassword={user.hasPassword} gitHubLink={gitHubLink}
                            onDone={onGitHubLinkDone} refetchUser={refetchUser}/>
            );
        }
        return null;
    }
    if (isUnlinkBlocked) {
        return null;
    }
    return <UnlinkProvider provider={provider} name={name} hasPassword={user.hasPassword} refetchUser={refetchUser}/>;
}

// The ways the user can sign in: their password and each provider account linked to them.
export function SignInMethods({user, gitHubLink, onGitHubLinkDone}: SignInMethodsProps) {
    const {t} = useTranslation("profile");
    const queryClient = useQueryClient();
    const headingRef = useRef<HTMLHeadingElement>(null);
    const providers = user.providers.join();
    const shownProviders = useRef(providers);
    // Set when a row's action fetched the user again with other providers, so the swap that comes moves the focus.
    const isSwappedHere = useRef(false);
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

    // Only the user, not the stats under its key. TanStack Query hands the fetched user to the page only after a
    // `setTimeout`, so once this resolves the cache holds it while the providers shown are still the old ones. The user
    // is gone when the session ended meanwhile, which clears the cache.
    async function refetchUser(): Promise<void> {
        await queryClient.invalidateQueries({queryKey: currentUserQuery.queryKey, exact: true});
        const fetched = queryClient.getQueryData(currentUserQuery.queryKey);
        isSwappedHere.current = fetched !== undefined && fetched.providers.join() !== shownProviders.current;
    }

    // Linking or unlinking here swaps the row's action, so its dialog is unmounted along with the button focus would go
    // back to. The focus that fell to the page goes to the heading instead; focus kept elsewhere stays, and a change
    // made in another tab or window leaves it alone.
    useEffect(() => {
        if (shownProviders.current === providers) {
            return;
        }
        shownProviders.current = providers;
        if (isSwappedHere.current && document.activeElement === document.body) {
            headingRef.current?.focus();
        }
        isSwappedHere.current = false;
    }, [providers]);

    return (
        <Panel p={3} spacing={2}>
            <Typography ref={headingRef} variant="h6" component="h2" fontWeight={700} tabIndex={-1}>
                {t("signInMethods.title")}
            </Typography>
            <Stack component="ul" spacing={1.5} m={0} p={0} sx={{listStyle: "none"}}>
                {methods.map(method => {
                    // The only way to sign in, when it's a provider: the password has no Unlink button to block.
                    const isUnlinkBlocked = method.provider !== null && method.isSet && methodCount === 1;

                    return (
                        <Stack key={method.name} component="li" direction="row" flexWrap="wrap" alignItems="center"
                               columnGap={1}>
                            {method.icon}
                            <Typography fontWeight={600}>{t(method.name)}</Typography>
                            <MethodStatus method={method} isUnlinkBlocked={isUnlinkBlocked}/>
                            {method.provider && (
                                <Box ml="auto">
                                    <ProviderAction user={user} provider={method.provider} name={t(method.name)}
                                                    isUnlinkBlocked={isUnlinkBlocked} gitHubLink={gitHubLink}
                                                    onGitHubLinkDone={onGitHubLinkDone} refetchUser={refetchUser}/>
                                </Box>
                            )}
                        </Stack>
                    );
                })}
            </Stack>
        </Panel>
    );
}
