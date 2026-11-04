import {useState} from "react";
import {CircularProgress, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip} from "@mui/material";
import {AccountCircle, Logout} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {useSession} from "@/session/useSession.tsx";

export function UserMenu() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => setAnchor(null);
    const {t} = useTranslation("app");
    const {signOut} = useSession();
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Signing out first waits for a refresh in flight, in this tab or another, for up to a request's timeout. Until
    // then the item shows it's busy and takes no more clicks.
    function onSignOut(): void {
        setIsSigningOut(true);
        void signOut().finally(() => setIsSigningOut(false));
    }

    function signOutIcon() {
        if (isSigningOut) {
            return <CircularProgress size={20}/>;
        }
        return <Logout fontSize="small"/>;
    }

    return (
        <>
            <Tooltip title={t("userMenu.label")}>
                <IconButton color="inherit" aria-haspopup="menu" aria-expanded={anchor !== null}
                            onClick={event => setAnchor(event.currentTarget)}>
                    <AccountCircle/>
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={anchor !== null} onClose={close}
                  anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                  transformOrigin={{vertical: "top", horizontal: "right"}}>
                <MenuItem component={Link} to="/profile" onClick={close}>{t("userMenu.profile")}</MenuItem>
                <MenuItem component={Link} to="/settings" onClick={close}>{t("userMenu.settings")}</MenuItem>
                <Divider/>
                {/* `RequireAuth` then replaces the page with /auth, so back doesn't return to it. */}
                <MenuItem onClick={onSignOut} disabled={isSigningOut}>
                    <ListItemIcon>{signOutIcon()}</ListItemIcon>
                    {t("userMenu.signOut")}
                </MenuItem>
            </Menu>
        </>
    );
}
