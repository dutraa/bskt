"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMintRequest } from "@/hooks/useMintRequest";
import { BasketCreatedResult } from "@/hooks/useBasketFactory";

interface MintRequestProps {
  basket: BasketCreatedResult | null;
  onMintComplete: () => void;
}

export function MintRequest({ basket, onMintComplete }: MintRequestProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("1000");
  const [beneficiary, setBeneficiary] = useState("");

  const { requestMint, isLoading, result, error, reset } = useMintRequest();

  // Set beneficiary to connected wallet by default
  useEffect(() => {
    if (address && !beneficiary) {
      setBeneficiary(address);
    }
  }, [address, beneficiary]);

  // Notify parent when mint completes
  useEffect(() => {
    if (result?.success) {
      onMintComplete();
    }
  }, [result, onMintComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basket || !amount || !beneficiary) return;

    await requestMint(
      basket.stablecoinAddress,
      basket.mintingConsumerAddress,
      amount,
      beneficiary
    );
  };

  const isDisabled = !isConnected || !basket;

  return (
    <div className={`card ${isDisabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`step-indicator ${basket ? "step-active" : "step-inactive"}`}>
          2
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Request Mint</h2>
          <p className="text-sm text-slate-400">
            Trigger CRE workflow to mint stablecoins
          </p>
        </div>
      </div>

      {!basket ? (
        <div className="bg-slate-900/50 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">Create a basket first</p>
          <p className="text-sm text-slate-500">
            You need a stablecoin address to request minting
          </p>
        </div>
      ) : result?.success ? (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Mint Request Submitted!</span>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-slate-300">{result.message}</p>
              {result.transactionId && (
                <p className="text-slate-400">
                  Reference: <span className="text-indigo-400 font-mono">{result.transactionId}</span>
                </p>
              )}
              <p className="text-slate-400 text-xs mt-2">
                The CRE workflow will validate reserves and mint tokens to the beneficiary.
                Check the Verify section below to see your balance.
              </p>
            </div>
          </div>

          <button onClick={reset} className="btn-secondary w-full">
            Request Another Mint
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-400 mb-1">Minting to:</p>
            <p className="text-sm font-mono text-indigo-300 break-all">
              {basket.stablecoinAddress}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {basket.name} ({basket.symbol})
            </p>
          </div>

          <div>
            <label htmlFor="amount" className="label">
              Amount
              <span className="text-slate-500 font-normal ml-2">(in {basket.symbol})</span>
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 1000"
              className="input"
              disabled={isLoading}
              required
              min="1"
              step="1"
            />
          </div>

          <div>
            <label htmlFor="beneficiary" className="label">
              Beneficiary Address
              <span className="text-slate-500 font-normal ml-2">
                (who receives the tokens)
              </span>
            </label>
            <input
              id="beneficiary"
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="0x..."
              className="input font-mono text-sm"
              disabled={isLoading}
              required
              pattern="^0x[a-fA-F0-9]{40}$"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">Hackathon Mode</p>
                <p className="text-amber-300/70 text-xs">
                  This calls the backend API which triggers the CRE workflow.
                  Make sure the backend is running at the configured URL.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !amount || !beneficiary}
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
                Submitting request...
              </>
            ) : (
              <>
                <span>Request Mint</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
