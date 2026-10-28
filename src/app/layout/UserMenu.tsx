import {useState} from "react";
import {IconButton, Menu, MenuItem, Tooltip} from "@mui/material";
import {AccountCircle} from "@mui/icons-material";
import {Link} from "react-router";

export function UserMenu() {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => setAnchor(null);

    return (
        <>
            <Tooltip title="Account">
                <IconButton color="inherit" aria-haspopup="menu" onClick={event => setAnchor(event.currentTarget)}>
                    <AccountCircle/>
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={anchor !== null} onClose={close}
                  anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                  transformOrigin={{vertical: "top", horizontal: "right"}}>
                <MenuItem component={Link} to="/profile" onClick={close}>Profile</MenuItem>
                <MenuItem component={Link} to="/settings" onClick={close}>Settings</MenuItem>
            </Menu>
        </>
    );
}
