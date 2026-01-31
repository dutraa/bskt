import { NextRequest, NextResponse } from "next/server";

/**
 * Mock API endpoint for triggering mint requests.
 * In production, this would trigger the CRE workflow.
 *
 * For hackathon demo:
 * - Accepts the mint request payload
 * - Returns a success response with transaction ID
 * - In real deployment, this would forward to the CRE HTTP trigger
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { beneficiary, amount, stablecoinAddress, mintingConsumerAddress } = body;

    if (!beneficiary?.account) {
      return NextResponse.json(
        { error: "Missing beneficiary address" },
        { status: 400 }
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!stablecoinAddress) {
      return NextResponse.json(
        { error: "Missing stablecoin address" },
        { status: 400 }
      );
    }

    // Generate transaction ID
    const transactionId = body.transactionId || `BSKT${Date.now().toString(36).toUpperCase()}`;

    console.log("Mint request received:", {
      transactionId,
      beneficiary: beneficiary.account,
      amount,
      stablecoinAddress,
      mintingConsumerAddress,
    });

    // TODO: In production, forward this to the CRE workflow HTTP trigger
    // const creResponse = await fetch(CRE_WORKFLOW_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     messageType: 'MT103',
    //     transactionId,
    //     beneficiary,
    //     amount,
    //     // ... other CRE payload fields
    //   }),
    // });

    // For demo purposes, simulate success after a short delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      transactionId,
      message: `Mint request submitted for ${amount} tokens to ${beneficiary.account}`,
      note: "This is a demo endpoint. In production, this triggers the CRE workflow.",
      payload: {
        beneficiary: beneficiary.account,
        amount,
        stablecoinAddress,
        mintingConsumerAddress,
      },
    });
  } catch (error) {
    console.error("Mint request error:", error);
    return NextResponse.json(
      {
        error: "Failed to process mint request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Basket Mint API",
    status: "healthy",
    endpoints: {
      "POST /api/mint": "Submit a mint request to trigger CRE workflow",
    },
  });
}
