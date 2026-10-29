import {Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import {useTranslation} from "react-i18next";
import {NavLink} from "react-router";
import {Logo} from "@/components/Logo.tsx";
import {NAV_ITEMS} from "./navItems.tsx";

interface NavDrawerProps {
    readonly open: boolean;
    readonly onClose: () => void;
}

// The app bar's sections on narrow screens; picking one closes the drawer.
export function NavDrawer({open, onClose}: NavDrawerProps) {
    const {t} = useTranslation("app");

    return (
        <Drawer open={open} onClose={onClose}>
            <Box component="nav" aria-label={t("nav.label")} width={260}>
                <Box px={2} py={1.5}>
                    <Logo/>
                </Box>
                <List>
                    {NAV_ITEMS.map(({label, to, icon, end}) => (
                        <ListItemButton key={to} component={NavLink} to={to} end={end} onClick={onClose}
                                        sx={{"&.active": {bgcolor: "action.selected", color: "primary.main"}}}>
                            <ListItemIcon sx={{color: "inherit"}}>{icon}</ListItemIcon>
                            <ListItemText primary={t(label)}/>
                        </ListItemButton>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
}
