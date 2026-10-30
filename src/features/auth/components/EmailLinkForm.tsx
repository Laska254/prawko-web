import {useState} from "react";
import {Alert, type AlertColor, Stack} from "@mui/material";
import {useTranslation} from "react-i18next";
import {errorMessage, type GenericMessageKey, toApiError} from "@/api/errors.tsx";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";
import {useCooldown} from "../hooks/useCooldown.tsx";
import {COOLDOWN_MS, emailLinkCooldownKey} from "../emailLinkCooldown.tsx";

type SendStatus = "idle" | "sending" | "sent" | "error";

interface EmailLinkFormProps {
    submitLabel: string;
    sentMessage: string;
    send: (email: string) => Promise<unknown>;
    // Forms sending the same kind of link share it, so their cooldown for an email is the same.
    cooldownKey: string;
    defaultEmail?: string;
}

export function EmailLinkForm({submitLabel, sentMessage, send, cooldownKey, defaultEmail}: EmailLinkFormProps) {
    // The field stays uncontrolled; this follows it, so the countdown shown is the one for the email typed in.
    const [email, setEmail] = useState(defaultEmail ?? "");
    const [status, setStatus] = useState<SendStatus>("idle");
    // Only shown in the `error` status, which always sets it first.
    const [errorKey, setErrorKey] = useState<GenericMessageKey>("errors:unexpected");
    const {secondsLeft, start} = useCooldown(emailLinkCooldownKey(cooldownKey, email), COOLDOWN_MS);
    const {t} = useTranslation(["auth", "errors"]);

    const statusAlerts: Partial<Record<SendStatus, {severity: AlertColor; message: string}>> = {
        sent: {severity: "success", message: sentMessage},
        error: {severity: "error", message: t(errorKey)},
    };
    const alert = statusAlerts[status];

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        setStatus("sending");
        send(email)
            .then(() => {
                start();
                setStatus("sent");
            })
            .catch(caught => {
                const error = toApiError(caught);
                if (error.kind === "http" && error.status === 429) {
                    start();
                }
                setErrorKey(errorMessage(error));
                setStatus("error");
            });
    }

    function buttonLabel(): string {
        if (secondsLeft > 0) {
            return t("emailLink.wait", {seconds: secondsLeft});
        }
        return submitLabel;
    }

    return (
        <form onSubmit={onSubmit} style={{width: "100%"}}>
            <Stack spacing={2}>
                {alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
                <FormTextField
                    label={t("fields.email")}
                    type="email"
                    defaultValue={defaultEmail}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t("fields.email")}
                    required
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <SubmitButton loading={status === "sending"} disabled={secondsLeft > 0}>{buttonLabel()}</SubmitButton>
            </Stack>
        </form>
    );
}
