import {Stack, type StackProps} from "@mui/material";

export function AuthCard(props: StackProps) {
    return (
        <Stack spacing={4} width="100%" maxWidth={440} p={{xs: 3, sm: 5}}
               border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1}
               {...props}/>
    );
}
