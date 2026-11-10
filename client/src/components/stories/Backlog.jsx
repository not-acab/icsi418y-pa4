import { useEffect, useRef, useState } from "react";
import { STORIES_PRIORITY, STORIES_STATUSES } from "../../api";
import { NOTICE_TYPES } from "../notice/NoticeTypes";
import Notice from "../notice/Notice";
import Create from "./Create";
import Edit from "./Edit";
import Delete from "./Delete";
import Story from "./Story";
import Loading from "../Loading";
import Overlay from "../Overlay";
import Icon from "../Icon";
import MultiSelect from "../MultiSelect";
import plusSrc from "../../assets/plus.svg";
import refreshSrc from "../../assets/refresh.svg";
import searchSrc from "../../assets/search.svg";
import filterSrc from "../../assets/filter.svg";
import "../projects/projects.css";
import "./stories.css";

/* High first, then Medium, then Low */
const PRIORITY_ORDER = [STORIES_PRIORITY.HIGH, STORIES_PRIORITY.MEDIUM, STORIES_PRIORITY.LOW];
const ALL_STATUSES = Object.values(STORIES_STATUSES);

const Backlog = ({ project, members, stories, loading, error, onRefresh }) => {
    /* Search / filter */
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
    /* Overlays */
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState("");
    const [deletingId, setDeletingId] = useState("");
    /* Feedback */
    const [notice, setNotice] = useState(null);
    const noticeRef = useRef(null);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    const total = stories.length;
    const editingStory = stories.find((story) => story._id === editingId);
    const deletingStory = stories.find((story) => story._id === deletingId);

    /* Search bar: title, description, priority, status and assigned member */
    const search = query.trim().toLowerCase();
    const visible = stories
        .filter((story) => statusFilter.includes(story.status))
        .filter((story) => !search || [
            story.title, story.description, story.priority, story.status,
            story.assigned_user?.f_name, story.assigned_user?.l_name, story.assigned_user?.username
        ].some((text) => String(text ?? "").toLowerCase().includes(search)))
        /* Highest priority first, newest first within a priority */
        .toSorted((a, b) => {
            const byPriority = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
            if (byPriority !== 0) return byPriority;
            return a._id < b._id ? 1 : a._id > b._id ? -1 : 0;
        });

    /* After create / edit / delete: reload the backlog, close the overlay, tell the user */
    const handleDone = async (message) => {
        await onRefresh();
        setIsCreating(false);
        setEditingId("");
        setDeletingId("");
        setNotice({ type: NOTICE_TYPES.SUCCESS, text: message });
    };

    /* Project could not be found: nothing else to show */
    if (!project) {
        return (
            <div className="panel-card">
                <Notice ref={noticeRef} type={NOTICE_TYPES.ERROR}>{error || "That project does not exist."}</Notice>
            </div>
        );
    }

    return (
        <div className="view">
            <div className="stories-toolbar">
                <label className="stories-search">
                    <Icon src={searchSrc} />
                    <input
                        type="text"
                        placeholder="Search user stories..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </label>
                <MultiSelect
                    label="Status"
                    icon={filterSrc}
                    options={ALL_STATUSES}
                    selected={statusFilter}
                    onChange={setStatusFilter}
                />
            </div>

            <div className="panel-head">
                <h2>
                    {project.name} Backlog
                    {!error && <span className="count">{visible.length === total ? total : `${visible.length} of ${total}`}</span>}
                </h2>
                <div className="panel-actions">
                    <button type="button" className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
                        <Icon src={refreshSrc} />
                        Refresh
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setIsCreating(true)} disabled={Boolean(error)}>
                        <Icon src={plusSrc} />
                        New User Story
                    </button>
                </div>
            </div>

            {notice && <Notice ref={noticeRef} type={notice.type}>{notice.text}</Notice>}
            {loading && <Loading />}

            {error && (
                <div className="panel-card">
                    <Notice type={NOTICE_TYPES.ERROR}>{error}</Notice>
                    <button type="button" className="btn btn-secondary" onClick={onRefresh}>Try again</button>
                </div>
            )}

            {!error && total === 0 && (
                <div className="empty">
                    <p>{project.name} has no user stories yet.</p>
                    <button type="button" className="btn btn-primary" onClick={() => setIsCreating(true)}>
                        <Icon src={plusSrc} />
                        Create the first one
                    </button>
                </div>
            )}

            {!error && total > 0 && visible.length === 0 && (
                <div className="empty"><p>No user stories match your search.</p></div>
            )}

            {!error && visible.length > 0 && (
                <ul className="story-list">
                    {visible.map((story) => (
                        <Story key={story._id} story={story} onEdit={setEditingId} onDelete={setDeletingId} />
                    ))}
                </ul>
            )}

            {isCreating && (
                <Overlay onClose={() => setIsCreating(false)}>
                    <Create
                        project={project}
                        members={members}
                        onCreated={handleDone}
                        onCancel={() => setIsCreating(false)}
                    />
                </Overlay>
            )}

            {editingStory && (
                <Overlay onClose={() => setEditingId("")}>
                    <Edit
                        key={editingStory._id}
                        project={project}
                        story={editingStory}
                        members={members}
                        onSaved={handleDone}
                        onCancel={() => setEditingId("")}
                    />
                </Overlay>
            )}

            {deletingStory && (
                <Overlay onClose={() => setDeletingId("")}>
                    <Delete
                        project={project}
                        story={deletingStory}
                        onDeleted={handleDone}
                        onCancel={() => setDeletingId("")}
                    />
                </Overlay>
            )}
        </div>
    );
};

export default Backlog;
