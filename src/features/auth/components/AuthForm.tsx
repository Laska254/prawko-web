import {Alert, type AlertColor, Link, Stack, Typography} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {FormConfig, FormType} from "../formConfig.tsx";
import {AuthCard} from "./AuthCard.tsx";
import {GoogleSignIn} from "./GoogleSignIn.tsx";

// A message shown above the form, e.g. why the user is on the sign in page.
export interface AuthNotice {
    readonly message: ParseKeys<"auth">;
    readonly severity: AlertColor;
}

interface AuthFormProps {
    form: FormConfig;
    setActive: (active: FormType) => void;
    notice?: AuthNotice;
}

export function AuthForm({form, setActive, notice}: AuthFormProps) {
    const {t} = useTranslation("auth");
    const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    return (
        <AuthCard>
            {notice && <Alert severity={notice.severity}>{t(notice.message)}</Alert>}
            <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700}>{t(form.title)}</Typography>
                <Typography color="text.secondary">{t(form.subtitle)}</Typography>
            </Stack>
            {googleClientId && <GoogleSignIn clientId={googleClientId}/>}
            <form.FormComponent/>
            <Typography color="text.secondary">
                {t(form.switchPrompt)}{" "}
                <Link component="button" type="button" underline="hover" fontWeight={600}
                      onClick={() => setActive(form.switchTo)}>
                    {t(form.switchLabel)}
                </Link>
            </Typography>
        </AuthCard>
    );
}
