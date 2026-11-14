import {useState} from "react";
import {Alert, Button, Link, Stack, Typography} from "@mui/material";
import {DeleteForever} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router";
import type {ConfirmAccountDeletionDto} from "@/api/dto/ConfirmAccountDeletionDto.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {confirmAccountDeletion} from "@/api/users.tsx";
import type {SessionState} from "@/session/session.tsx";
import {useSession} from "@/session/useSession.tsx";
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

// `null` signed out, or while the signed-in user loads.
function signedInUserId(session: SessionState): number | null {
    if (session.status === "signedIn") {
        return session.user.id;
    }
    return null;
}

// A new link is sent from the profile, so signed-in users go there; a guest signs in first.
function InvalidLinkNext() {
    const session = useSession();
    const {t} = useTranslation("auth");

    if (session.status === "signedIn") {
        return (
            <Link component={RouterLink} to="/profile" underline="hover" fontWeight={600} alignSelf="flex-start">
                {t("confirmDeletion.toProfile")}
            </Link>
        );
    }
    return (
        <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
            {t("backToSignIn")}
        </Link>
    );
}

// The emailed link's page. It deletes only once the user confirms with the button, so a link preview or prefetch that
// opens it doesn't. Signed in or not, as the link may be opened on another device.
export function ConfirmAccountDeletionPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const session = useSession();
    const {t} = useTranslation(["auth", "errors"]);
    // Another user's account, deleted from this browser while signed in.
    const [otherAccountDeleted, setOtherAccountDeleted] = useState(false);
    const confirm = (dto: ConfirmAccountDeletionDto) => confirmAccountDeletion(dto, signedInUserId(session));
    const {submit, isSending, failure} = useFormSubmission(confirm, {
        onSuccess: otherAccount => {
            if (otherAccount) {
                setOtherAccountDeleted(true);
                return;
            }
            // Signed out, or the session here has ended by now, so `/auth` lets the user in.
            navigate("/auth", {replace: true, state: authNoticeState("accountDeleted")});
        },
    });

    function content() {
        if (otherAccountDeleted) {
            return (
                <>
                    <Message title={t("confirmDeletion.deletedTitle")} text={t("confirmDeletion.deletedText")}/>
                    <Link component={RouterLink} to="/" underline="hover" fontWeight={600} alignSelf="flex-start">
                        {t("confirmDeletion.toHome")}
                    </Link>
                </>
            );
        }
        if (!token || (failure && isInvalidToken(failure.error))) {
            return (
                <>
                    <Message title={t("confirmDeletion.invalidTitle")} text={t("confirmDeletion.invalidText")}/>
                    <InvalidLinkNext/>
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
