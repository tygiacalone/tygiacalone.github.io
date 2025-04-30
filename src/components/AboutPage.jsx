const AboutPage = () => {
  return (
    <div className="flex flex-wrap w-full mt-8">
      <div className="max-w-[30%] float-left pl-8">
        <ul>
          <p>
            <img
              className="block max-w-[90%] mx-auto rounded"
              src="/img/Me.jpg"
              alt="Ty Giacalone"
            />
          </p>
          <br />
          <p>
            <img
              className="block max-w-[90%] mx-auto rounded"
              src="/img/Me2.jpg"
              alt="Ty Giacalone 2"
            />
          </p>
          <br />
        </ul>
      </div>

      <div id="contents" className="max-w-[60%] float-right pr-[5%]">
        <div className="leading-relaxed text-lg font-roboto font-light">
          <br /> Currently in my senior year studying Computer Science at the
          University of California, Los Angeles.
          <br />
          <br /> I am currently looking for a full time software engineering
          position and am interested in full stack web development as well as
          mobile development.
          <br />
          <br /> Aside from programming, I am also interested in
          entrepreneurship, tennis, fitness, UI/UX, video & audio editing, game
          design, and psychology.
          <br />
          <br />
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
