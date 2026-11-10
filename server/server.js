require("dotenv").config();

/*
 *
 * API Structure for the front end to talk to the backend.
 *
 *
 * /api/users (POST) -> Create a new user (signup)
 * /api/users (GET) -> Get all registered users
 * /api/users/login (POST) {username, password} -> Login
 *
 * /api/projects (POST) {name, description, status, project_lead_id} -> Create a new project
 * /api/projects (GET) -> Get all projects (each includes its project lead)
 *
 * /api/projects/:projectId/members (GET) -> Get all members of a project
 * /api/projects/:projectId/members (POST) {user_id} -> Add a member to a project
 * /api/projects/:projectId/members/:userId (DELETE) -> Remove a member from a project (rejected if they still have stories there)
 *
 * /api/projects/:projectId/stories (GET) -> Get the backlog (all user stories) of a project
 * /api/projects/:projectId/stories (POST) {title, description, priority, assigned_user_id} -> Add a story (status starts as "To Do")
 * /api/projects/:projectId/stories/:storyId (PUT) {title, description, priority, status, assigned_user_id} -> Edit a story
 * /api/projects/:projectId/stories/:storyId (DELETE) -> Delete a story
 *
 *
 * Collections: users, projects, projectmemberships, userstories
 *
 */

const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
const usersRouter = require("./routes/users");
const projectsRouter = require("./routes/projects");

const app = express();

app.use(express.json());
app.use(cors());

/* Health Check Request */
app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

/* Start Server */
const connectDatabase = async() => {
    /* Connect to db */
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        console.log("Connected to MongoDB");

    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
        process.exit(1)
    }

    /* Access db */
    const db = client.db("pa2");

    /* Inject db into routes */
    app.use((req, res, next) => {
        req.db = db;
        next();
    });

    /* Connect to the routers */
    app.use("/api/users", usersRouter);
    app.use("/api/projects", projectsRouter);

    /* Only listen after a succesful connection */
    app.listen(9000, () => {
        console.log("Server running on port 9000");
    });
}

connectDatabase();
