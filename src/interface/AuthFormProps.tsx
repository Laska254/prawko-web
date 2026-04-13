import type {FormType} from "./FormConfig.tsx";

export interface AuthFormProps {
    active: FormType;
    setActive: (active: FormType) => void;
}