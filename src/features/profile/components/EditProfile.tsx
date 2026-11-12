import {type RefObject, useRef, useState} from "react";
import {Alert, Button, Stack} from "@mui/material";
import {Edit} from "@mui/icons-material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {UserUpdateDto} from "@/api/dto/UserUpdateDto.tsx";
import type {StatusMessages} from "@/api/errors.tsx";
import {NAME_LENGTH} from "@/api/fieldLengths.tsx";
import {type FieldMessages, useFormSubmission} from "@/api/useFormSubmission.tsx";
import {updateUser} from "@/api/users.tsx";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";

type EditableField = "firstName" | "lastName" | "userName";

const FIELD_MESSAGES: FieldMessages<EditableField, ParseKeys<"profile">> = {
    firstName: {400: "edit.firstNameLength"},
    lastName: {400: "edit.lastNameLength"},
    userName: {400: "edit.userNameInvalid", 409: "edit.userNameTaken"},
};

// A `409` without a field means the user was changed by another request at the same time.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    409: "edit.changedMeanwhile",
};

interface EditableInput {
    readonly field: EditableField;
    readonly label: ParseKeys<"profile">;
    readonly inputRef: RefObject<HTMLInputElement | null>;
}

// The fields whose typed value differs from the user's; a name the provider didn't share is unchanged while empty.
function changedFields(user: UserDto, inputs: readonly EditableInput[]): UserUpdateDto {
    const changes: Partial<Record<EditableField, string>> = {};
    for (const {field, inputRef} of inputs) {
        const value = inputRef.current!.value;
        if (value !== (user[field] ?? "")) {
            changes[field] = value;
        }
    }
    return changes;
}

interface EditProfileProps {
    readonly user: UserDto;
}

// Edits the names and username in a dialog, sending only the fields changed. The server answers with the updated
// user, which replaces the session's.
export function EditProfile({user}: EditProfileProps) {
    const [isOpen, setOpen] = useState(false);
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, fieldErrors, failure, clear} = useFormSubmission(
        (userUpdateDto: UserUpdateDto) => updateUser(user.id, userUpdateDto),
        {
            fieldMessages: FIELD_MESSAGES,
            statusMessages: STATUS_MESSAGES,
            onSuccess: updated => {
                queryClient.setQueryData(currentUserQuery.queryKey, updated);
                setOpen(false);
            },
        },
    );
    const inputs: readonly EditableInput[] = [
        {field: "firstName", label: "profile.firstName", inputRef: firstNameRef},
        {field: "lastName", label: "profile.lastName", inputRef: lastNameRef},
        {field: "userName", label: "profile.userName", inputRef: userNameRef},
    ];

    // The last attempt's errors stay while the dialog fades out, and are gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    // Nothing changed closes the dialog without a request.
    function save(): void {
        const changes = changedFields(user, inputs);
        if (Object.keys(changes).length === 0) {
            setOpen(false);
            return;
        }
        submit(changes);
    }

    return (
        <>
            <Button variant="outlined" startIcon={<Edit/>} onClick={open}>{t("edit.button")}</Button>
            <ConfirmDialog open={isOpen} title={t("edit.title")} text={t("edit.text")} confirmLabel={t("edit.save")}
                           loading={isSending} onConfirm={save} onCancel={() => setOpen(false)}>
                <Stack spacing={2} mt={2}>
                    {failure && <Alert severity="error">{t(failure.message)}</Alert>}
                    {inputs.map(({field, label, inputRef}) => {
                        const error = fieldErrors[field];
                        return (
                            // A name can't be removed once set, only one never shared can stay empty.
                            <FormTextField key={field} label={t(label)} type="text" inputRef={inputRef}
                                           defaultValue={user[field] ?? ""} required={user[field] !== null}
                                           errorText={error && t(error)} slotProps={{htmlInput: NAME_LENGTH}}/>
                        );
                    })}
                </Stack>
            </ConfirmDialog>
        </>
    );
}
