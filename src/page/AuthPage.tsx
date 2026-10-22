import {useState} from "react";
import {FORM_CONFIGS, type FormType} from "../interface/FormConfig";
import {AuthForm} from "../component/AuthForm.tsx";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");

    return (
        <AuthPageLayout>
            <AuthForm form={FORM_CONFIGS[active]} setActive={setActive}/>
        </AuthPageLayout>
    );
}
