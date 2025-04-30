const ProjectItem = ({ project, isActive, onClick }) => {
  return (
    <div
      id={`${project.id}_logo`}
      className={isActive ? 'opacity-50 !important' : ''}
      onClick={onClick}
    >
      <a href="#" className="hover:bg-white">
        <img
          className="max-h-48 h-auto w-auto pb-16"
          src={project.icon}
          alt={project.title}
          style={
            project.id === 'invaders' ? { height: '400px', width: '400px' } : {}
          }
        />
      </a>
    </div>
  );
};

export default ProjectItem;
