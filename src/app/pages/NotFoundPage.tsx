import {Box, Button, Stack, Typography} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {isAuthenticated} from "@/api/credentials.tsx";
import {Logo} from "@/components/Logo.tsx";
import {Panel} from "@/components/layout/Panel.tsx";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch.tsx";

function backLink(): {to: string; label: ParseKeys<"app">} {
    if (isAuthenticated()) {
        return {to: "/", label: "notFound.backToHome"};
    }
    return {to: "/auth", label: "notFound.backToSignIn"};
}

// Shown for every unknown path, signed in or not, so it has its own frame instead of a layout.
export function NotFoundPage() {
    const {to, label} = backLink();
    const {t} = useTranslation("app");

    return (
        <Stack component="main" position="relative" alignItems="center" justifyContent="center" spacing={4}
               minHeight="100vh" px={2} py={6}>
            <Box position="absolute" top={8} right={8}>
                <ThemeModeSwitch/>
            </Box>
            <Logo/>
            <Panel spacing={3} alignItems="center" textAlign="center" width="100%" maxWidth={440} p={{xs: 3, sm: 5}}>
                <Typography variant="h2" component="p" fontWeight={700} color="primary">404</Typography>
                <Stack spacing={1}>
                    <Typography variant="h4" component="h1" fontWeight={700}>{t("notFound.title")}</Typography>
                    <Typography color="text.secondary">
                        {t("notFound.text")}
                    </Typography>
                </Stack>
                <Button component={Link} to={to} variant="contained">{t(label)}</Button>
            </Panel>
        </Stack>
    );
}
