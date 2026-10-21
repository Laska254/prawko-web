import {useState} from "react";
import {type FormType, getFormConfig} from "../interface/FormConfig";
import {AuthForm} from "../component/AuthForm.tsx";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");

    return (
        <AuthPageLayout>
            <AuthForm form={getFormConfig(active)} setActive={setActive}/>
        </AuthPageLayout>
    );
}
