import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaChartLine, FaPlus, FaHistory, FaChartPie, FaCog } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const router = useRouter();
  
  const navLinks = [
    { href: '/', label: 'Markets', icon: <FaChartLine /> },
    { href: '/create', label: 'Create', icon: <FaPlus /> },
    { href: '/history', label: 'History', icon: <FaHistory /> },
    { href: '/portfolio', label: 'Portfolio', icon: <FaChartPie /> },
    { href: '/admin', label: 'Admin', icon: <FaCog /> },
  ];
  
  return (
    <header className="bg-neutral-950 border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text">
              PredictX
            </div>
            
            <nav className="hidden md:flex ml-8">
              <ul className="flex space-x-1">
                {navLinks.map(({ href, label, icon }) => (
                  <li key={href}>
                    <Link href={href} passHref legacyBehavior>
                      <a className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                        router.pathname === href 
                          ? 'bg-neutral-850 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-neutral-850'
                      }`}>
                        <span className="mr-2">{icon}</span>
                        <span>{label}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <nav className="md:hidden mt-3 pb-1">
          <ul className="flex justify-between">
            {navLinks.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} passHref legacyBehavior>
                  <a className={`flex flex-col items-center p-2 rounded-lg text-xs ${
                    router.pathname === href 
                      ? 'text-primary-400' 
                      : 'text-gray-400 hover:text-white'
                  }`}>
                    <span className="text-lg mb-1">{icon}</span>
                    <span>{label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;