import type {ReactNode} from "react";
import {History, Home, Person} from "@mui/icons-material";

interface NavItem {
    readonly label: string;
    readonly to: string;
    readonly icon: ReactNode;
    // Only highlighted on the exact path, so Home isn't active on every page.
    readonly end?: boolean;
}

// Sections shown in the app bar and the drawer.
export const NAV_ITEMS: readonly NavItem[] = [
    {label: "Home", to: "/", icon: <Home/>, end: true},
    {label: "History", to: "/history", icon: <History/>},
    {label: "Profile", to: "/profile", icon: <Person/>},
];
