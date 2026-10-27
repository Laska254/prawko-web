import {TextField, type TextFieldProps} from "@mui/material";

type FormTextFieldProps = Omit<TextFieldProps, "error" | "helperText"> & {
    errorText?: string;
};

export function FormTextField({errorText, ...props}: FormTextFieldProps) {
    return <TextField fullWidth error={errorText !== undefined} helperText={errorText} {...props}/>;
}
