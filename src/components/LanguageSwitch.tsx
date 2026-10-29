import {useState} from "react";
import {IconButton, type IconButtonProps, Menu, MenuItem, Tooltip} from "@mui/material";
import {Translate} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {chooseLanguage, type Language, LANGUAGES} from "@/i18n/i18n.tsx";

interface LanguageSwitchProps {
    // `inherit` on coloured bars such as the app bar.
    readonly color?: IconButtonProps["color"];
}

export function LanguageSwitch({color}: LanguageSwitchProps) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => setAnchor(null);
    const {t, i18n} = useTranslation();

    function choose(language: Language) {
        close();
        void chooseLanguage(language);
    }

    return (
        <>
            <Tooltip title={t("language")}>
                <IconButton color={color} aria-haspopup="menu" aria-expanded={anchor !== null}
                            onClick={event => setAnchor(event.currentTarget)}>
                    <Translate/>
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={anchor !== null} onClose={close}
                  anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                  transformOrigin={{vertical: "top", horizontal: "right"}}>
                {LANGUAGES.map(({code, name}) => {
                    const isCurrent = code === i18n.resolvedLanguage;
                    // Each name is read in its own language.
                    return (
                        <MenuItem key={code} lang={code} role="menuitemradio" aria-checked={isCurrent}
                                  selected={isCurrent} onClick={() => choose(code)}>
                            {name}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}
