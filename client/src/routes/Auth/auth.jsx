import { useState } from "react";
import { Navigate, useOutletContext } from "react-router";
import Signup from "../../components/auth/Signup";
import Login from "../../components/auth/Login";
import "./Auth.css";

const Auth = () => {
    const { isLoggedIn, onLogin } = useOutletContext();
    /* Which card has foucs */
    const [activeCard, setActiveCard] = useState("");
    /* { to: "signup" | "login", username }: hand username to other card:  */
    const [message, setMessage] = useState(null);

    /* Logged in users go straight to their projects */
    if (isLoggedIn) return <Navigate to="/projects" replace />;

    /* JSX */
    return (
        <div className="auth">
            <Login
                activeCard={activeCard}
                setActiveCard={setActiveCard}
                getMessage={message}
                sendMessage={setMessage}
                onLogin={onLogin}
            />
            <span className="auth-divider">-or-</span>
            <Signup
                activeCard={activeCard}
                setActiveCard={setActiveCard}
                getMessage={message}
                sendMessage={setMessage}
            />
        </div>
    );
};

export default Auth;
