import {Alert, Link, Stack, Typography} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {FormConfig, FormType} from "../formConfig.tsx";
import {AuthCard} from "./AuthCard.tsx";

interface AuthFormProps {
    form: FormConfig;
    setActive: (active: FormType) => void;
    notice?: ParseKeys<"auth">;
}

export function AuthForm({form, setActive, notice}: AuthFormProps) {
    const {t} = useTranslation("auth");

    return (
        <AuthCard>
            {notice && <Alert severity="success">{t(notice)}</Alert>}
            <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700}>{t(form.title)}</Typography>
                <Typography color="text.secondary">{t(form.subtitle)}</Typography>
            </Stack>
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
