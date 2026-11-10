import { useState } from "react";
import { request, STORIES_PRIORITY, STORIES_STATUSES } from "../../api";
import { NOTICE_TYPES } from "../notice/NoticeTypes";
import Notice from "../notice/Notice";
import "../forms.css";
import "../projects/projects.css";
import "./stories.css";

/* Readable name of a user object, or "Unassigned" */
const displayName = (user) => {
    if (!user) return "Unassigned";
    const full = `${user.f_name ?? ""} ${user.l_name ?? ""}`.trim();
    return full ? `${full} (@${user.username})` : `@${user.username}`;
};


/* Shared form for Create and Edit.
   story: existing story (Edit) or undefined (Create) - its values are loaded into the fields. */
const StoryForm = ({ heading, subheading, submitLabel, busyLabel, projectId, story, members, onSaved, onCancel }) => {
    const isEdit = Boolean(story);
    /* Fields */
    const [title, setTitle] = useState(story?.title ?? "");
    const [description, setDescription] = useState(story?.description ?? "");
    const [priority, setPriority] = useState(story?.priority ?? STORIES_PRIORITY.MEDIUM);
    const [status, setStatus] = useState(story?.status ?? STORIES_STATUSES.PLANNING);
    const [assignedId, setAssignedId] = useState(story?.assigned_user_id ?? "");
    const [errors, setErrors] = useState({});
    /* Server Notice: { type, text } or null */
    const [notice, setNotice] = useState(null);
    /* Button toggle */
    const [submitting, setSubmitting] = useState(false);

    /* Remove a field's error styling once the user edits it */
    const clearError = (field) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
    };

    /* Submit Form */
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        /* Required fields empty - request still sent so the backend validates */
        const fields = { title: title.trim(), description: description.trim() };
        setErrors({ title: !fields.title, description: !fields.description, priority: !priority });

        const body = { ...fields, priority, assigned_user_id: assignedId || null };
        if (isEdit) body.status = status;

        /* POST (new story) or PUT (existing story) */
        setNotice(null);
        setSubmitting(true);
        const basePath = `/projects/${projectId}/stories`;
        const response = await request(isEdit ? `${basePath}/${story._id}` : basePath, {
            method: isEdit ? "PUT" : "POST",
            body
        }, () => {
            setNotice({ type: NOTICE_TYPES.ERROR, text: "Could not connect to the server" });
        });
        setSubmitting(false);
        if (!response) return;

        /* Success - bubble message to parent. Error - show the server's message */
        const { ok, data } = response;
        if (ok) onSaved(data.message);
        else setNotice({ type: NOTICE_TYPES.ERROR, text: data.message });
    };

    /* JSX */
    return (
        <div className="panel-card form-card">
            <h2>{heading}</h2>
            <p className="panel-sub">{subheading}</p>

            <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                    <label htmlFor="story-title">Title</label>
                    <input
                        id="story-title"
                        type="text"
                        className={`control ${errors.title ? "error" : ""}`}
                        placeholder="e.g. View campus event details"
                        value={title}
                        onChange={(event) => { setTitle(event.target.value); clearError("title"); }}
                    />
                    {errors.title && <span className="field-hint">Title is required</span>}
                </div>

                <div className="field">
                    <label htmlFor="story-description">Description</label>
                    <textarea
                        id="story-description"
                        rows={4}
                        className={`control ${errors.description ? "error" : ""}`}
                        placeholder="As a [type of user], I want [goal], so that [benefit]."
                        value={description}
                        onChange={(event) => { setDescription(event.target.value); clearError("description"); }}
                    />
                    {errors.description && <span className="field-hint">Description is required</span>}
                </div>

                <div className="field-row">
                    <div className="field">
                        <label htmlFor="story-priority">Priority</label>
                        <select
                            id="story-priority"
                            className={`control ${errors.priority ? "error" : ""}`}
                            value={priority}
                            onChange={(event) => { setPriority(event.target.value); clearError("priority"); }}
                        >
                            {Object.values(STORIES_PRIORITY).map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* New stories always start as To Do (set by the backend), so only Edit shows status */}
                    {isEdit && (
                        <div className="field">
                            <label htmlFor="story-status">Status</label>
                            <select
                                id="story-status"
                                className="control"
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                            >
                                {Object.values(STORIES_STATUSES).map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Only members of this project (lead included), plus Unassigned */}
                    {!isEdit && (
                        <div className="field">
                            <label htmlFor="story-assigned">Assigned Member</label>
                            <select
                                id="story-assigned"
                                className="control"
                                value={assignedId}
                                onChange={(event) => setAssignedId(event.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {members.map((member) => (
                                    <option key={member._id} value={member._id}>{displayName(member)}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {isEdit && (
                    <div className="field">
                        <label htmlFor="story-assigned">Assigned Member</label>
                        <select
                            id="story-assigned"
                            className="control"
                            value={assignedId}
                            onChange={(event) => setAssignedId(event.target.value)}
                        >
                            <option value="">Unassigned</option>
                            {members.map((member) => (
                                <option key={member._id} value={member._id}>{displayName(member)}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="story-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? busyLabel : submitLabel}
                    </button>
                </div>
            </form>
            {notice && <Notice type={notice.type}>{notice.text}</Notice>}
        </div>
    );
};

export default StoryForm;
