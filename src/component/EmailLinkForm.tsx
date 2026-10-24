import {useRef, useState} from "react";
import {Alert, type AlertColor, Button, Stack, TextField} from "@mui/material";

type SendStatus = "idle" | "sending" | "sent" | "error";

interface EmailLinkFormProps {
    submitLabel: string;
    sentMessage: string;
    send: (email: string) => Promise<unknown>;
    defaultEmail?: string;
}

export function EmailLinkForm({submitLabel, sentMessage, send, defaultEmail}: EmailLinkFormProps) {
    const emailRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<SendStatus>("idle");

    const statusAlerts: Partial<Record<SendStatus, {severity: AlertColor; message: string}>> = {
        sent: {severity: "success", message: sentMessage},
        error: {severity: "error", message: "Couldn't send the link. Please try again later."},
    };
    const alert = statusAlerts[status];

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        setStatus("sending");
        send(emailRef.current?.value ?? '')
            .then(() => setStatus("sent"))
            .catch(() => setStatus("error"));
    }

    return (
        <form onSubmit={onSubmit} style={{width: "100%"}}>
            <Stack spacing={2}>
                {alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
                <TextField
                    label="Email"
                    type="email"
                    inputRef={emailRef}
                    defaultValue={defaultEmail}
                    placeholder="Email"
                    required
                    fullWidth
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <Button variant="contained" color="secondary" type="submit" fullWidth size="large"
                        disabled={status === "sending"}>
                    {submitLabel}
                </Button>
            </Stack>
        </form>
    );
}
