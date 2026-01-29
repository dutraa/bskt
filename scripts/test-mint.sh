#!/bin/bash

# Test the /mint endpoint with sample data

echo "🧪 Testing BSKT Backend /mint endpoint..."

# Configuration
API_URL="http://localhost:3001"
BENEFICIARY="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
AMOUNT="1000"
STABLECOIN_ADDRESS="0x1234567890123456789012345678901234567890"
CONSUMER_ADDRESS="0x0987654321098765432109876543210987654321"

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s "${API_URL}/health" > /dev/null; then
    echo "❌ Server is not running at ${API_URL}"
    echo "   Start the server with: bash scripts/start-backend.sh"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Make the mint request
echo "🔨 Sending mint request..."
echo "   Beneficiary: ${BENEFICIARY}"
echo "   Amount: ${AMOUNT}"
echo "   Stablecoin: ${STABLECOIN_ADDRESS}"
echo "   Consumer: ${CONSUMER_ADDRESS}"
echo ""

RESPONSE=$(curl -s -X POST "${API_URL}/mint" \
  -H "Content-Type: application/json" \
  -d "{
    \"beneficiary\": \"${BENEFICIARY}\",
    \"amount\": \"${AMOUNT}\",
    \"stablecoinAddress\": \"${STABLECOIN_ADDRESS}\",
    \"mintingConsumerAddress\": \"${CONSUMER_ADDRESS}\"
  }")

echo "📬 Response:"
echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
echo ""

# Check if successful
if echo "${RESPONSE}" | grep -q '"success":true'; then
    echo "✅ Mint request successful!"
    TX_HASH=$(echo "${RESPONSE}" | jq -r '.mintTx' 2>/dev/null)
    if [ -n "${TX_HASH}" ] && [ "${TX_HASH}" != "null" ]; then
        echo "   Transaction: ${TX_HASH}"
        echo "   Etherscan: https://sepolia.etherscan.io/tx/${TX_HASH}"
    fi
else
    echo "❌ Mint request failed"
fi
