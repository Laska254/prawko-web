import {useState} from "react";
import {CircularProgress, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip} from "@mui/material";
import {AccountCircle, Logout} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {useSignOut} from "@/session/useSignOut.tsx";

export function UserMenu() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => setAnchor(null);
    const {t} = useTranslation(["app", "common"]);
    const {signOut, isSigningOut} = useSignOut();

    function signOutIcon() {
        if (isSigningOut) {
            return <CircularProgress size={20} aria-label={t("common:loading")}/>;
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
                <MenuItem onClick={signOut} disabled={isSigningOut}>
                    <ListItemIcon>{signOutIcon()}</ListItemIcon>
                    {t("userMenu.signOut")}
                </MenuItem>
            </Menu>
        </>
    );
}
