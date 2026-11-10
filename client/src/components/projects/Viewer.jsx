import { useEffect, useState,useRef } from "react";
import { NOTICE_TYPES } from "../notice/NoticeTypes";
import Notice from "../notice/Notice";
import Create from "./Create";
import Manage from "./Manage";
import View from "./View";
import Loading from "../Loading";
import Overlay from "../Overlay";
import Icon from "../Icon";
import plusSrc from "../../assets/plus.svg";
import refreshSrc from "../../assets/refresh.svg";
import "./projects.css";


const Viewer = ({ projects, allProjects, users, membersByProject, loading, error, onRefresh }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [managingId, setManagingId] = useState("");
    const [notice, setNotice] = useState(null);
    const noticeRef = useRef(null);

    useEffect(() => {
        if (!notice) return;
        if (notice.type === NOTICE_TYPES.ALERT) {
            noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            noticeRef.current?.focus();
        }
        const timer = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(timer);
    }, [notice]);


    const total = allProjects.length;
    const managedProject = allProjects.find((project) => project._id === managingId);

    const handleCreated = async (message) => {
        await onRefresh();
        setIsCreating(false);
        setNotice({ type: NOTICE_TYPES.SUCCESS, text: message });
    };

    return (
        <div className="view">
            <div className="panel-head">
                <h2>
                    All Projects
                    {!error && <span className="count">{projects.length === total ? total : `${projects.length} of ${total}`}</span>}
                </h2>
                <div className="panel-actions">
                    <button type="button" className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
                        <Icon src={refreshSrc} />
                        Refresh
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setIsCreating(true)}>
                        <Icon src={plusSrc} />
                        New Project
                    </button>
                </div>
            </div>

            {notice && <Notice ref={noticeRef} type={notice.type}>{notice.text}</Notice>}
            {loading && <Loading />}

            {error && (
                <div className="panel-card">
                    <Notice ref={noticeRef} type={NOTICE_TYPES.ERROR}>{error}</Notice>
                    <button type="button" className="btn btn-secondary" onClick={onRefresh}>Try again</button>
                </div>
            )}

            {!error && total === 0 && (
                <div className="empty">
                    <p>No projects yet.</p>
                    <button type="button" className="btn btn-primary" onClick={() => setIsCreating(true)}>
                        <Icon src={plusSrc} />
                        Create the first one
                    </button>
                </div>
            )}

            {!error && total > 0 && projects.length === 0 && (
                <div className="empty"><p>No projects match your search.</p></div>
            )}

            {!error && projects.length > 0 && (
                <div className="project-grid">
                    {projects.map((project) => (
                        <View key={project._id} project={project} onManage={setManagingId} />
                    ))}
                </div>
            )}

            {isCreating && (
                <Overlay onClose={() => setIsCreating(false)}>
                    <Create users={users} onCreated={handleCreated} />
                </Overlay>
            )}

            {managedProject && (
                <Overlay onClose={() => setManagingId("")}>
                    <Manage
                        project={managedProject}
                        members={membersByProject[managedProject._id] ?? []}
                        users={users}
                        onChanged={onRefresh}
                    />
                </Overlay>
            )}
        </div>
    );
};

export default Viewer;
