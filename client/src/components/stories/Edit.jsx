import StoryForm from "./StoryForm";

/* Overlay form: edit an existing story (current values are loaded into the form).
   Cancel closes the overlay without sending anything. */
const Edit = ({ project, story, members, onSaved, onCancel }) => (
    <StoryForm
        heading="Edit User Story"
        subheading={`Changes are saved to the existing story in ${project.name}.`}
        submitLabel="Save Changes"
        busyLabel="Saving..."
        projectId={project._id}
        story={story}
        members={members}
        onSaved={onSaved}
        onCancel={onCancel}
    />
);

export default Edit;
