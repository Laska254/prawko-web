import {useEffect, useRef, useState} from "react";
import {Alert, Box, LinearProgress, Stack, useColorScheme} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import {type ApiError, errorMessage, type StatusMessages, toApiError} from "@/api/errors.tsx";
import {useSession} from "@/session/useSession.tsx";
import type {FormType} from "../formConfig.tsx";
import {type GoogleButtonOptions, loadGoogleIdentity, onGoogleCredential} from "../googleIdentity.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    401: "messages.googleInvalid",
    403: "messages.googleEmailNotVerified",
    404: "messages.googleNotConfigured",
    409: "messages.googleEmailConflict",
};

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
    formType: FormType;
    // Told when the script can't be loaded, as the parent then leaves this out: the password forms still work, and the
    // script isn't tried again until the page is opened again. A state setter, as a new function renders the button again.
    setUnavailable: (isUnavailable: boolean) => void;
}

// Google's own button, which hands over the ID token.
export function GoogleSignIn({clientId, formType, setUnavailable}: GoogleSignInProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [prevFormType, setPrevFormType] = useState(formType);
    const navigate = useNavigate();
    const {signInWithGoogle} = useSession();
    const {t, i18n} = useTranslation(["auth", "errors"]);
    const {colorScheme} = useColorScheme();
    const locale = i18n.resolvedLanguage;

    // The error goes away on a form switch, like the form's own. Done while rendering, so the old error is never painted.
    if (formType !== prevFormType) {
        setPrevFormType(formType);
        setError(null);
    }

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
        const parent = buttonRef.current!;
        let isCurrent = true;
        loadGoogleIdentity(clientId)
            .then(google => {
                if (isCurrent) {
                    parent.replaceChildren();
                    google.renderButton(parent, {
                        theme: buttonTheme(colorScheme),
                        text: "continue_with",
                        width: parent.clientWidth,
                        locale,
                    });
                }
            })
            .catch(() => setUnavailable(true));
        return () => {
            isCurrent = false;
        };
    }, [clientId, colorScheme, locale, setUnavailable]);

    return (
        <Stack spacing={2}>
            {error && <Alert severity="error">{t(errorMessage(error, STATUS_MESSAGES))}</Alert>}
            {/* Google's iframe has a light page. On a dark page, a browser paints an opaque white backdrop behind it. */}
            <Box ref={buttonRef} display="flex" justifyContent="center" minHeight={BUTTON_HEIGHT} inert={isSending}
                 sx={{colorScheme: "light"}}/>
            {isSending && <LinearProgress/>}
        </Stack>
    );
}
