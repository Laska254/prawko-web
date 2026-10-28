import {AuthPage} from "@/features/auth/pages/AuthPage.tsx";
import {BrowserRouter, Route, Routes} from "react-router";
import {HomePage} from "@/features/home/pages/HomePage.tsx";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {RequireGuest} from "@/features/auth/guards/RequireGuest.tsx";
import {ExamPage} from "@/features/exam/pages/ExamPage.tsx";
import {VerifyEmailPage} from "@/features/auth/pages/VerifyEmailPage.tsx";
import {VerificationSentPage} from "@/features/auth/pages/VerificationSentPage.tsx";
import {ForgotPasswordPage} from "@/features/auth/pages/ForgotPasswordPage.tsx";
import {ResetPasswordPage} from "@/features/auth/pages/ResetPasswordPage.tsx";
import {HistoryPage} from "@/features/exam/pages/HistoryPage.tsx";
import {ProfilePage} from "@/features/profile/pages/ProfilePage.tsx";
import {SettingsPage} from "@/features/profile/pages/SettingsPage.tsx";
import {SignedInLayout} from "./layout/SignedInLayout.tsx";
import {NotFoundPage} from "./pages/NotFoundPage.tsx";

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route element={<SignedInLayout/>}>
                        <Route path="/" element={<HomePage/>}/>
                        <Route path="/exam" element={<ExamPage/>}/>
                        <Route path="/history" element={<HistoryPage/>}/>
                        <Route path="/profile" element={<ProfilePage/>}/>
                        <Route path="/settings" element={<SettingsPage/>}/>
                    </Route>
                </Route>
                <Route element={<RequireGuest/>}>
                    <Route path="/auth" element={<AuthPage/>}/>
                </Route>
                <Route path="/auth/verify" element={<VerifyEmailPage/>}/>
                <Route path="/auth/verify/sent" element={<VerificationSentPage/>}/>
                <Route path="/auth/password/forgot" element={<ForgotPasswordPage/>}/>
                <Route path="/auth/password/reset" element={<ResetPasswordPage/>}/>
                <Route path="*" element={<NotFoundPage/>}/>
            </Routes>
        </BrowserRouter>
    )
}
