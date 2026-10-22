import {Box, Button, MenuItem, Stack, TextField, Typography} from "@mui/material";
import {ArrowForward} from "@mui/icons-material";
import {useNavigate} from "react-router";
import {CATEGORY_VARIANTS} from "../interface/CategoryVariant.tsx";

const EXAM_FORMAT = [
    {value: "32", label: "questions"},
    {value: "25 min", label: "time limit"},
    {value: "74", label: "points max"},
    {value: "68", label: "points to pass"},
];

export function NewExamPanel() {
    const navigate = useNavigate();

    return (
        <Box display="grid" gridTemplateColumns={{xs: "1fr", md: "3fr 2fr"}} overflow="hidden"
             border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1}>
            <Stack spacing={3} p={{xs: 3, md: 5}} alignItems="flex-start">
                <Typography variant="overline" color="secondary" fontWeight={700}>New attempt</Typography>
                <Typography variant="h4" fontWeight={700}>Ready for your next exam?</Typography>
                <Typography color="text.secondary">
                    Pick a licence category and take a full practice exam in the official format.
                </Typography>
                <Stack direction={{xs: "column", sm: "row"}} spacing={2} width="100%">
                    <TextField select label="Category" defaultValue="B" sx={{minWidth: 160}}>
                        {CATEGORY_VARIANTS.map(category => (
                            <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                    </TextField>
                    <Button variant="contained" color="secondary" size="large" endIcon={<ArrowForward/>} sx={{px: 4}}
                            onClick={() => navigate("/exam")}>
                        Start new exam
                    </Button>
                </Stack>
            </Stack>
            <Box display="grid" gridTemplateColumns="1fr 1fr" alignContent="center" gap={4} p={{xs: 3, md: 5}}
                 bgcolor="primary.dark" color="common.white">
                {EXAM_FORMAT.map(({value, label}) => (
                    <Box key={label}>
                        <Typography variant="h4" fontWeight={700}>{value}</Typography>
                        <Typography variant="body2" color="grey.300">{label}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
