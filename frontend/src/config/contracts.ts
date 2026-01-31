// Contract addresses for Sepolia testnet
export const BASKET_FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_BASKET_FACTORY_ADDRESS ||
  "0xc0e78ddcc5ecc590e77a985bca82122d52b0e092") as `0x${string}`;

export const POLICY_ENGINE_ADDRESS = (process.env.NEXT_PUBLIC_POLICY_ENGINE_ADDRESS ||
  "0x697B79dFdbe5eD6f9d877bBeFac04d7A28be5CA1") as `0x${string}`;

export const MINT_API_URL =
  process.env.NEXT_PUBLIC_MINT_API_URL || "http://localhost:3001/api/mint";

// BasketFactory ABI - only the functions we need
export const BasketFactoryABI = [
  {
    type: "constructor",
    inputs: [{ name: "_policyEngine", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createBasket",
    inputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "symbol", type: "string", internalType: "string" },
      { name: "admin", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "stablecoin", type: "address", internalType: "address" },
      { name: "mintingConsumer", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "policyEngine",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BasketCreated",
    inputs: [
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "admin", type: "address", indexed: true, internalType: "address" },
      { name: "stablecoin", type: "address", indexed: true, internalType: "address" },
      { name: "mintingConsumer", type: "address", indexed: false, internalType: "address" },
      { name: "name", type: "string", indexed: false, internalType: "string" },
      { name: "symbol", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
] as const;

// StablecoinERC20 ABI - ERC20 + custom functions
export const StablecoinERC20ABI = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isMinter",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isBurner",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;

// MintingConsumerWithACE ABI - for reading stablecoin address
export const MintingConsumerABI = [
  {
    type: "function",
    name: "getStablecoin",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MintExecuted",
    inputs: [
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "bankReference", type: "bytes32", indexed: true, internalType: "bytes32" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RedeemExecuted",
    inputs: [
      { name: "account", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "bankReference", type: "bytes32", indexed: true, internalType: "bytes32" },
    ],
    anonymous: false,
  },
] as const;
