import {useState} from "react";
import {Alert, Box, Button, Stack, Typography} from "@mui/material";
import {Logout, Settings} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {Panel} from "@/components/layout/Panel.tsx";
import {useCurrentUser} from "@/session/useCurrentUser.tsx";
import {useSignOut} from "@/session/useSignOut.tsx";
import {ChangeEmail} from "../components/ChangeEmail.tsx";
import {ChangePassword} from "../components/ChangePassword.tsx";
import {DeleteAccount} from "../components/DeleteAccount.tsx";
import {EditProfile} from "../components/EditProfile.tsx";
import {ExamStats} from "../components/ExamStats.tsx";
import {PendingEmailBanner} from "../components/PendingEmailBanner.tsx";
import {SetPassword} from "../components/SetPassword.tsx";
import {SignInMethods} from "../components/SignInMethods.tsx";
import {useProfilePageState} from "../hooks/useProfilePageState.tsx";
import {useRefetchUserOnFocus} from "../hooks/useRefetchUserOnFocus.tsx";

interface AccountField {
    readonly label: ParseKeys<"profile">;
    // `null` when the provider the user signed up with didn't share it.
    readonly value: string | null;
}

interface AccountValueProps {
    readonly value: string | null;
}

function AccountValue({value}: AccountValueProps) {
    const {t} = useTranslation("profile");

    if (value === null) {
        return <Typography component="dd" color="text.secondary">{t("profile.notProvided")}</Typography>;
    }
    return <Typography component="dd" fontWeight={600} sx={{overflowWrap: "anywhere"}}>{value}</Typography>;
}

// What an action did, shown above the profile until closed: the password changed, with the email whose pending change
// it cancelled (`null` without one), or the link to set a password sent to `email`.
type ProfileNotice =
    | {readonly kind: "passwordChanged"; readonly cancelledEmail: string | null}
    | {readonly kind: "passwordLinkSent"; readonly email: string};

interface NoticeAlertProps {
    readonly notice: ProfileNotice;
    readonly onClose: () => void;
}

function NoticeAlert({notice, onClose}: NoticeAlertProps) {
    const {t} = useTranslation("profile");

    function message(): string {
        switch (notice.kind) {
            case "passwordChanged":
                if (notice.cancelledEmail) {
                    return `${t("changePassword.changed")} ${t("changePassword.emailChangeCancelled", {
                        email: notice.cancelledEmail,
                    })}`;
                }
                return t("changePassword.changed");
            case "passwordLinkSent":
                return t("setPassword.sent", {email: notice.email});
        }
    }

    return <Alert severity="success" role="status" onClose={onClose}>{message()}</Alert>;
}

export function ProfilePage() {
    const {t} = useTranslation("profile");
    const user = useCurrentUser();
    // The pending email change follows the links opened in another tab, window or device.
    useRefetchUserOnFocus();
    const {signOut, isSigningOut} = useSignOut();
    // Set when the user comes back from GitHub's page after asking to link it.
    const {gitHubLink, failure, dropGitHubLink} = useProfilePageState();
    const [notice, setNotice] = useState<ProfileNotice | null>(null);
    // Changing a password needs the current one; a user without one sets it through a reset link.
    let passwordAction = (
        <SetPassword user={user} onSent={email => setNotice({kind: "passwordLinkSent", email})}/>
    );
    if (user.hasPassword) {
        passwordAction = (
            <ChangePassword user={user}
                            onChanged={cancelledEmail => setNotice({kind: "passwordChanged", cancelledEmail})}/>
        );
    }
    const fields: readonly AccountField[] = [
        {label: "profile.firstName", value: user.firstName},
        {label: "profile.lastName", value: user.lastName},
        {label: "profile.userName", value: user.userName},
        {label: "profile.email", value: user.email},
    ];

    return (
        <Stack spacing={3}>
            <Typography variant="h4" component="h1" fontWeight={700}>{t("profile.title")}</Typography>
            {failure && <Alert severity="error">{t(failure)}</Alert>}
            {notice && <NoticeAlert notice={notice} onClose={() => setNotice(null)}/>}
            <PendingEmailBanner user={user}/>
            <Panel p={3} spacing={2}>
                <Typography variant="h6" component="h2" fontWeight={700}>{t("profile.account")}</Typography>
                <Box component="dl" display="grid" gridTemplateColumns={{xs: "1fr", sm: "repeat(2, 1fr)"}} gap={2} m={0}>
                    {fields.map(({label, value}) => (
                        <Stack key={label} spacing={0.5}>
                            <Typography component="dt" variant="body2" color="text.secondary">{t(label)}</Typography>
                            <AccountValue value={value}/>
                        </Stack>
                    ))}
                </Box>
            </Panel>
            <SignInMethods user={user} gitHubLink={gitHubLink} onGitHubLinkDone={dropGitHubLink}/>
            <ExamStats/>
            <Panel p={3} spacing={2}>
                <Typography variant="h6" component="h2" fontWeight={700}>{t("profile.actions")}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={2}>
                    <EditProfile user={user}/>
                    <ChangeEmail user={user}/>
                    {passwordAction}
                    <Button component={Link} to="/settings" variant="outlined" startIcon={<Settings/>}>
                        {t("profile.settings")}
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<Logout/>} loading={isSigningOut}
                            loadingPosition="start" onClick={signOut}>
                        {t("profile.signOut")}
                    </Button>
                    {/* Without a password, the account is deleted through an email link, which the server doesn't
                        offer yet (Laska254/prawko-server#190). */}
                    {user.hasPassword && <DeleteAccount/>}
                </Stack>
            </Panel>
        </Stack>
    );
}
