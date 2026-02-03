"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCreateBasket, BasketCreatedResult } from "@/hooks/useBasketFactory";
import { usePublishBasket } from "@/hooks/usePublishBasket";

interface CreateBasketProps {
  onBasketCreated: (result: BasketCreatedResult) => void;
}

export function CreateBasket({ onBasketCreated }: CreateBasketProps) {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("Basket USD");
  const [symbol, setSymbol] = useState("bUSD");
  const [admin, setAdmin] = useState("");

  const {
    createBasket,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    result,
    error,
    reset,
  } = useCreateBasket();

  const {
    publishBasket,
    isPublishing,
    publishError,
    isPublished,
    reset: resetPublish,
  } = usePublishBasket();

  // Set admin to connected wallet address by default
  useEffect(() => {
    if (address && !admin) {
      setAdmin(address);
    }
  }, [address, admin]);

  // Notify parent when basket is created
  useEffect(() => {
    if (result) {
      onBasketCreated(result);
    }
  }, [result, onBasketCreated]);

  // Auto-publish basket to backend when created
  useEffect(() => {
    if (result && !isPublished && !isPublishing && !publishError) {
      publishBasket({
        name: result.name,
        symbol: result.symbol,
        stablecoinAddress: result.stablecoinAddress,
        mintingConsumerAddress: result.mintingConsumerAddress,
      });
    }
  }, [result, isPublished, isPublishing, publishError, publishBasket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol || !admin) return;

    try {
      await createBasket(name, symbol, admin as `0x${string}`);
    } catch (err) {
      console.error("Failed to create basket:", err);
    }
  };

  const isLoading = isPending || isConfirming;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="step-indicator step-active">1</div>
        <div>
          <h2 className="text-xl font-bold text-white">Create Basket</h2>
          <p className="text-sm text-slate-400">
            Deploy a new stablecoin with ACE-protected minting
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="bg-slate-900/50 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">Connect your wallet to create a basket</p>
          <p className="text-sm text-slate-500">
            You'll need Sepolia ETH for gas fees
          </p>
        </div>
      ) : isConfirmed && result ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Basket Created Successfully!</span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Stablecoin Address</p>
                <div className="address-display text-green-300">
                  {result.stablecoinAddress}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Minting Consumer Address</p>
                <div className="address-display text-purple-300">
                  {result.mintingConsumerAddress}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">
                  Token: <span className="text-white font-medium">{result.name} ({result.symbol})</span>
                </span>
              </div>

              <a
                href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
              >
                View on Etherscan
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Backend Publishing Status */}
          {isPublishing && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Publishing basket to backend...</span>
              </div>
            </div>
          )}

          {isPublished && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Basket published to backend!</span>
              </div>
              <p className="text-xs text-emerald-300/70 mt-1 ml-6">
                You can now mint {result.symbol} tokens using the mint request.
              </p>
            </div>
          )}

          {publishError && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm">Failed to publish to backend</span>
              </div>
              <p className="text-xs text-amber-300/70 mt-1 ml-6">
                {publishError}. You can still use hardcoded baskets (DUSD, AUDT) for minting.
              </p>
            </div>
          )}

          <button onClick={() => { reset(); resetPublish(); }} className="btn-secondary w-full">
            Create Another Basket
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Token Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Basket USD"
              className="input"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="symbol" className="label">
              Token Symbol
            </label>
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., bUSD"
              className="input"
              disabled={isLoading}
              required
              maxLength={10}
            />
          </div>

          <div>
            <label htmlFor="admin" className="label">
              Admin Address
              <span className="text-slate-500 font-normal ml-2">
                (defaults to connected wallet)
              </span>
            </label>
            <input
              id="admin"
              type="text"
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
              placeholder="0x..."
              className="input font-mono text-sm"
              disabled={isLoading}
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error.message || "Transaction failed"}
            </div>
          )}

          {hash && !isConfirmed && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
              <p className="text-indigo-400 text-sm mb-2">
                {isConfirming ? "Waiting for confirmation..." : "Transaction submitted"}
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 text-xs font-mono break-all"
              >
                {hash}
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !name || !symbol || !admin}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isPending ? "Confirm in wallet..." : "Creating basket..."}
              </>
            ) : (
              <>
                <span>Create Basket</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
