import { defineChain } from "viem";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

export const kiiChainTestnet = defineChain({
  id: 123454321,
  name: "Kiichain Testnet",
  nativeCurrency: { name: "kii", symbol: "kii", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://a.sentry.testnet.kiivalidator.com:8645"] },
  },
  blockExplorers: {
    default: { name: "explorer", url: "https://app.kiichain.io/kiichain" },
  },
});

export const config = createConfig({
  chains: [kiiChainTestnet],
  connectors: [injected()],
  transports: {
    [kiiChainTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
