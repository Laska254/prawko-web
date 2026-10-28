import {Suspense} from "react";
import {BrowserRouter, Route, Routes} from "react-router";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {RequireGuest} from "@/features/auth/guards/RequireGuest.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {SignedInLayout} from "./layout/SignedInLayout.tsx";
import {lazyPage} from "./lazyPage.tsx";

// Signed in
const HomePage = lazyPage(() => import("@/features/home/pages/HomePage.tsx"), "HomePage");
const ExamPage = lazyPage(() => import("@/features/exam/pages/ExamPage.tsx"), "ExamPage");
const HistoryPage = lazyPage(() => import("@/features/exam/pages/HistoryPage.tsx"), "HistoryPage");
const ProfilePage = lazyPage(() => import("@/features/profile/pages/ProfilePage.tsx"), "ProfilePage");
const SettingsPage = lazyPage(() => import("@/features/profile/pages/SettingsPage.tsx"), "SettingsPage");
// Guests
const AuthPage = lazyPage(() => import("@/features/auth/pages/AuthPage.tsx"), "AuthPage");
// Public
const VerifyEmailPage = lazyPage(() => import("@/features/auth/pages/VerifyEmailPage.tsx"), "VerifyEmailPage");
const VerificationSentPage = lazyPage(() => import("@/features/auth/pages/VerificationSentPage.tsx"),
    "VerificationSentPage");
const ForgotPasswordPage = lazyPage(() => import("@/features/auth/pages/ForgotPasswordPage.tsx"),
    "ForgotPasswordPage");
const ResetPasswordPage = lazyPage(() => import("@/features/auth/pages/ResetPasswordPage.tsx"), "ResetPasswordPage");
const NotFoundPage = lazyPage(() => import("./pages/NotFoundPage.tsx"), "NotFoundPage");

export function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoading/>}>
                <Routes>
                    {/* Signed in: guests go to /auth; pages share the app bar layout. */}
                    <Route element={<RequireAuth/>}>
                        <Route element={<SignedInLayout/>}>
                            <Route path="/" element={<HomePage/>}/>
                            <Route path="/exam" element={<ExamPage/>}/>
                            <Route path="/history" element={<HistoryPage/>}/>
                            <Route path="/profile" element={<ProfilePage/>}/>
                            <Route path="/settings" element={<SettingsPage/>}/>
                        </Route>
                    </Route>
                    {/* Guests: signed-in users go home. */}
                    <Route element={<RequireGuest/>}>
                        <Route path="/auth" element={<AuthPage/>}/>
                    </Route>
                    {/* Public: email verification, password recovery and 404, signed in or not. */}
                    <Route path="/auth/verify" element={<VerifyEmailPage/>}/>
                    <Route path="/auth/verify/sent" element={<VerificationSentPage/>}/>
                    <Route path="/auth/password/forgot" element={<ForgotPasswordPage/>}/>
                    <Route path="/auth/password/reset" element={<ResetPasswordPage/>}/>
                    <Route path="*" element={<NotFoundPage/>}/>
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
