import type {ReactNode} from "react";
import {Stack, Typography} from "@mui/material";
import {CheckCircle, GitHub, Google, Password, RadioButtonUnchecked} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {Panel} from "@/components/layout/Panel.tsx";

interface SignInMethodsProps {
    readonly user: UserDto;
}

interface SignInMethod {
    readonly name: ParseKeys<"profile">;
    readonly icon: ReactNode;
    readonly isSet: boolean;
    // The status shown when the method is set, and when it isn't.
    readonly setLabel: ParseKeys<"profile">;
    readonly unsetLabel: ParseKeys<"profile">;
}

interface MethodStatusProps {
    readonly method: SignInMethod;
}

// The icon only repeats what the text says.
function MethodStatus({method}: MethodStatusProps) {
    const {t} = useTranslation("profile");

    if (method.isSet) {
        return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <CheckCircle color="success" fontSize="small" aria-hidden/>
                <Typography variant="body2" color="success.main" fontWeight={600}>{t(method.setLabel)}</Typography>
            </Stack>
        );
    }
    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <RadioButtonUnchecked color="action" fontSize="small" aria-hidden/>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>{t(method.unsetLabel)}</Typography>
        </Stack>
    );
}

// The ways the user can sign in: their password and each provider account linked to them.
export function SignInMethods({user}: SignInMethodsProps) {
    const {t} = useTranslation("profile");
    const methods: readonly SignInMethod[] = [
        {
            name: "signInMethods.password",
            icon: <Password color="action" aria-hidden/>,
            isSet: user.hasPassword,
            setLabel: "signInMethods.passwordSet",
            unsetLabel: "signInMethods.passwordNotSet",
        },
        {
            name: "signInMethods.google",
            icon: <Google color="action" aria-hidden/>,
            isSet: user.providers.includes("GOOGLE"),
            setLabel: "signInMethods.linked",
            unsetLabel: "signInMethods.notLinked",
        },
        {
            name: "signInMethods.gitHub",
            icon: <GitHub color="action" aria-hidden/>,
            isSet: user.providers.includes("GITHUB"),
            setLabel: "signInMethods.linked",
            unsetLabel: "signInMethods.notLinked",
        },
    ];

    return (
        <Panel p={3} spacing={2}>
            <Typography variant="h6" component="h2" fontWeight={700}>{t("signInMethods.title")}</Typography>
            <Stack component="ul" spacing={1.5} m={0} p={0} sx={{listStyle: "none"}}>
                {methods.map(method => (
                    <Stack key={method.name} component="li" direction="row" flexWrap="wrap" alignItems="center"
                           columnGap={1}>
                        {method.icon}
                        <Typography fontWeight={600}>{t(method.name)}</Typography>
                        <MethodStatus method={method}/>
                    </Stack>
                ))}
            </Stack>
        </Panel>
    );
}
