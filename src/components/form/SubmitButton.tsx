import type {ReactNode} from "react";
import {Button} from "@mui/material";

interface SubmitButtonProps {
    children: ReactNode;
    loading: boolean;
}

// MUI's `loading` disables the button and shows a spinner while the form is sending.
export function SubmitButton({children, loading}: SubmitButtonProps) {
    return (
        <Button variant="contained" color="secondary" type="submit" fullWidth size="large" loading={loading}>
            {children}
        </Button>
    );
}
