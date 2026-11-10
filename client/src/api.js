const API = "http://localhost:9000/api";

/* Valid project statuses - each maps to a valid status in Project collection */
export const PROJECT_STATUSES = Object.freeze({
    PLANNING: "Planning",
    ACTIVE: "Active",
    COMPLETED: "Completed"
});
/* Valid user stories statuses - each maps to a valid status in Stories collection */
export const STORIES_STATUSES = Object.freeze({
    PLANNING: "To Do",
    ACTIVE: "In Progress",
    COMPLETED: "Done"
});
/* Valid user stories priorities - each maps to a valid priority in Stories collection */
export const STORIES_PRIORITY = Object.freeze({
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low"
});

/* fetch wrapper: never throws, always resolves { ok, status, data } */
export const request = async (routePath, { method, body } = {}, serverErrorCallback) => {
    try {
        /* Send Request */
        const response = await fetch(`${API}${routePath}`, {
            method: method ?? "GET",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });
        /* Await Response */
        const data = await response.json();
        return { ok: response.ok, status: response.status, data: data };
    }
    catch (error) {
        console.error(error);
        serverErrorCallback?.();
        return null;
    }
};