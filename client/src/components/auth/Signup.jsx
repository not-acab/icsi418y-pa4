import { useState, useRef, useEffect } from "react";
import { request } from "../../api";
import { NOTICE_TYPES } from "../notice/NoticeTypes";
import Notice from "../notice/Notice";
import "../forms.css";

const Signup = ({ activeCard, setActiveCard, getMessage, sendMessage }) => {
    /* Fields */
    const [username, setUsername] = useState("");
    const [firstname, setFirstName] = useState("");
    const [lastname, setLastName] = useState("");
    const [password, setPassword] = useState("");
    /* Field errors: { field: "hint text" } - a field with an entry is styled as an error and shows its hint */
    const [errors, setErrors] = useState({});
    /* Server Notice: { type, text, showLoginLink } or null */
    const [notice, setNotice] = useState(null);
    /* Card switching */
    const [lastActiveCard, setLastActiveCard] = useState(activeCard);
    /* Process messages - thank you 412 */
    const [lastMessage, setLastMessage] = useState(getMessage);
    /* Refernce to username input - needed to focus on switch */
    const usernameRef = useRef(null);
    /* Reference to notice element - focus when displayed */
    const noticeRef = useRef(null);
    /* Button toggle */
    const [submitting, setSubmitting] = useState(false);

    /* Remove a field's error styling + hint once the user edits it */
    const clearError = (field) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    /* Clear card when typing in Login */
    if (lastActiveCard !== activeCard) {
        setLastActiveCard(activeCard);
        if (activeCard === "login") {
            setFirstName("");
            setLastName("");
            setUsername("");
            setPassword("");
            setErrors({});
            setNotice(null);
        }
    }

    /* Fill username sent from Login */
    if (getMessage !== lastMessage) {
        setLastMessage(getMessage);
        if (getMessage?.to === "signup") {
            setUsername(getMessage.username);
            setErrors({});
        }
    }

    /* Focus the username field after getMessage is updated and rendered */
    useEffect(() => {
        if (getMessage?.to === "signup") {
            usernameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            usernameRef.current?.focus();
        }
    }, [getMessage]);

    /* Bring a new alert into view */
    useEffect(() => {
        if (notice && notice.type === NOTICE_TYPES.ALERT) {
            noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            noticeRef.current?.focus();
        }
    }, [notice]);


    /* Submit form */
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        /* Required fields empty - POST request still sent as per pa2 requirements */
        const user = {
            username: username.toLowerCase().trim(),
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            password: password.trim()
        };
        setErrors({
            username: user.username ? "" : "Username is required",
            firstname: user.firstname ? "" : "First name is required",
            lastname: user.lastname ? "" : "Last name is required",
            password: user.password ? "" : "Password is required"
        });
        setNotice(null);

        /* POST Request */
        setSubmitting(true);
        const response = await request("/users", {
            method: "POST",
            body: user
        }, () => {
            setNotice({ type: NOTICE_TYPES.ERROR, text: "Could not connect to server" });
        });
        setSubmitting(false);
        if (!response) return;

        /* POST Response - always clear password */
        const { ok, data } = response;
        const message = data.message ?? "";
        setPassword("");

        if (ok) {
            /* Success stylings - clear inputs for extra user feedback */
            setNotice({ type: NOTICE_TYPES.SUCCESS, text: message });
            setUsername("");
            setFirstName("");
            setLastName("");
            setErrors({});
        } else if (message.toLowerCase().includes("exists")) {
            /* User already exists - flag the username, keep the rest of what they typed */
            setNotice({ type: NOTICE_TYPES.ALERT, text: message, showLoginLink: true });
            setErrors((prev) => ({ ...prev, username: "That username is taken" }));
        /* Regular Error (field missing - the hints already point at the empty fields) */
        } else setNotice({ type: NOTICE_TYPES.ERROR, text: message });
    };

    /* JSX */
    return (
        <div className="card">
            <h2>Sign Up
                <span className="subtitle">-If it's your first time here</span>
            </h2>
            <form onSubmit={handleSubmit} onFocus={() => setActiveCard("signup")} noValidate>
                <div className="field">
                    <label htmlFor="signup-username">Username</label>
                    <input
                        ref={usernameRef}
                        id="signup-username"
                        type="text"
                        autoComplete="username"
                        className={`control ${errors.username ? "error" : ""}`}
                        placeholder="Username"
                        value={username}
                        onChange={(event) => { setUsername(event.target.value); clearError("username"); }}
                    />
                    {errors.username && <span className="field-hint">{errors.username}</span>}
                </div>

                <div className="field">
                    <label htmlFor="signup-firstname">First Name</label>
                    <input
                        id="signup-firstname"
                        type="text"
                        autoComplete="given-name"
                        className={`control ${errors.firstname ? "error" : ""}`}
                        placeholder="First Name"
                        value={firstname}
                        onChange={(event) => { setFirstName(event.target.value); clearError("firstname"); }}
                    />
                    {errors.firstname && <span className="field-hint">{errors.firstname}</span>}
                </div>

                <div className="field">
                    <label htmlFor="signup-lastname">Last Name</label>
                    <input
                        id="signup-lastname"
                        type="text"
                        autoComplete="family-name"
                        className={`control ${errors.lastname ? "error" : ""}`}
                        placeholder="Last Name"
                        value={lastname}
                        onChange={(event) => { setLastName(event.target.value); clearError("lastname"); }}
                    />
                    {errors.lastname && <span className="field-hint">{errors.lastname}</span>}
                </div>

                <div className="field">
                    <label htmlFor="signup-password">Password</label>
                    <input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        className={`control ${errors.password ? "error" : ""}`}
                        placeholder="Password"
                        value={password}
                        onChange={(event) => { setPassword(event.target.value); clearError("password"); }}
                    />
                    {errors.password && <span className="field-hint">{errors.password}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                    {submitting ? "Signing up..." : "Sign Up"}
                </button>
            </form>
            {/* Overwrites notice with a hyperlink to Login */}
            {notice && (
                <Notice ref={noticeRef} type={notice.type}>
                    {notice.showLoginLink ? (
                        <>That user already exists.{" "}
                            <a href="#login"
                                className={NOTICE_TYPES.LINK}
                                onClick={(event) => {
                                    event.preventDefault();
                                    sendMessage({ to: "login", username });
                                }}
                            >Did you mean to Login?
                            </a>
                        </>
                    ) : notice.text}
                </Notice>
            )}
        </div>
    );
};

export default Signup;