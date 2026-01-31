"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { MINT_API_URL } from "@/config/contracts";

export interface MintRequestResult {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

export function useMintRequest() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MintRequestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestMint = async (
    stablecoinAddress: string,
    mintingConsumerAddress: string,
    amount: string,
    beneficiary?: string
  ) => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Generate a unique bank reference
      const bankReference = `BSKT${Date.now().toString(36).toUpperCase()}`;
      const beneficiaryAddress = beneficiary || address;

      const payload = {
        messageType: "MT103",
        transactionId: bankReference,
        sender: {
          name: "Basket User",
          account: address,
          bankCode: "BASKET",
        },
        beneficiary: {
          name: "Stablecoin Recipient",
          account: beneficiaryAddress,
        },
        amount: amount,
        currency: "USD",
        valueDate: new Date().toISOString().split("T")[0],
        bankReference: bankReference,
        // Additional metadata for the CRE workflow
        stablecoinAddress,
        mintingConsumerAddress,
      };

      const response = await fetch(MINT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setResult({
        success: true,
        transactionId: data.transactionId || bankReference,
        message: data.message || "Mint request submitted successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit mint request";
      setError(errorMessage);
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    requestMint,
    isLoading,
    result,
    error,
    reset,
  };
}
