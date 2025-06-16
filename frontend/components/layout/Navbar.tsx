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
            <div className="text-title-s font-bold text-primary-600 title-glow">
              PredictX
            </div>

            <nav className="hidden md:flex ml-xl">
              <ul className="flex space-x-s">
                {navLinks.map(({ href, label, icon }) => (
                  <li key={href}>
                    <Link href={href} passHref legacyBehavior>
                      <a
                        className={`flex items-center px-m py-s rounded-card-2 text-body-s transition-all duration-250 ease-soft ${
                          router.pathname === href
                            ? "bg-neutral-850 text-neutral-100 border border-neutral-700"
                            : "text-neutral-500 hover:text-neutral-100 hover:bg-neutral-850"
                        }`}
                      >
                        <span className="mr-s">{icon}</span>
                        <span>{label}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center space-x-m">
            <ConnectButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-m pb-s">
          <ul className="flex justify-between">
            {navLinks.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} passHref legacyBehavior>
                  <a
                    className={`flex flex-col items-center p-s rounded-card-2 text-button-s transition-all duration-250 ease-soft ${
                      router.pathname === href
                        ? "text-primary-600 bg-primary-900/20"
                        : "text-neutral-500 hover:text-neutral-100"
                    }`}
                  >
                    <span className="text-xl mb-xs">{icon}</span>
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
