import StoryForm from "./StoryForm";

/* Overlay form: add a new story to the project */
const Create = ({ project, members, onCreated, onCancel }) => (
    <StoryForm
        heading="Create a User Story"
        subheading={`Added to the backlog of ${project.name} with the status To Do.`}
        submitLabel="Create User Story"
        busyLabel="Creating..."
        projectId={project._id}
        members={members}
        onSaved={onCreated}
        onCancel={onCancel}
    />
);

export default Create;
