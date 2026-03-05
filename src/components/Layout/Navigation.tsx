import { useState } from 'react';
import {
  Compass,
  TrendingUp,
  ArrowLeftRight,
  HandCoins,
  Wallet,
  Sparkles,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { name: 'Discover', icon: Compass, path: '/discover' },
  { name: 'Market', icon: TrendingUp, path: '/market' },
  { name: 'Trade', icon: ArrowLeftRight, path: '/trade' },
  { name: 'Lend', icon: HandCoins, path: '/lend' },
  { name: 'Portfolio', icon: Wallet, path: '/portfolio' },
  { name: 'Earn', icon: Sparkles, path: '/earn' },
  { name: 'Analytics', icon: BarChart3, path: '/analytics' },
];

interface NavigationProps {
  currentPage: string;
  onNavigate: (path: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="hidden md:flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-xl font-bold text-white">DexAggregator</span>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                  currentPage === item.path
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary-600/20">
          Connect Wallet
        </button>
      </nav>

      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-lg font-bold text-white">DexAggregator</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[57px] bg-gray-900 z-30 p-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    currentPage === item.path
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>

            <button className="w-full mt-4 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all">
              Connect Wallet
            </button>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-40">
          <div className="flex items-center justify-around py-2">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                  currentPage === item.path ? 'text-primary-500' : 'text-gray-400'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
