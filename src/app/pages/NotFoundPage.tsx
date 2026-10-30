import {Button, Stack, Typography} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {Logo} from "@/components/Logo.tsx";
import {Panel} from "@/components/layout/Panel.tsx";
import {LanguageSwitch} from "@/components/LanguageSwitch.tsx";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch.tsx";
import type {SessionState} from "@/session/session.tsx";
import {useSession} from "@/session/useSession.tsx";

// Like `RequireGuest`, a user still loading (or failed to load) goes home, where `RequireAuth` shows that.
function backLink({status}: SessionState): {readonly to: string; readonly label: ParseKeys<"app">} {
    if (status === "signedOut") {
        return {to: "/auth", label: "notFound.backToSignIn"};
    }
    return {to: "/", label: "notFound.backToHome"};
}

// Shown for every unknown path, signed in or not, so it has its own frame instead of a layout.
export function NotFoundPage() {
    const {to, label} = backLink(useSession());
    const {t} = useTranslation("app");

    return (
        <Stack component="main" position="relative" alignItems="center" justifyContent="center" spacing={4}
               minHeight="100vh" px={2} py={6}>
            <Stack direction="row" position="absolute" top={8} right={8}>
                <LanguageSwitch/>
                <ThemeModeSwitch/>
            </Stack>
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
