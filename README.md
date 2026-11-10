# Programming Assignment 3: Projects and Project Memberships

**Author:** Angel Cabrera
## Description

Extends the PA2 Signup/Login app with software projects and a many-to-many relationship between users and projects. Logged-in users can create projects (picking a registered user as Project Lead), view all projects, and manage each project's members. Completed projects are greyed out. Backend validates every request and the frontend shows the result.

- **Projects page** loads its data with a React Router `loader` (projects, users, and each project's members) and re-runs it after every change.
- **Create Project** and **Manage Members** open as overlays on top of the project list (close with the X, Esc, or by clicking outside).
- The Project Lead is added as a member automatically and cannot be removed.
- A user cannot be added to the same project twice (checked in the route and enforced by a unique index).

## Tech Stack

- **Frontend:** React + Vite + React Router (data router)
- **Backend:** Express
- **Database:** MongoDB (Atlas)

## Project Structure
```
icsi418y-pa3/
├── client/  React Frontend (Vite)
│ └── src/
│  ├── app/  App (router), Layout
│  ├── routes/  Auth/, Projects/, UserStories/
│  ├── components/  auth/, notice/, projects/, stories/, other components
│  ├── assets/  Logos and icons (.svg)
│  ├── main.jsx
│  └── index.css
└── server/  Express Backend
 ├── server.js
 ├── routes/  users.js, projects.js, memberships.js, stories.js
 └── .env  MongoDB connection string (not committed)
```

## Database
| Collection | Fields |
| --- | --- |
| `users` | `_id`, `f_name`, `l_name`, `username`, `password` |
| `projects` | `_id`, `name`, `description`, `status`, `project_lead_id` (ObjectId -> users) |
| `projectmemberships` | `_id`, `project_id` (ObjectId -> projects), `user_id` (ObjectId -> users) |
| `userstories` | `_id`, `project_id` (ObjectId -> projects), `title`, `description`, `priority`, `status`, `user_id` (ObjectId -> users) |

## API
| Route | Description |
| --- | --- |
| `POST /api/users` | Signup |
| `GET /api/users` | All users (no passwords) |
| `POST /api/users/login` | Login |
| `POST /api/projects` | Create project `{name, description, status, project_lead_id}` |
| `GET /api/projects` | All projects, each with its lead |
| `GET /api/projects/:projectId/members` | Members of a project |
| `POST /api/projects/:projectId/members` | Add member `{user_id}` |
| `DELETE /api/projects/:projectId/members/:userId` | Remove a non-lead member |
| `GET /api/projects/:projectId/stories` | Members of a project |
| `POST /api/projects/:projectId/stories` | Add member `{user_id}` |
| `PUT /api/projects/:projectId/stories/:storyId` | Remove a non-lead member |
| `DELETE /api/projects/:projectId/members/:storyId` | Remove a non-lead member |

## Running the Program
**Prerequisites:** Node.js, npm, and a MongoDB Atlas cluster
1. Clone and install dependencies:
```bash
git clone https://github.com/not-acab/icsi418y-pa3
cd icsi418y-pa3

cd client && npm install
cd ../server && npm install
```
2. Create 'server/.env' with YOUR MongoDB connection string:
```
MONGO_URI = <mongodb+srv://USERNAME:PASSWORD@cluster...>
```
3. Start both the Client and the Server in 2 different terminals:
```bash
# Terminal 1 — backend
cd server
node server.js
# Runs at <http://localhost:9000>
```
```bash
# Terminal 2 — frontend
cd client
npm run dev
# Runs at <http://localhost:5173>
```

## Using the Program
1. **Sign Up** (username, first name, last name, password) — create at least three users — then **Log In**.
2. On **Projects**, click **New Project**, fill out name, description, status and lead, and submit.
3. Click **Manage Members** on a project to see its members, add a registered user, or remove a member. The lead has a **Lead** badge instead of a Remove button.
4. Use the search box, status filter, and Name button to find projects. Completed projects appear greyed out.
5. Click **User Stories** on any project to view the backlog page
6. On **Backlog**, click **New User Story**, fill out name, description, status and lead, and submit.

## Known Issues
- Passwords are compared and stored in plain text
- Usernames are case-sensitive (watch out for auto-capitalize in mobile)
- Login is only remembered by the browser tab (no tokens/sessions), and the API itself is not protected
