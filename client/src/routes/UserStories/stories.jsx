import { Link, Navigate, useLoaderData, useNavigate, useOutletContext, useRevalidator } from "react-router";
import Backlog from "../../components/stories/Backlog";
import "./stories.css";

const UserStories = () => {
    /* Data loader (projectId comes from the url: /backlog/:projectID) */
    const { projects, projectId, members, stories, error } = useLoaderData();
    const revalidator = useRevalidator();
    const navigate = useNavigate();
    /* Navigate to Auth if not logged in */
    const { isLoggedIn } = useOutletContext();
    if (!isLoggedIn) return <Navigate to="/" replace />;

    const project = projects.find((p) => p._id === projectId);

    /* JSX */
    return (
        <div className="stories">
            <nav className="stories-nav">
                <Link to="/projects" className="stories-back">&larr; Projects</Link>
                <select
                    className="stories-project-select"
                    value={project ? projectId : ""}
                    onChange={(event) => navigate(`/backlog/${event.target.value}`)}
                >
                    {/* Only shown when the url points at a project that does not exist */}
                    {!project && <option value="" disabled>Select a project</option>}
                    {projects.map((p) => (
                        <option key={p._id} value={p._id}>{p.name} - {p.status}</option>
                    ))}
                </select>
            </nav>

            {/* switching projects remounts Backlog, which clears search, open details and any open form */}
            <Backlog
                key={projectId}
                project={project}
                members={members}
                stories={stories}
                loading={revalidator.state === "loading"}
                error={error}
                onRefresh={() => revalidator.revalidate()}
            />
        </div>
    );
};

export default UserStories;
