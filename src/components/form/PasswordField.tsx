import {type ComponentProps, useState} from "react";
import {IconButton, InputAdornment, type SvgIcon, type TextFieldProps} from "@mui/material";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {FormTextField} from "./FormTextField.tsx";

type PasswordVisibility = "hidden" | "shown";

interface VisibilityConfig {
    readonly type: string;
    readonly toggleLabel: ParseKeys;
    readonly Icon: typeof SvgIcon;
    readonly next: PasswordVisibility;
}

const VISIBILITY_CONFIGS: Record<PasswordVisibility, VisibilityConfig> = {
    hidden: {type: "password", toggleLabel: "password.show", Icon: VisibilityOff, next: "shown"},
    shown: {type: "text", toggleLabel: "password.hide", Icon: Visibility, next: "hidden"},
};

type PasswordFieldProps = Omit<ComponentProps<typeof FormTextField>, "type" | "slotProps"> & {
    slotProps?: Omit<NonNullable<TextFieldProps["slotProps"]>, "input">;
};

export function PasswordField({slotProps, ...props}: PasswordFieldProps) {
    const [visibility, setVisibility] = useState<PasswordVisibility>("hidden");
    const {t} = useTranslation();
    const {type, toggleLabel, Icon, next} = VISIBILITY_CONFIGS[visibility];

    return (
        <FormTextField
            type={type}
            slotProps={{
                ...slotProps,
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton aria-label={t(toggleLabel)} onClick={() => setVisibility(next)}>
                                <Icon/>
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
            {...props}
        />
    );
}
