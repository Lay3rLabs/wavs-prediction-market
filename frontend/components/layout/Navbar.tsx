import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  FaChartLine,
  FaPlus,
  FaHistory,
  FaChartPie,
  FaCog,
} from "react-icons/fa";

const Navbar: React.FC = () => {
  const router = useRouter();

  const navLinks = [
    { href: "/", label: "Markets", icon: <FaChartLine /> },
    { href: "/create", label: "Create", icon: <FaPlus /> },
    { href: "/history", label: "History", icon: <FaHistory /> },
    { href: "/portfolio", label: "Portfolio", icon: <FaChartPie /> },
    { href: "/admin", label: "Admin", icon: <FaCog /> },
  ];

  return (
    <header className="bg-neutral-900 border-b border-neutral-700">
      <div className="container mx-auto px-l py-m">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-title-m font-bold text-gradient title-glow">
              PredictX
            </div>

            <nav className="hidden md:flex ml-8">
              <ul className="flex space-x-1">
                {navLinks.map(({ href, label, icon }) => (
                  <li key={href}>
                    <Link href={href} passHref legacyBehavior>
                      <a
                        className={`flex items-center px-3 py-2 rounded-lg text-body-s font-medium transition-all duration-250 ease-soft ${
                          router.pathname === href
                            ? "bg-neutral-850 text-neutral-100 shadow-card-1"
                            : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850/50"
                        }`}
                      >
                        <span className="mr-2 w-4 h-4 flex items-center justify-center">
                          {icon}
                        </span>
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
        <nav className="md:hidden mt-4 pb-2">
          <ul className="flex justify-between px-2">
            {navLinks.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} passHref legacyBehavior>
                  <a
                    className={`flex flex-col items-center p-3 rounded-xl text-body-xs font-medium transition-all duration-250 ease-soft ${
                      router.pathname === href
                        ? "text-primary-400 bg-primary-900/20 shadow-card-1"
                        : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-850/50"
                    }`}
                  >
                    <span className="text-lg mb-1 w-5 h-5 flex items-center justify-center">
                      {icon}
                    </span>
                    <span className="text-center">{label}</span>
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
