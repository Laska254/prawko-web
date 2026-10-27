import type {StackProps} from "@mui/material";
import {Panel} from "@/components/layout/Panel.tsx";

export function AuthCard(props: StackProps) {
    return (
        <Panel spacing={4} width="100%" maxWidth={440} p={{xs: 3, sm: 5}} {...props}/>
    );
}
