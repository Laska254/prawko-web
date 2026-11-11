import {useState} from "react";
import {Alert, LinearProgress, Stack} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import type {StatusMessages} from "@/api/errors.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {GoogleButton} from "@/components/google/GoogleButton.tsx";
import {useSession} from "@/session/useSession.tsx";
import type {FormType} from "../formConfig.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    401: "messages.googleInvalid",
    403: "messages.googleEmailNotVerified",
    404: "messages.googleNotConfigured",
    409: "messages.googleEmailConflict",
};

interface GoogleSignInProps {
    clientId: string;
    formType: FormType;
    // Told when Google's script can't be loaded, as the parent then leaves this out: the password forms still work.
    setUnavailable: (isUnavailable: boolean) => void;
}

// Signs in with the ID token Google's button hands over.
export function GoogleSignIn({clientId, formType, setUnavailable}: GoogleSignInProps) {
    const [prevFormType, setPrevFormType] = useState(formType);
    const navigate = useNavigate();
    const {signInWithGoogle} = useSession();
    const {submit, isSending, failure, clear} = useFormSubmission(signInWithGoogle, {
        statusMessages: STATUS_MESSAGES,
        onSuccess: () => navigate("/"),
    });
    const {t} = useTranslation(["auth", "errors"]);

    // The error goes away on a form switch, like the form's own. Done while rendering, so the old error is never painted.
    if (formType !== prevFormType) {
        setPrevFormType(formType);
        clear();
    }

    return (
        <Stack spacing={2}>
            {failure && <Alert severity="error">{t(failure.message)}</Alert>}
            {/* A new function each render, so the button sends with this render's session. */}
            <GoogleButton clientId={clientId} onCredential={idToken => submit({idToken})} setUnavailable={setUnavailable}
                          disabled={isSending}/>
            {isSending && <LinearProgress/>}
        </Stack>
    );
}
