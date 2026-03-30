import './App.css'
import {AuthPage} from "./page/AuthPage.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import {ChangePassword} from "./component/ChangePassword.tsx";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/auth" element={<AuthPage/>}/>
                <Route path="*" element={<Navigate to="/auth" replace/>}/>
                <Route path="/change-password" element={<ChangePassword/>}/>
            </Routes>
        </BrowserRouter>
    )

}

export default App