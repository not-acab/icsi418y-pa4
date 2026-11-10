import { request } from "../../api";

/* Route loader - runs before page render, and again after every refresh */
export const storiesLoader = async ({ params }) => {
    const projectId = params.projectID;
    const empty = { projects: [], projectId, members: [], stories: [] };

    /* request() resolves null when the server is unreachable, and ok:false on a server error */
    const [projectsRes, membersRes, storiesRes] = await Promise.all([
        request("/projects"),
        request(`/projects/${projectId}/members`),
        request(`/projects/${projectId}/stories`)
    ]);
    if (!projectsRes?.ok) return { ...empty, error: "Could not load projects." };

    const projects = projectsRes.data.data;
    /* Unknown / invalid project id: keep the project list so the user can pick another */
    if (!projects.some((project) => project._id === projectId)) {
        return { ...empty, projects, error: "That project does not exist." };
    }
    if (!membersRes?.ok || !storiesRes?.ok) {
        return { ...empty, projects, error: "Could not load the backlog." };
    }

    return { projects, projectId, members: membersRes.data.data, stories: storiesRes.data.data, error: "" };
};

export default storiesLoader;
