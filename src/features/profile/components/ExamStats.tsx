import {useId} from "react";
import {
    Box,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import {PlayArrow} from "@mui/icons-material";
import {useQuery} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import type {UserStatsDto} from "@/api/dto/UserStatsDto.tsx";
import {errorMessage, toApiError} from "@/api/errors.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {getCurrentUserStats} from "@/api/users.tsx";
import {PageEmpty} from "@/components/feedback/PageEmpty.tsx";
import {PageError} from "@/components/feedback/PageError.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {Panel} from "@/components/layout/Panel.tsx";
import {useFormat} from "@/i18n/useFormat.tsx";

interface ExamStatsSummaryProps {
    readonly stats: UserStatsDto;
}

interface Total {
    readonly label: ParseKeys<"profile">;
    readonly value: string;
}

// Scores as the server averages them, to one decimal place; pass rates as whole percentages.
function useStatsFormat() {
    const {number} = useFormat();

    return {
        score: (score: number) => number(score, {maximumFractionDigits: 1}),
        passRate: (passed: number, taken: number) => number(passed / taken, {style: "percent"}),
    };
}

function ExamStatsSummary({stats}: ExamStatsSummaryProps) {
    const {t} = useTranslation("profile");
    const format = useStatsFormat();
    const byCategoryId = useId();
    // Without finished exams there's nothing to summarise, so the scores aren't null here.
    const totals: readonly Total[] = [
        {label: "stats.examsTaken", value: String(stats.examsTaken)},
        {label: "stats.examsPassed", value: String(stats.examsPassed)},
        {label: "stats.passRate", value: format.passRate(stats.examsPassed, stats.examsTaken)},
        {label: "stats.averageScore", value: format.score(stats.averageScore!)},
        {label: "stats.bestScore", value: String(stats.bestScore)},
    ];

    return (
        <Stack spacing={2}>
            <Box component="dl" display="grid" gridTemplateColumns={{xs: "repeat(2, 1fr)", sm: "repeat(5, 1fr)"}}
                 gap={2} m={0}>
                {totals.map(({label, value}) => (
                    <Stack key={label} spacing={0.5}>
                        <Typography component="dt" variant="body2" color="text.secondary">{t(label)}</Typography>
                        <Typography component="dd" variant="h5" fontWeight={700}>{value}</Typography>
                    </Stack>
                ))}
            </Box>
            <Typography id={byCategoryId} variant="subtitle1" component="h3" fontWeight={700}>
                {t("stats.byCategory")}
            </Typography>
            {/* Scrolls sideways on its own on a narrow screen, instead of the whole page. */}
            <TableContainer>
                <Table size="small" aria-labelledby={byCategoryId}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t("stats.category")}</TableCell>
                            <TableCell align="right">{t("stats.examsTaken")}</TableCell>
                            <TableCell align="right">{t("stats.examsPassed")}</TableCell>
                            <TableCell align="right">{t("stats.passRate")}</TableCell>
                            <TableCell align="right">{t("stats.averageScore")}</TableCell>
                            <TableCell align="right">{t("stats.bestScore")}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.categories.map(category => (
                            <TableRow key={category.category}>
                                <TableCell component="th" scope="row">{category.category}</TableCell>
                                <TableCell align="right">{category.examsTaken}</TableCell>
                                <TableCell align="right">{category.examsPassed}</TableCell>
                                <TableCell align="right">
                                    {format.passRate(category.examsPassed, category.examsTaken)}
                                </TableCell>
                                <TableCell align="right">{format.score(category.averageScore)}</TableCell>
                                <TableCell align="right">{category.bestScore}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
}

// The user's finished exams in total and per category. Loads on its own, so the rest of the profile doesn't wait for it,
// and again each time it's shown, as an exam finished since then changes it.
export function ExamStats() {
    const {t} = useTranslation(["profile", "errors"]);
    const titleId = useId();
    const stats = useQuery({queryKey: userKeys.stats(), queryFn: getCurrentUserStats});

    function content() {
        // A failed refetch keeps the stats loaded before, so they come first.
        if (stats.data) {
            if (stats.data.examsTaken === 0) {
                return (
                    <PageEmpty message={t("stats.empty")} action={
                        <Button component={Link} to="/exam" variant="contained" startIcon={<PlayArrow/>}>
                            {t("stats.startExam")}
                        </Button>
                    }/>
                );
            }
            return <ExamStatsSummary stats={stats.data}/>;
        }
        // Trying again keeps the error until the answer comes, so the loading shows while it's fetched.
        if (stats.isError && !stats.isFetching) {
            return <PageError message={t(errorMessage(toApiError(stats.error)))} onRetry={() => stats.refetch()}/>;
        }
        return <PageLoading/>;
    }

    return (
        <Panel component="section" aria-labelledby={titleId} p={3} spacing={2}>
            <Typography id={titleId} variant="h6" component="h2" fontWeight={700}>{t("stats.title")}</Typography>
            {content()}
        </Panel>
    );
}
