import {useState} from "react";
import {useLocation} from "react-router";
import {FORM_CONFIGS, type FormType} from "../interface/FormConfig.tsx";
import {AuthForm} from "../component/AuthForm.tsx";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";

const VERIFIED_NOTICE = "Your email is verified. You can sign in now.";

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");
    const isVerified = useLocation().state?.isVerified === true;
    const notice = isVerified && active === "login" ? VERIFIED_NOTICE : undefined;

    return (
        <AuthPageLayout>
            <AuthForm form={FORM_CONFIGS[active]} setActive={setActive} notice={notice}/>
        </AuthPageLayout>
    );
}
