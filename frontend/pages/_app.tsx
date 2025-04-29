import React from 'react';
import type { AppProps } from 'next/app';
import { RainbowKitProvider, chains, wagmiConfig } from '@/utils/rainbowkit-config';
import { WagmiConfig } from 'wagmi';
import Layout from '@/components/layout/Layout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
