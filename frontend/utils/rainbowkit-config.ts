import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  connectorsForWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [{...localhost, id: 17_000}],
  [publicProvider()]
);

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id';

const { wallets } = getDefaultWallets({
  appName: 'Prediction Market',
  projectId,
  chains,
});

const connectors = connectorsForWallets([
  ...wallets,
]);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains, RainbowKitProvider };