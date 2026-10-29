import {useRef, useState} from "react";
import {Alert, type AlertColor, Stack} from "@mui/material";
import {errorMessage, toApiError} from "@/api/errors.tsx";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";

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
    const [errorText, setErrorText] = useState("");

    const statusAlerts: Partial<Record<SendStatus, {severity: AlertColor; message: string}>> = {
        sent: {severity: "success", message: sentMessage},
        error: {severity: "error", message: errorText},
    };
    const alert = statusAlerts[status];

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        setStatus("sending");
        send(emailRef.current!.value)
            .then(() => setStatus("sent"))
            .catch(caught => {
                setErrorText(errorMessage(toApiError(caught)));
                setStatus("error");
            });
    }

    return (
        <form onSubmit={onSubmit} style={{width: "100%"}}>
            <Stack spacing={2}>
                {alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
                <FormTextField
                    label="Email"
                    type="email"
                    inputRef={emailRef}
                    defaultValue={defaultEmail}
                    placeholder="Email"
                    required
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <SubmitButton loading={status === "sending"}>{submitLabel}</SubmitButton>
            </Stack>
        </form>
    );
}
