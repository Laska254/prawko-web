import {useState} from "react";
import {Box, Stack} from "@mui/material";
import {type FormType, getFormConfig} from "../interface/FormConfig";
import {AuthForm} from "../component/AuthForm.tsx";
import {AuthPagePanel} from "../component/AuthPagePanel.tsx";
import {Logo} from "../component/Logo.tsx";

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");

    return (
        <Box display="grid" gridTemplateColumns={{xs: "1fr", md: "1fr 1fr"}} minHeight="100vh">
            <AuthPagePanel/>
            <Stack alignItems="center" justifyContent="center" spacing={4} px={2} py={6}>
                <Box display={{md: "none"}}>
                    <Logo/>
                </Box>
                <AuthForm form={getFormConfig(active)} setActive={setActive}/>
            </Stack>
        </Box>
    );
}
