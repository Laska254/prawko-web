import {useState} from "react";
import {IconButton, Menu, MenuItem, Tooltip} from "@mui/material";
import {AccountCircle} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";

export function UserMenu() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => setAnchor(null);
    const {t} = useTranslation("app");

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
            </Menu>
        </>
    );
}
