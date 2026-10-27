import type {ReactNode} from "react";
import {Typography} from "@mui/material";
import {Inbox} from "@mui/icons-material";
import {PageState} from "./PageState.tsx";

interface PageEmptyProps {
    message: string;
    action?: ReactNode;
}

export function PageEmpty({message, action}: PageEmptyProps) {
    return (
        <PageState>
            <Inbox color="disabled" fontSize="large"/>
            <Typography color="text.secondary">{message}</Typography>
            {action}
        </PageState>
    );
}
