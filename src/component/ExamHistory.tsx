import {
    Box,
    Button,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import {History} from "@mui/icons-material";
import {useNavigate} from "react-router";

const COLUMNS = ["Date", "Category", "Score", "Result"];

export function ExamHistory() {
    const navigate = useNavigate();

    return (
        <Box border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1}>
            <Box px={2} py={2.5}>
                <Typography variant="h6" fontWeight={700}>Exam history</Typography>
                <Typography variant="body2" color="text.secondary">Your past attempts, newest first.</Typography>
            </Box>
            <Divider/>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {COLUMNS.map(column => (
                                <TableCell key={column} sx={{color: "text.secondary", fontWeight: 600}}>
                                    {column}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={COLUMNS.length} sx={{borderBottom: 0}}>
                                <Stack alignItems="center" spacing={1} py={6}>
                                    <History fontSize="large" color="disabled"/>
                                    <Typography fontWeight={600}>No exams yet</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Finished attempts and their scores will show up here.
                                    </Typography>
                                    <Button sx={{mt: 1}} onClick={() => navigate("/exam")}>
                                        Start your first exam
                                    </Button>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
