import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_MINT_API_URL?.replace('/mint', '') || '';
const API_KEY = process.env.MINT_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, symbol, stablecoinAddress, mintingConsumerAddress } = body;

    // Validate required fields
    if (!name || !symbol || !stablecoinAddress || !mintingConsumerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Missing required fields: name, symbol, stablecoinAddress, mintingConsumerAddress",
        },
        { status: 400 }
      );
    }

    console.log("[Publish Basket] Publishing to backend:", { name, symbol, stablecoinAddress, mintingConsumerAddress });

    // Call the real backend
    const response = await fetch(`${BACKEND_URL}/publish-basket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        name,
        symbol,
        stablecoinAddress,
        mintingConsumerAddress,
      }),
    });

    const data = await response.json();
    console.log("[Publish Basket] Backend response:", data);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "BACKEND_ERROR",
          message: data.message || "Failed to publish basket to backend",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Publish Basket Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error.message || "Failed to publish basket",
      },
      { status: 500 }
    );
  }
}
