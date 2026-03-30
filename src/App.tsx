import './App.css'
import {AuthPage} from "./page/AuthPage.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import {ChangePassword} from "./component/ChangePassword.tsx";
import {HomePage} from "./page/HomePage.tsx";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/auth" element={<AuthPage/>}/>
                <Route path="/change-password" element={<ChangePassword/>}/>
                <Route path="*" element={<Navigate to="/auth" replace/>}/>
            </Routes>
        </BrowserRouter>
    )

}

export default App