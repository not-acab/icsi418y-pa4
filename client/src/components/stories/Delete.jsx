import { useState } from "react";
import { request } from "../../api";
import { NOTICE_TYPES } from "../notice/NoticeTypes";
import Notice from "../notice/Notice";
import Icon from "../Icon";
import trashSrc from "../../assets/trash.svg";
import "../forms.css";
import "./stories.css";

/* Overlay confirm dialog: delete a story. Cancel closes without changing anything. */
const Delete = ({ project, story, onDeleted, onCancel }) => {
    const [notice, setNotice] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleDelete = async () => {
        if (submitting) return;
        setNotice(null);
        setSubmitting(true);
        const response = await request(`/projects/${project._id}/stories/${story._id}`, {
            method: "DELETE"
        }, () => {
            setNotice({ type: NOTICE_TYPES.ERROR, text: "Could not connect to the server" });
        });
        setSubmitting(false);
        if (!response) return;

        const { ok, data } = response;
        if (ok) onDeleted(data.message);
        else setNotice({ type: NOTICE_TYPES.ERROR, text: data.message });
    };

    return (
        <div className="panel-card form-card confirm-card" role="alertdialog" aria-labelledby="delete-heading">
            <span className="confirm-icon"><Icon src={trashSrc} /></span>
            <h2 id="delete-heading">Delete this user story?</h2>
            <p className="panel-sub confirm-text">
                <strong>{story.title}</strong> will be permanently removed from the backlog of {project.name}.
                This cannot be undone.
            </p>
            <div className="story-form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
                    Cancel
                </button>
                <button type="button" className="btn btn-delete" onClick={handleDelete} disabled={submitting}>
                    <Icon src={trashSrc} />
                    {submitting ? "Deleting..." : "Delete"}
                </button>
            </div>
            {notice && <Notice type={notice.type}>{notice.text}</Notice>}
        </div>
    );
};

export default Delete;
