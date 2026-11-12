import {type ReactNode, useId} from "react";
import {Box, Button, Stack, type Theme, Typography} from "@mui/material";
import {PlayArrow} from "@mui/icons-material";
import {useQuery} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import type {CategoryStatsDto} from "@/api/dto/CategoryStatsDto.tsx";
import type {UserStatsDto} from "@/api/dto/UserStatsDto.tsx";
import {errorMessage, toApiError} from "@/api/errors.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {getCurrentUserStats} from "@/api/users.tsx";
import {PageEmpty} from "@/components/feedback/PageEmpty.tsx";
import {PageError} from "@/components/feedback/PageError.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {Panel} from "@/components/layout/Panel.tsx";
import {useFormat} from "@/i18n/useFormat.tsx";

interface MeterProps {
    readonly label: string;
    readonly value: number;
    readonly max: number;
    readonly valueText: string;
    readonly fill: string;
    readonly track: string;
    readonly height?: number;
    // Drawn over the bar, e.g. the pass mark.
    readonly children?: ReactNode;
}

interface ExamStatsSummaryProps {
    readonly stats: UserStatsDto;
}

interface CategoryCardProps {
    readonly category: CategoryStatsDto;
}

// Points of the theory exam; the server passes an exam from PASS_MARK up (Exam.PASSING_SCORE).
const MAX_SCORE = 74;
const PASS_MARK = 68;

// The theme's own blue and green don't stand out enough on the dark paper, so the bars get their own steps there.
// Checked for colour-blind separation and contrast against each scheme's paper colour.
function chartColors(theme: Theme) {
    return {
        "--stats-pass": "#15803d",
        "--stats-pass-track": "#dcefe2",
        "--stats-score": "#1d4ed8",
        "--stats-score-track": "#e3eafa",
        ...theme.applyStyles("dark", {
            "--stats-pass": "#22a35a",
            "--stats-pass-track": "#1f3d2c",
            "--stats-score": "#4b8ef5",
            "--stats-score-track": "#26344d",
        }),
    };
}

// Scores as the server averages them, to one decimal place; pass rates as whole percentages. Rounding alone would
// show 199 of 200 passed as 100%, so a rate reads 0% only when no exam passed and 100% only when every one did.
function useStatsFormat() {
    const {number} = useFormat();

    function passRate(passed: number, taken: number): string {
        let rate = passed / taken;
        if (passed > 0 && passed < taken) {
            rate = Math.min(Math.max(rate, 0.01), 0.99);
        }
        return number(rate, {style: "percent"});
    }

    return {
        score: (score: number) => number(score, {maximumFractionDigits: 1}),
        passRate,
    };
}

// A value against its maximum: the fill carries the value, the track is a lighter step of the same hue.
function Meter({label, value, max, valueText, fill, track, height = 8, children}: MeterProps) {
    return (
        <Box role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
             aria-valuetext={valueText} position="relative" height={height} borderRadius={`${height}px`}
             bgcolor={track}>
            <Box width={`${value / max * 100}%`} height="100%" borderRadius={`${height}px`} bgcolor={fill}/>
            {children}
        </Box>
    );
}

function PassMark() {
    return (
        <Box position="absolute" left={`${PASS_MARK / MAX_SCORE * 100}%`} top={-3} bottom={-3} width="2px"
             bgcolor="text.primary"/>
    );
}

function CategoryCard({category}: CategoryCardProps) {
    const {t} = useTranslation("profile");
    const format = useStatsFormat();
    const titleId = useId();
    const passRate = format.passRate(category.examsPassed, category.examsTaken);
    const averageScore = format.score(category.averageScore);

    return (
        <Stack component="li" aria-labelledby={titleId} spacing={1.5} border={1} borderColor="divider"
               borderRadius={1} p={2}>
            <Stack direction="row" alignItems="center" gap={1.5}>
                <Box width={40} height={40} borderRadius={1} display="grid" bgcolor="var(--stats-score-track)"
                     fontWeight={700} sx={{placeItems: "center"}} aria-hidden>
                    {category.category}
                </Box>
                <Stack>
                    <Typography id={titleId} component="h3" fontWeight={700}>
                        {t("stats.category", {category: category.category})}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t("stats.categoryCounts", {taken: category.examsTaken, passed: category.examsPassed})}
                    </Typography>
                </Stack>
            </Stack>
            <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{t("stats.passRate")}</Typography>
                    <Typography variant="body2" fontWeight={700}>{passRate}</Typography>
                </Stack>
                <Meter label={t("stats.passRate")} value={category.examsPassed} max={category.examsTaken}
                       valueText={passRate} fill="var(--stats-pass)" track="var(--stats-pass-track)"/>
            </Stack>
            <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{t("stats.averageScore")}</Typography>
                    <Typography variant="body2">
                        <b>{averageScore}</b> · {t("stats.best", {score: category.bestScore})}
                    </Typography>
                </Stack>
                <Meter label={t("stats.averageScore")} value={category.averageScore} max={MAX_SCORE}
                       valueText={averageScore} fill="var(--stats-score)" track="var(--stats-score-track)">
                    <PassMark/>
                </Meter>
            </Stack>
        </Stack>
    );
}

function ExamStatsSummary({stats}: ExamStatsSummaryProps) {
    const {t} = useTranslation("profile");
    const format = useStatsFormat();
    const passRate = format.passRate(stats.examsPassed, stats.examsTaken);
    const passedOf = t("stats.passedOf", {passed: stats.examsPassed, taken: stats.examsTaken});
    // Without finished exams there's nothing to summarise, so the scores aren't null here.
    const scores = [
        {label: "stats.averageScore", value: format.score(stats.averageScore!)},
        {label: "stats.bestScore", value: `${stats.bestScore} / ${MAX_SCORE}`},
    ] as const;

    return (
        <Stack spacing={3}>
            <Stack direction={{xs: "column", sm: "row"}} gap={{xs: 2, sm: 4}} alignItems={{sm: "center"}}>
                <Stack flex={1} spacing={1}>
                    <Stack direction="row" alignItems="baseline" gap={1.5}>
                        <Typography fontSize={48} fontWeight={700} lineHeight={1}>{passRate}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t("stats.passRate")} · {passedOf}
                        </Typography>
                    </Stack>
                    <Meter label={t("stats.passRate")} value={stats.examsPassed} max={stats.examsTaken}
                           valueText={passRate} fill="var(--stats-pass)" track="var(--stats-pass-track)" height={12}/>
                </Stack>
                <Stack component="dl" direction="row" gap={4} m={0}>
                    {scores.map(({label, value}) => (
                        <Stack key={label} spacing={0.5}>
                            <Typography component="dt" variant="body2" color="text.secondary">{t(label)}</Typography>
                            <Typography component="dd" variant="h5" fontWeight={700} m={0}>{value}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
            <Box component="ul" aria-label={t("stats.byCategory")} display="grid" gap={2} m={0} p={0}
                 gridTemplateColumns={{xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)"}}
                 sx={{listStyle: "none"}}>
                {stats.categories.map(category => <CategoryCard key={category.category} category={category}/>)}
            </Box>
            <Stack direction="row" alignItems="center" gap={1}>
                <Box width="2px" height={14} bgcolor="text.primary"/>
                <Typography variant="body2" color="text.secondary">
                    {t("stats.passMark", {passMark: PASS_MARK, max: MAX_SCORE})}
                </Typography>
            </Stack>
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
        <Panel component="section" aria-labelledby={titleId} p={3} spacing={2} sx={chartColors}>
            <Typography id={titleId} variant="h6" component="h2" fontWeight={700}>{t("stats.title")}</Typography>
            {content()}
        </Panel>
    );
}
