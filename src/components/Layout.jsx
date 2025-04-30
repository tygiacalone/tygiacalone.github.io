import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <div className="w-full min-h-screen block">
      <div className="min-h-full w-full relative">
        <Header />
        <main className="block w-full pb-8">
          <Outlet />
        </main>
      </div>
      <footer className="h-8 w-full relative bottom-0"></footer>
    </div>
  );
};

export default Layout;
