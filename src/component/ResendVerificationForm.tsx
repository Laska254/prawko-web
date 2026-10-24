import {useRef, useState} from "react";
import {Alert, type AlertColor, Button, Stack, TextField} from "@mui/material";
import {resendVerification} from "../requests.tsx";

type ResendStatus = "idle" | "sending" | "sent" | "error";

const STATUS_ALERTS: Partial<Record<ResendStatus, {severity: AlertColor; message: string}>> = {
    sent: {severity: "success", message: "If an unverified account uses this email, a new link is on its way."},
    error: {severity: "error", message: "Couldn't send a new link. Please try again later."},
};

export function ResendVerificationForm() {
    const emailRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<ResendStatus>("idle");

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        setStatus("sending");
        resendVerification({email: emailRef.current?.value ?? ''})
            .then(() => setStatus("sent"))
            .catch(() => setStatus("error"));
    }

    const alert = STATUS_ALERTS[status];

    return (
        <form onSubmit={onSubmit} style={{width: "100%"}}>
            <Stack spacing={2}>
                {alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
                <TextField
                    label="Email"
                    type="email"
                    inputRef={emailRef}
                    placeholder="Email"
                    required
                    fullWidth
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <Button variant="contained" color="secondary" type="submit" fullWidth size="large"
                        disabled={status === "sending"}>
                    Send new link
                </Button>
            </Stack>
        </form>
    );
}
