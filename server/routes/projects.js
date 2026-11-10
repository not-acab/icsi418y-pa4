const express = require("express");
const { ObjectId } = require("mongodb");
const membershipRouter = require("./memberships");
const storiesRouter = require("./stories");
const router = express.Router();

/* All Valid Statuses */
const STATUSES = ["Planning", "Active", "Completed"];

/* Object Id Helper (value) -> ObjectId (valid hex) | null (invalid) */
const toObjectId = (value) => {
    const char24_hex = /^[a-f\d]{24}$/i;
    return typeof value === "string" && char24_hex.test(value) ? new ObjectId(value) : null;
};

/* Connect membership and stories router */
router.use("/:projectId/members", membershipRouter);
router.use("/:projectId/stories", storiesRouter);

 /* /api/projects (POST) -> Create a new project */
router.post("/", async (req, res) => {
    const projects = req.db.collection("projects");
    const users = req.db.collection("users");
    const memberships = req.db.collection("projectmemberships");
    const { name, description, status, project_lead_id } = req.body;

    /* Required fields are missing */
    if (!name?.trim() || !description?.trim() || !status || !project_lead_id) {
        return res.status(400).json({
            message: "All fields are required!"
        });
    }

    /* Validate status */
    if (!STATUSES.includes(status)) {
        return res.status(400).json({
            message: `Status must be one of: ${STATUSES.join(", ")}.`
        });
    }

    try {
        /* Validate project lead */
        const leadId = toObjectId(project_lead_id);
        const lead = leadId && await users.findOne({ _id: leadId });
        if (!lead) {
            return res.status(404).json({
                message: "The selected project lead does not exist."
            });
        }

        /* Creat Project object */
        const project = {
            name: name.trim(),
            description: description.trim(),
            status: status,
            project_lead_id: lead._id
        };
        /* Add it into the db and get _ID */
        const { insertedId: projectId } = await projects.insertOne(project);

        /* Add lead to ProjectMemberships using _ID's */
        try { await memberships.insertOne({ project_id: projectId, user_id: lead._id }); }
        catch (error) {
            /* Delete the half finsihed project if add fails */
            await projects.deleteOne({ _id: projectId });
            console.error(error);
            return res.status(500).json({
                message: "Server error"
            });
        }

        /* POST Success */
        res.status(201).json({
            message: `"${project.name}" was created successfully!`,
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

/* /api/projects (GET) -> Get all projects (each includes its project lead) */
router.get("/", async (req, res) => {
    const projects = req.db.collection("projects");

    try {
        /* Database aggregate pipleine (nosql query) */
        const allProjects = await projects.aggregate([
            /* Sort by newest first */
            { $sort: { _id: -1 } },
            /* join with users collection (lead user data) */
            { $lookup: {
                from: "users",
                localField: "project_lead_id",
                foreignField: "_id",
                as: "lead"
            }},
            /* Unpack as "lead" array */
            { $unwind: { path: "$lead", preserveNullAndEmptyArrays: true } },
            /* Remove password from lead */
            { $unset: "lead.password" }
        ]).toArray();

        /* GET Success */
        res.status(200).json({
            data: allProjects,
            message: "Successfully got all projects and project leads"
    });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;
