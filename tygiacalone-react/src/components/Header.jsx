import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  return (
    <header className="border-b border-black py-6 pr-4">
      <div className="text-black text-4xl font-roboto font-thin inline float-left leading-none relative">
        <Link
          to="/"
          className="no-underline text-inherit border-b-0 hover:bg-white"
        >
          Ty Giacalone
        </Link>
      </div>
      <br />
      <nav>
        <ul className="list-none mt-0 p-0 float-right clear-right">
          <li className="float-right ml-8 text-lg font-roboto font-light p-2 hover:bg-highlight transition-colors duration-750">
            <a href="mailto:tgiacalo@ucla.edu" className="text-inherit p-0">
              Contact
            </a>
          </li>
          <li className="float-right ml-8 text-lg font-roboto font-light p-2 hover:bg-highlight transition-colors duration-750">
            <a
              href="https://github.com/tygiacalone"
              target="_blank"
              rel="noopener noreferrer"
              className="text-inherit p-0"
            >
              GitHub
            </a>
          </li>
          <li className="float-right ml-8 text-lg font-roboto font-light p-2 hover:bg-highlight transition-colors duration-750">
            <Link
              to="/docs/TyGiacaloneResume.pdf"
              target="_blank"
              className="text-inherit p-0"
            >
              Resume
            </Link>
          </li>
          <li
            className={`float-right ml-8 text-lg font-roboto font-light p-2 hover:bg-highlight transition-colors duration-750 ${
              location.pathname === '/me' ? 'opacity-50' : ''
            }`}
          >
            <Link to="/me" className="text-inherit p-0">
              Me
            </Link>
          </li>
          <li
            className={`float-right ml-8 text-lg font-roboto font-light p-2 hover:bg-highlight transition-colors duration-750 ${
              location.pathname === '/' ? 'opacity-50' : ''
            }`}
          >
            <Link to="/" className="text-inherit p-0">
              Projects
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
