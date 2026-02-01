"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { decodeEventLog, Log } from "viem";
import { BasketFactoryABI, BASKET_FACTORY_ADDRESS } from "@/config/contracts";

export interface BasketCreatedResult {
  stablecoinAddress: `0x${string}`;
  mintingConsumerAddress: `0x${string}`;
  name: string;
  symbol: string;
  txHash: `0x${string}`;
}

interface TransactionReceipt {
  transactionHash: `0x${string}`;
  logs: Log[];
}

export function useCreateBasket() {
  const { address } = useAccount();
  const [result, setResult] = useState<BasketCreatedResult | null>(null);

  const {
    data: hash,
    isPending,
    writeContract,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Parse the BasketCreated event from the receipt
  const parseReceipt = (txReceipt: TransactionReceipt): BasketCreatedResult | null => {
    if (!txReceipt) return null;

    for (const log of txReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: BasketFactoryABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "BasketCreated") {
          const args = decoded.args as {
            creator: `0x${string}`;
            admin: `0x${string}`;
            stablecoin: `0x${string}`;
            mintingConsumer: `0x${string}`;
            name: string;
            symbol: string;
          };

          const newResult: BasketCreatedResult = {
            stablecoinAddress: args.stablecoin,
            mintingConsumerAddress: args.mintingConsumer,
            name: args.name,
            symbol: args.symbol,
            txHash: txReceipt.transactionHash,
          };

          return newResult;
        }
      } catch {
        // Not a BasketCreated event, continue
      }
    }
    return null;
  };

  // Parse when receipt is ready
  useEffect(() => {
    if (isConfirmed && receipt && !result) {
      const parsed = parseReceipt(receipt as TransactionReceipt);
      if (parsed) {
        setResult(parsed);
        
        // Store in localStorage for persistence
        try {
          const stored = localStorage.getItem("basket_baskets") || "[]";
          const baskets = JSON.parse(stored);
          baskets.push({
            ...parsed,
            createdAt: new Date().toISOString(),
            admin: address,
          });
          localStorage.setItem("basket_baskets", JSON.stringify(baskets));
        } catch (e) {
          console.error("Failed to store basket in localStorage:", e);
        }
      }
    }
  }, [isConfirmed, receipt, result, address]);

  const createBasket = async (name: string, symbol: string, admin?: `0x${string}`) => {
    if (!address) throw new Error("Wallet not connected");

    const adminAddress = admin || address;

    writeContract({
      address: BASKET_FACTORY_ADDRESS,
      abi: BasketFactoryABI,
      functionName: "createBasket",
      args: [name, symbol, adminAddress],
    });
  };

  const resetState = () => {
    reset();
    setResult(null);
  };

  return {
    createBasket,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    result,
    error: writeError || receiptError,
    reset: resetState,
  };
}
