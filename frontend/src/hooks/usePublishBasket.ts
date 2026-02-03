"use client";

import { useState, useCallback } from "react";

export interface PublishBasketRequest {
  name: string;
  symbol: string;
  stablecoinAddress: string;
  mintingConsumerAddress: string;
}

export interface PublishBasketResponse {
  success: boolean;
  message?: string;
  error?: string;
  basket?: {
    name: string;
    symbol: string;
    stablecoinAddress: string;
    mintingConsumerAddress: string;
  };
}

export function usePublishBasket() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  const publishBasket = useCallback(async (basket: PublishBasketRequest): Promise<PublishBasketResponse> => {
    setIsPublishing(true);
    setPublishError(null);
    setIsPublished(false);

    try {
      console.log("[usePublishBasket] Publishing basket:", basket);

      const response = await fetch("/api/publish-basket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(basket),
      });

      const data = await response.json();
      console.log("[usePublishBasket] Response:", data);

      if (!response.ok || !data.success) {
        const errorMsg = data.message || data.error || "Failed to publish basket";
        setPublishError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setIsPublished(true);
      return data;
    } catch (error: any) {
      const errorMsg = error.message || "Failed to publish basket";
      setPublishError(errorMsg);
      console.error("[usePublishBasket] Error:", error);
      return { success: false, error: errorMsg };
    } finally {
      setIsPublishing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPublishing(false);
    setPublishError(null);
    setIsPublished(false);
  }, []);

  return {
    publishBasket,
    isPublishing,
    publishError,
    isPublished,
    reset,
  };
}
