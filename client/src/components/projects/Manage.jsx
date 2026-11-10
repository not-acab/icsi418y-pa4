import { useState, useRef, useEffect } from "react";
import { request } from "../../api";
import { NOTICE_TYPES } from "../notice/NoticeTypes";
import Notice from "../notice/Notice";
import Icon from "../Icon";
import plusSrc from "../../assets/plus.svg";
import "../forms.css";
import "./projects.css";


const Manage = ({ project, members, users, onChanged }) => {
    /* The userId to add to project */
    const [newUserId, setNewUserId] = useState("");
    /* Similar to submitting in other components, but adds context */
    /* Disbale all buttons, but only style the button that was pressed */
    const [busy, setBusy] = useState("");
    /* Feedback */
    const [notice, setNotice] = useState(null);
    const noticeRef = useRef(null);

    const memberIds = new Set(members.map((member) => member._id));
    const membersApiPath = `/projects/${project._id}/members`;

    /* Bring a new alert into view (Mobile with alot of users can get really long) */
    useEffect(() => {
        if (notice && notice.type === NOTICE_TYPES.ALERT) {
            noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            noticeRef.current?.focus();
        }
    }, [notice]);

    /* Add a member */
    const handleAdd = async (event) => {
        event.preventDefault();

        /* POST Request - sent even when nothing is selected so the backend validates */
        if (busy !== "") return;
        setNotice(null);
        setBusy("add");
        const response = await request(membersApiPath, {
            method: "POST",
            body: { user_id: newUserId }
        }, () => {
            setNotice({ type: NOTICE_TYPES.ERROR, text: "Could not connect to the server" });
        });
        if (!response) return setBusy("");

        /* POST Response */
        const { ok, status, data } = response;
        if (ok) {
            setNewUserId("");
            await onChanged();
        }
        /* Special Case: User already exists */
        if (status === 409 ) {
            setNotice({ type: NOTICE_TYPES.ALERT,text: data.message });
            setBusy("");
            return;
        }
        /* Default Case: Sucess/Error */
        setNotice({
            type: ok ? NOTICE_TYPES.SUCCESS : NOTICE_TYPES.ERROR,
            text: data.message
        });
        setBusy("");
    };

    /* Remove a member (the lead has no button, and the server refuses too) */
    const handleRemove = async (member) => {

        /* DELETE Request */
        if (busy !== "") return;
        setNotice(null);
        setBusy(member._id);
        const response = await request(`${membersApiPath}/${member._id}`, { 
            method: "DELETE" 
        }, () => {
            setNotice({ type: NOTICE_TYPES.ERROR, text: "Could not connect to the server" });
        });
        if (!response) return setBusy("");

        /* DELETE Response */
        const { ok, data } = response;
        if (ok) await onChanged();
        setNotice({
            type: ok ? NOTICE_TYPES.SUCCESS : NOTICE_TYPES.ERROR,
            text: data.message
        });
        setBusy("");

    };

    return (
        <div className="manage">
            <header className="project-card-head">
                <h2>{project.name}</h2>
                <span className={`status status-${String(project.status).toLowerCase()}`}>{project.status}</span>
            </header>
            {notice && <Notice ref={noticeRef} type={notice.type}>{notice.text}</Notice>}
            <div className="manage-grid">
                <section className="panel-card">
                    <h3>
                        Members
                        <span className="count">{members.length}</span>
                    </h3>
                    {members.length === 0 && (
                        <p className="placeholder">This project has no members.</p>
                    )}
                    <ul className="member-list">
                        {members.map((member) => {
                            const isLead = member._id === project.project_lead_id;
                            return (
                                <li key={member._id} className="member">
                                    <span className="avatar">
                                        {`${member.f_name?.[0] ?? ""}${member.l_name?.[0] ?? ""}`.toUpperCase()}
                                    </span>
                                    <div className="member-info">
                                        <span className="name">
                                            {`${member.f_name} ${member.l_name}`.trim()}
                                        </span>
                                        <span className="handle">
                                            @{member.username}
                                        </span>
                                    </div>
                                    {isLead ? (
                                        <span className="lead-badge">Lead</span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            disabled={busy !== ""}
                                            onClick={() => handleRemove(member)}
                                            title={`Remove ${`${member.f_name} ${member.l_name}`.trim()} from ${project.name}`}
                                        >
                                            {busy === member._id ? "Removing..." : "Remove"}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section className="panel-card">
                    <h3>Add a Member</h3>
                    <form onSubmit={handleAdd} noValidate>
                        <div className="field">
                            <label htmlFor="add-member">Registered user</label>
                            <select
                                id="add-member"
                                className="control"
                                value={newUserId}
                                onChange={(event) => setNewUserId(event.target.value)}
                            >
                                <option value="">Select a user</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {memberIds.has(user._id) ? "Member - " : "Not a member - "}
                                        {user.f_name} {user.l_name} (@{user.username})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={busy !== ""}>
                            <Icon src={plusSrc} />
                            {busy === "add" ? "Adding..." : "Add to Project"}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default Manage;
