import {useState} from "react";
import {Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip} from "@mui/material";
import {AccountCircle, Logout} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {useSession} from "@/session/useSession.tsx";

export function UserMenu() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => setAnchor(null);
    const {t} = useTranslation("app");
    const {signOut} = useSession();

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
                <MenuItem onClick={() => void signOut()}>
                    <ListItemIcon><Logout fontSize="small"/></ListItemIcon>
                    {t("userMenu.signOut")}
                </MenuItem>
            </Menu>
        </>
    );
}
