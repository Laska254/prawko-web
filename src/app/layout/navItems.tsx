import type {ReactNode} from "react";
import type {ParseKeys} from "i18next";
import {History, Home, Person} from "@mui/icons-material";

interface NavItem {
    readonly label: ParseKeys<"app">;
    readonly to: string;
    readonly icon: ReactNode;
    // Only highlighted on the exact path, so Home isn't active on every page.
    readonly end?: boolean;
}

// Sections shown in the app bar and the drawer.
export const NAV_ITEMS: readonly NavItem[] = [
    {label: "nav.home", to: "/", icon: <Home/>, end: true},
    {label: "nav.history", to: "/history", icon: <History/>},
    {label: "nav.profile", to: "/profile", icon: <Person/>},
];
