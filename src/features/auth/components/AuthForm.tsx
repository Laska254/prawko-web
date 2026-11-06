import {Alert, type AlertColor, Link, Stack, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import type {AuthFailureMessage} from "../authNotice.tsx";
import type {FormConfig, FormType} from "../formConfig.tsx";
import {AuthCard} from "./AuthCard.tsx";
import {ProviderSignIn} from "./ProviderSignIn.tsx";

// A message shown above the form, e.g. why the user is on the sign in page.
export interface AuthNotice {
    readonly message: AuthFailureMessage;
    readonly severity: AlertColor;
}

interface AuthFormProps {
    form: FormConfig;
    setActive: (active: FormType) => void;
    notice?: AuthNotice;
}

export function AuthForm({form, setActive, notice}: AuthFormProps) {
    const {t} = useTranslation(["auth", "errors"]);

    return (
        <AuthCard>
            {notice && <Alert severity={notice.severity}>{t(notice.message)}</Alert>}
            <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700}>{t(form.title)}</Typography>
                <Typography color="text.secondary">{t(form.subtitle)}</Typography>
            </Stack>
            <ProviderSignIn formType={form.type}/>
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
