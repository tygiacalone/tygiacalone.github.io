import { useState } from 'react';
import ProjectItem from './ProjectItem';
import ProjectDetail from './ProjectDetail';

const ProjectsPage = () => {
  const [projects] = useState([
    {
      id: 'mint',
      title: 'Mint',
      icon: '/img/ty_icons_22.png',
      content: (
        <>
          <img
            className="block mx-auto max-w-[60em] min-w-[30em]"
            src="/img/mint.png"
            alt="Mint Project"
          />
          <br />
          <br />
          <br /> Visualize and explore tweets with D3.js & Ruby on Rails
          <br />
          <br /> Zoom, pan, search, and visualize the latest Twitter trends.
          View automatically "reclustering" groups of 500,000+ tweets based on
          most popular hashtag, most active user, and most popular twitter
          client. As users zoom in and out, clusters of tweets automatically
          resize to become more or less granular.
          <br />
          <br />
          <a
            href="https://github.com/scalableinternetservicesarchive/mint"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:bg-highlight transition-colors duration-750"
          >
            [github]
          </a>
        </>
      ),
    },
    {
      id: 'swipes',
      title: 'Swipes for Advice',
      icon: '/img/ty_icons_swipes.png',
      content: (
        <>
          <div className="text-center">
            <img
              className="block mx-auto max-w-[17em]"
              src="/img/swipes_logo.png"
              alt="Swipes for Advice"
            />
          </div>
          <br />
          <br />
          <b>Swipes for Advice</b>
          <br />
          <br /> Tinder for networking. As underclassmen we're always wasting
          extra dining hall swipes and need valuable mentorship and career
          advice, and our older upperclassmen friends miss UCLA's wonderful
          buffet style dining.
          <br />
          <br /> With Swipes for Advice, it's a win-win!
          <br />
          <br /> Browse, match, and chat with local profiles showing credentials
          pulled from LinkedIn. If you two hit it off, take an upperclassmen out
          for a meal and receive mentorship over lunch!
          <br />
          <br />
          <br />
          <a
            href="https://github.com/tygiacalone/SwipesForAdvice"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:bg-highlight transition-colors duration-750"
          >
            [github]
          </a>
          <br />
          <br />
          <a
            href="/docs/SwipesForAdvice.pptx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:bg-highlight transition-colors duration-750"
          >
            [ppt presentation]
          </a>
          <br />
          <br /> Additional Screenshots:
          <br />
          <div className="text-center">
            <img
              className="block mx-auto max-w-[17em]"
              src="/img/swipes_match.png"
              alt="Swipes Match"
            />
            <br />
            <img
              className="block mx-auto max-w-[17em]"
              src="/img/swipes_caroline.png"
              alt="Swipes Caroline"
            />
            <br />
            <img
              className="block mx-auto max-w-[17em]"
              src="/img/swipes_friends.png"
              alt="Swipes Friends"
            />
            <br />
            <img
              className="block mx-auto max-w-[17em]"
              src="/img/swipes_chat.png"
              alt="Swipes Chat"
            />
            <br />
          </div>
        </>
      ),
    },
    {
      id: 'snowmen',
      title: "It's a Wonderful Day",
      icon: '/img/ty_icons_movie.png',
      content: (
        <>
          <div className="text-center">
            <iframe
              className="mx-auto"
              style={{ border: '1px solid black' }}
              width="400"
              height="400"
              src="https://www.youtube.com/embed/ooPaUXGAEG0?theme=light&modestbranding=1&autohide=1&showinfo=0&controls=0&rel=0&vq=hd1080"
              frameBorder="0"
              allowFullScreen
              title="It's a Wonderful Day"
            ></iframe>
          </div>
          <br />
          <br />
          <b>It's a Wonderful Day</b>
          <br />
          <br /> Sometimes we just need a little peace and quiet.
          <br />
          <br /> It's a Wonderful Day is a short film created in C++ with
          openGL, depicting the fate of a happy family of snowmen and one
          particularly grumpy sun.
          <br />
          <br />
          The film placed top 3 for best animation project in UCLA's Computer
          Graphics class of Spring 2014.
          <br />
          <br />
          <a
            href="https://www.youtube.com/watch?v=ooPaUXGAEG0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:bg-highlight transition-colors duration-750"
          >
            [youtube]
          </a>
        </>
      ),
    },
    {
      id: 'invaders',
      title: 'Space Inflators',
      icon: '/img/ty_icons_23.png',
      content: (
        <>
          <div className="text-center">
            <img
              className="block mx-auto max-w-[35em]"
              src="/img/SpaceInflators.png"
              alt="Space Inflators"
            />
          </div>
          <br />
          <br />
          <b>The aliens are fierce and the torpedoes are scarce.</b>
          <br />
          <br /> Enter Space Inflators. A classic top-down shooter written in
          C++, inspired by the arcade classic, Space Invaders. Utilizing an
          existing graphics and sound API, I created my own take on xenocide in
          two dimensions.
          <br />
          <br /> Space Inflators features 3 different types of aliens, all with
          unique AI states and behaviors, damage statistics, hit points, and
          power up drop rates.
          <br />
          <br />
          <a
            href="https://www.mediafire.com/?geri5ff45fuvxj5"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:bg-highlight transition-colors duration-750"
          >
            [playable demo]
          </a>{' '}
          (2MB .zip)
          <br />
          <br />
          <a
            href="https://github.com/tygiacalone/SpaceInflators"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:bg-highlight transition-colors duration-750"
          >
            [github]
          </a>
        </>
      ),
    },
  ]);

  const [activeProject, setActiveProject] = useState('mint');

  return (
    <div className="w-full flex flex-wrap">
      <div
        className="align-left inline-block max-w-[20%] float-left pt-12"
        id="listing"
      >
        <ul>
          <br />
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              isActive={activeProject === project.id}
              onClick={() => setActiveProject(project.id)}
            />
          ))}
        </ul>
      </div>
      <div id="contents" className="inline-block w-[70%]">
        {projects.map((project) => (
          <ProjectDetail
            key={project.id}
            project={project}
            isActive={activeProject === project.id}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
