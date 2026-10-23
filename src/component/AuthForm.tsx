import {Link, Stack, Typography} from "@mui/material";
import {type FormConfig, type FormType} from "../interface/FormConfig.tsx";

interface AuthFormProps {
    form: FormConfig;
    setActive: (active: FormType) => void;
}

export function AuthForm({form, setActive}: AuthFormProps) {
    return (
        <Stack spacing={4} width="100%" maxWidth={440} p={{xs: 3, sm: 5}}
               border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1}>
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
        </Stack>
    );
}
