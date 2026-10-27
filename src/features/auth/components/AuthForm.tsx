import {Alert, Link, Stack, Typography} from "@mui/material";
import type {FormConfig, FormType} from "../formConfig.tsx";
import {AuthCard} from "./AuthCard.tsx";

interface AuthFormProps {
    form: FormConfig;
    setActive: (active: FormType) => void;
    notice?: string;
}

export function AuthForm({form, setActive, notice}: AuthFormProps) {
    return (
        <AuthCard>
            {notice && <Alert severity="success">{notice}</Alert>}
            <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700}>{form.title}</Typography>
                <Typography color="text.secondary">{form.subtitle}</Typography>
            </Stack>
            <form.FormComponent/>
            <Typography color="text.secondary">
                {form.switchPrompt}{" "}
                <Link component="button" type="button" underline="hover" fontWeight={600}
                      onClick={() => setActive(form.switchTo)}>
                    {form.switchLabel}
                </Link>
            </Typography>
        </AuthCard>
    );
}
