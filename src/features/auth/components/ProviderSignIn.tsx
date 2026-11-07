import {useState} from "react";
import {Divider, Stack} from "@mui/material";
import {useTranslation} from "react-i18next";
import type {FormType} from "../formConfig.tsx";
import {isGitHubSignInSupported} from "../gitHubAuthorization.tsx";
import {GitHubSignIn} from "./GitHubSignIn.tsx";
import {GoogleSignIn} from "./GoogleSignIn.tsx";

interface ProviderSignInProps {
    formType: FormType;
}

// Signing in with another account, above the password forms. A provider is left out without its client ID or when it
// can't work here; the divider only shows with a provider above it.
export function ProviderSignIn({formType}: ProviderSignInProps) {
    const [isGoogleUnavailable, setGoogleUnavailable] = useState(false);
    const {t} = useTranslation("auth");
    const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const gitHubClientId: string | undefined = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const showsGoogle = googleClientId && !isGoogleUnavailable;
    const showsGitHub = gitHubClientId && isGitHubSignInSupported();

    if (!showsGoogle && !showsGitHub) {
        return null;
    }

    return (
        <Stack spacing={2}>
            {showsGoogle && (
                <GoogleSignIn clientId={googleClientId} formType={formType} setUnavailable={setGoogleUnavailable}/>
            )}
            {showsGitHub && <GitHubSignIn clientId={gitHubClientId}/>}
            <Divider>{t("providers.or")}</Divider>
        </Stack>
    );
}
