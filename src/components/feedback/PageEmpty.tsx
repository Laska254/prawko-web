import type {ReactNode} from "react";
import {Stack, Typography} from "@mui/material";
import {Inbox} from "@mui/icons-material";

interface PageEmptyProps {
    message: string;
    action?: ReactNode;
}

export function PageEmpty({message, action}: PageEmptyProps) {
    return (
        <Stack alignItems="center" justifyContent="center" spacing={2} py={8} textAlign="center">
            <Inbox color="disabled" fontSize="large"/>
            <Typography color="text.secondary">{message}</Typography>
            {action}
        </Stack>
    );
}
