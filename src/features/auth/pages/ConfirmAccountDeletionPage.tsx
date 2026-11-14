import {Alert, Button, Link, Stack, Typography} from "@mui/material";
import {DeleteForever} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {confirmAccountDeletion} from "@/api/users.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {isInvalidToken} from "../tokenErrors.tsx";
import {authNoticeState} from "../authNotice.tsx";

interface MessageProps {
    readonly title: string;
    readonly text: string;
}

function Message({title, text}: MessageProps) {
    return (
        <Stack spacing={1}>
            <Typography variant="h4" fontWeight={700}>{title}</Typography>
            <Typography color="text.secondary">{text}</Typography>
        </Stack>
    );
}

// The emailed link's page. It deletes only once the user confirms with the button, so a link preview or prefetch that
// opens it doesn't. Signed in or not, as the link may be opened on another device.
export function ConfirmAccountDeletionPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const {t} = useTranslation(["auth", "errors"]);
    // A session here has ended by now, so `/auth` lets the user in.
    const {submit, isSending, failure} = useFormSubmission(confirmAccountDeletion, {
        onSuccess: () => navigate("/auth", {replace: true, state: authNoticeState("accountDeleted")}),
    });

    function content() {
        // A new link is sent from the profile; signed out, it asks to sign in first.
        if (!token || (failure && isInvalidToken(failure.error))) {
            return (
                <>
                    <Message title={t("confirmDeletion.invalidTitle")} text={t("confirmDeletion.invalidText")}/>
                    <Link component={RouterLink} to="/profile" underline="hover" fontWeight={600} alignSelf="flex-start">
                        {t("confirmDeletion.toProfile")}
                    </Link>
                </>
            );
        }
        return (
            <>
                <Message title={t("confirmDeletion.title")} text={t("confirmDeletion.text")}/>
                {failure && <Alert severity="error">{t(failure.message)}</Alert>}
                <Button variant="contained" color="error" size="large" fullWidth startIcon={<DeleteForever/>}
                        loading={isSending} onClick={() => submit({token})}>
                    {t("confirmDeletion.submit")}
                </Button>
                {/* Home, or sign in for a guest. */}
                <Link component={RouterLink} to="/" underline="hover" fontWeight={600} alignSelf="flex-start">
                    {t("confirmDeletion.keep")}
                </Link>
            </>
        );
    }

    return (
        <AuthPageLayout>
            <AuthCard>
                {content()}
            </AuthCard>
        </AuthPageLayout>
    );
}
