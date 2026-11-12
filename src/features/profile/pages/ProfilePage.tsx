import {Alert, Box, Button, Stack, Typography} from "@mui/material";
import {Logout, Settings} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {Panel} from "@/components/layout/Panel.tsx";
import {useCurrentUser} from "@/session/useCurrentUser.tsx";
import {useSignOut} from "@/session/useSignOut.tsx";
import {EditProfile} from "../components/EditProfile.tsx";
import {ExamStats} from "../components/ExamStats.tsx";
import {PendingEmailBanner} from "../components/PendingEmailBanner.tsx";
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

export function ProfilePage() {
    const {t} = useTranslation("profile");
    const user = useCurrentUser();
    // The pending email change follows the links opened in another tab, window or device.
    useRefetchUserOnFocus();
    const {signOut, isSigningOut} = useSignOut();
    // Set when the user comes back from GitHub's page after asking to link it.
    const {gitHubLink, failure, dropGitHubLink} = useProfilePageState();
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
                    <Button component={Link} to="/settings" variant="outlined" startIcon={<Settings/>}>
                        {t("profile.settings")}
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<Logout/>} loading={isSigningOut}
                            loadingPosition="start" onClick={signOut}>
                        {t("profile.signOut")}
                    </Button>
                </Stack>
            </Panel>
        </Stack>
    );
}
