import React from "react";
import Head from "next/head";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "Prediction Market",
  description = "Decentralized prediction market powered by Web3",
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col min-h-screen bg-neutral-900 text-neutral-100">
        <Navbar />

        <main className="flex-grow container mx-auto px-l py-xl">
          {children}
        </main>

        <footer className="py-l border-t border-neutral-700">
          <div className="container mx-auto px-l">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-body-s text-neutral-500">
                © {new Date().getFullYear()} PredictX - Powered by WAVS
              </div>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
