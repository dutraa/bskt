"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { Header, CreateBasket, MintRequest, VerifyBalance } from "@/components";
import { BasketCreatedResult } from "@/hooks/useBasketFactory";

export default function Home() {
  const { isConnected } = useAccount();
  const [currentBasket, setCurrentBasket] = useState<BasketCreatedResult | null>(null);

  const handleBasketCreated = useCallback((result: BasketCreatedResult) => {
    setCurrentBasket(result);
  }, []);

  const handleMintComplete = useCallback(() => {
    // This will trigger a refetch of the balance
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Your Stablecoin Basket
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Deploy ACE-protected stablecoins with policy-enforced minting.
            <br />
            <span className="text-sm text-slate-500">
              Create → Mint → Verify in minutes.
            </span>
          </p>
        </div>

        {/* Status Banner */}
        {!isConnected && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-amber-200 font-medium">Connect your wallet to get started</p>
                <p className="text-sm text-amber-300/70">
                  You'll need Sepolia testnet ETH for gas fees.{" "}
                  <a
                    href="https://sepoliafaucet.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-200"
                  >
                    Get test ETH from faucet
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Basket Summary */}
        {currentBasket && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">
                    Active Basket: {currentBasket.name}
                  </p>
                  <p className="text-sm text-slate-400 font-mono">
                    {currentBasket.stablecoinAddress.slice(0, 10)}...{currentBasket.stablecoinAddress.slice(-8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentBasket(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Flow Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <CreateBasket onBasketCreated={handleBasketCreated} />
          <MintRequest basket={currentBasket} onMintComplete={handleMintComplete} />
          <VerifyBalance basket={currentBasket} />
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ACE Protected</h3>
            <p className="text-sm text-slate-400">
              All minting operations go through Chainlink's ACE policy engine for compliance validation.
            </p>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">CRE Workflow</h3>
            <p className="text-sm text-slate-400">
              Mint requests trigger the Chainlink Runtime Environment for proof-of-reserve validation.
            </p>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Deploy</h3>
            <p className="text-sm text-slate-400">
              Deploy your own stablecoin with minting consumer in a single transaction.
            </p>
          </div>
        </div>

        {/* Contract Info */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Contract Addresses (Sepolia)</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">BasketFactory</p>
                <a
                  href="https://sepolia.etherscan.io/address/0x7419818Baf1373B5a75ab265C00c2ea0895Bd590"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="address-display text-indigo-300 hover:text-indigo-200 block"
                >
                  0x7419818Baf1373B5a75ab265C00c2ea0895Bd590
                </a>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">PolicyEngine</p>
                <a
                  href="https://sepolia.etherscan.io/address/0x697B79dFdbe5eD6f9d877bBeFac04d7A28be5CA1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="address-display text-purple-300 hover:text-purple-200 block"
                >
                  0x697B79dFdbe5eD6f9d877bBeFac04d7A28be5CA1
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>Built for the Chainlink Hackathon</p>
          <p className="mt-1">
            Powered by{" "}
            <span className="text-indigo-400">Chainlink CRE</span>
            {" & "}
            <span className="text-purple-400">ACE Policy Engine</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
