import { useState } from 'react';
import { Navigation } from './components/Layout/Navigation';
import { Discover } from './pages/Discover';
import { Market } from './pages/Market';
import { Trade } from './pages/Trade';
import { Lend } from './pages/Lend';
import { Portfolio } from './pages/Portfolio';
import { Earn } from './pages/Earn';
import { Analytics } from './pages/Analytics';

function App() {
  const [currentPage, setCurrentPage] = useState('/discover');

  function handleNavigate(path: string) {
    setCurrentPage(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPage() {
    switch (currentPage) {
      case '/discover':
        return <Discover onNavigate={handleNavigate} />;
      case '/market':
        return <Market onNavigate={handleNavigate} />;
      case '/trade':
        return <Trade onNavigate={handleNavigate} />;
      case '/lend':
        return <Lend onNavigate={handleNavigate} />;
      case '/portfolio':
        return <Portfolio onNavigate={handleNavigate} />;
      case '/earn':
        return <Earn onNavigate={handleNavigate} />;
      case '/analytics':
        return <Analytics />;
      default:
        return <Discover onNavigate={handleNavigate} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
    </div>
  );
}

export default App;
