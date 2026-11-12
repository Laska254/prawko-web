import {Alert, AlertTitle, Stack, Typography} from "@mui/material";
import {CheckCircle, RadioButtonUnchecked} from "@mui/icons-material";
import {Trans, useTranslation} from "react-i18next";
import type {UserDto} from "@/api/dto/UserDto.tsx";

interface PendingEmailBannerProps {
    readonly user: UserDto;
}

interface EmailLinkProps {
    readonly email: string;
    readonly isOpened: boolean;
}

// One of the two links the change waits for; the icon only repeats what the text says.
function EmailLink({email, isOpened}: EmailLinkProps) {
    const {t} = useTranslation("profile");

    function status() {
        if (isOpened) {
            return (
                <>
                    <CheckCircle color="success" fontSize="small" aria-hidden/>
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                        {t("pendingEmail.opened")}
                    </Typography>
                </>
            );
        }
        return (
            <>
                <RadioButtonUnchecked color="action" fontSize="small" aria-hidden/>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {t("pendingEmail.notOpened")}
                </Typography>
            </>
        );
    }

    // `<email/>` is self-closing, so the address stays a React child and isn't parsed as markup.
    return (
        <Stack component="li" direction="row" flexWrap="wrap" alignItems="center" columnGap={1}>
            <Typography variant="body2" sx={{overflowWrap: "anywhere"}}>
                <Trans t={t} i18nKey="pendingEmail.linkSentTo" components={{email: <b>{email}</b>}}/>
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>{status()}</Stack>
        </Stack>
    );
}

// An email change in progress: it completes once the links sent to the new and the current address are both opened.
// A standing status rather than an error, so `role="status"` keeps screen readers from interrupting on each visit.
export function PendingEmailBanner({user}: PendingEmailBannerProps) {
    const {t} = useTranslation("profile");

    if (user.pendingEmail === null) {
        return null;
    }
    return (
        <Alert severity="info" role="status">
            <AlertTitle>{t("pendingEmail.title")}</AlertTitle>
            <Stack spacing={1}>
                <Typography variant="body2" sx={{overflowWrap: "anywhere"}}>
                    <Trans t={t} i18nKey="pendingEmail.text" components={{email: <b>{user.pendingEmail}</b>}}/>
                </Typography>
                <Stack component="ul" spacing={0.5} m={0} p={0} sx={{listStyle: "none"}}>
                    <EmailLink email={user.pendingEmail} isOpened={!user.awaitingNewEmailConfirmation}/>
                    <EmailLink email={user.email} isOpened={!user.awaitingCurrentEmailConfirmation}/>
                </Stack>
            </Stack>
        </Alert>
    );
}
