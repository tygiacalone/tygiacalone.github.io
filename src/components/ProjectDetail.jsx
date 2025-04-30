const ProjectDetail = ({ project, isActive }) => {
  if (!project) return null;

  return (
    <div
      id={project.id}
      className={`max-w-[60%] pt-18 relative float-right pr-[5%] ${
        isActive ? 'inline-block' : 'hidden'
      }`}
      style={{ display: isActive ? 'inline-block' : 'none' }}
    >
      {project.content}
    </div>
  );
};

export default ProjectDetail;
