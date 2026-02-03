"use client";

import { useAccount } from "wagmi";
import { useStablecoinBalance } from "@/hooks/useStablecoin";
import { BasketCreatedResult } from "@/hooks/useBasketFactory";
import { HARDCODED_BASKETS } from "@/config/contracts";

interface VerifyBalanceProps {
  basket: BasketCreatedResult | null;
}

export function VerifyBalance({ basket }: VerifyBalanceProps) {
  const { address, isConnected } = useAccount();

  // Balance for user-created basket
  const { balance, totalSupply, symbol, name, isLoading, refetch } =
    useStablecoinBalance(basket?.stablecoinAddress);

  // Balance for hardcoded DUSD (what backend actually mints to)
  const dusdData = useStablecoinBalance(HARDCODED_BASKETS.DUSD.stablecoinAddress);

  const isDisabled = !isConnected;

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleRefreshAll = async () => {
    await Promise.all([refetch(), dusdData.refetch()]);
  };

  const anyLoading = isLoading || dusdData.isLoading;

  return (
    <div className={`card ${isDisabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`step-indicator ${isConnected ? "step-active" : "step-inactive"}`}>
            3
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Verify Balance</h2>
            <p className="text-sm text-slate-400">
              Check your stablecoin holdings
            </p>
          </div>
        </div>

        {isConnected && (
          <button
            onClick={handleRefreshAll}
            disabled={anyLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${anyLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {anyLoading ? "Loading..." : "Refresh"}
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="bg-slate-900/50 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">Connect wallet first</p>
          <p className="text-sm text-slate-500">
            Your balance will appear here after connecting
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* DUSD Balance - What backend actually mints to */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-lg font-bold">
                D
              </div>
              <div>
                <p className="font-semibold text-white">Demo USD (DUSD)</p>
                <p className="text-xs text-green-400">Backend mints to this token</p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-500 break-all mb-4">
              {HARDCODED_BASKETS.DUSD.stablecoinAddress}
            </div>

            {/* DUSD Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xs text-slate-400">Your DUSD Balance</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {dusdData.isLoading ? "..." : formatNumber(dusdData.balance)}
                  </span>
                  <span className="text-sm text-green-400">DUSD</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs text-slate-400">Total Supply</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {dusdData.isLoading ? "..." : formatNumber(dusdData.totalSupply)}
                  </span>
                  <span className="text-sm text-emerald-400">DUSD</span>
                </div>
              </div>
            </div>

            <a
              href={`https://sepolia.etherscan.io/token/${HARDCODED_BASKETS.DUSD.stablecoinAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View DUSD on Etherscan
            </a>
          </div>

          {/* User-created basket (if different from DUSD) */}
          {basket && basket.stablecoinAddress.toLowerCase() !== HARDCODED_BASKETS.DUSD.stablecoinAddress.toLowerCase() && (
            <div className="bg-slate-900/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-lg font-bold">
                  {symbol.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-semibold text-white">{name || "Your Created Basket"}</p>
                  <p className="text-xs text-emerald-400">Select this in Request Mint to receive tokens</p>
                </div>
              </div>
              <div className="text-xs font-mono text-slate-500 break-all mb-3">
                {basket.stablecoinAddress}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <span className="text-xs text-slate-400">Your Balance</span>
                  <div className="text-xl font-bold text-white">
                    {isLoading ? "..." : formatNumber(balance)} <span className="text-sm text-indigo-400">{symbol}</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <span className="text-xs text-slate-400">Total Supply</span>
                  <div className="text-xl font-bold text-white">
                    {isLoading ? "..." : formatNumber(totalSupply)} <span className="text-sm text-purple-400">{symbol}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <a
                  href={`https://sepolia.etherscan.io/token/${basket.stablecoinAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  View Token
                </a>
                <a
                  href={`https://sepolia.etherscan.io/address/${basket.mintingConsumerAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  View Consumer
                </a>
              </div>
            </div>
          )}

          {/* Info note */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-indigo-200">
                <p className="font-medium mb-1">How It Works</p>
                <p className="text-indigo-300/70 text-xs">
                  Create a basket, then select it in Request Mint to receive tokens.
                  Published baskets are automatically registered with the backend.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
