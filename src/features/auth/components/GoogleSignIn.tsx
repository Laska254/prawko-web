import {useEffect, useRef, useState} from "react";
import {Alert, Box, Divider, LinearProgress, Stack, useColorScheme} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import {type ApiError, errorMessage, type StatusMessages, toApiError} from "@/api/errors.tsx";
import {useSession} from "@/session/useSession.tsx";
import {type GoogleButtonOptions, loadGoogleIdentity, onGoogleCredential} from "../googleIdentity.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    401: "messages.googleInvalid",
    403: "messages.googleEmailNotVerified",
    404: "messages.googleNotConfigured",
    409: "messages.googleEmailConflict",
};

// The widest Google's button gets.
const MAX_BUTTON_WIDTH = 400;

// The height of Google's button, kept free while its script loads so the form below doesn't jump.
const BUTTON_HEIGHT = 40;

function buttonTheme(colorScheme: string | undefined): GoogleButtonOptions["theme"] {
    if (colorScheme === "dark") {
        return "filled_black";
    }
    return "outline";
}

interface GoogleSignInProps {
    clientId: string;
}

// Google's own button, which hands over the ID token. Left out if its script can't be loaded, as the password forms
// still work.
export function GoogleSignIn({clientId}: GoogleSignInProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [isUnavailable, setUnavailable] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();
    const {signInWithGoogle} = useSession();
    const {t, i18n} = useTranslation(["auth", "errors"]);
    const {colorScheme} = useColorScheme();
    const locale = i18n.resolvedLanguage;

    function onCredential(idToken: string): void {
        setError(null);
        setIsSending(true);
        signInWithGoogle({idToken})
            .then(() => navigate('/'))
            .catch(caught => setError(toApiError(caught)))
            .finally(() => setIsSending(false));
    }

    // Without dependencies: listens with this render's `onCredential`, which uses this render's session.
    useEffect(() => onGoogleCredential(onCredential));

    // Google's button is an iframe that doesn't follow the page, so it's rendered again with the new theme or language.
    useEffect(() => {
        const parent = buttonRef.current;
        // The script failed to load and the button is gone: it isn't tried again until the page is opened again.
        if (!parent) {
            return;
        }
        let isCurrent = true;
        loadGoogleIdentity(clientId)
            .then(google => {
                if (isCurrent) {
                    parent.replaceChildren();
                    google.renderButton(parent, {
                        theme: buttonTheme(colorScheme),
                        text: "continue_with",
                        width: Math.min(parent.clientWidth, MAX_BUTTON_WIDTH),
                        locale,
                    });
                }
            })
            .catch(() => setUnavailable(true));
        return () => {
            isCurrent = false;
        };
    }, [clientId, colorScheme, locale]);

    if (isUnavailable) {
        return null;
    }

    return (
        <Stack spacing={2}>
            {error && <Alert severity="error">{t(errorMessage(error, STATUS_MESSAGES))}</Alert>}
            {/* Google's iframe has a light page. On a dark page, a browser paints an opaque white backdrop behind it. */}
            <Box ref={buttonRef} display="flex" justifyContent="center" minHeight={BUTTON_HEIGHT} inert={isSending}
                 sx={{colorScheme: "light"}}/>
            {isSending && <LinearProgress/>}
            <Divider>{t("providers.or")}</Divider>
        </Stack>
    );
}
