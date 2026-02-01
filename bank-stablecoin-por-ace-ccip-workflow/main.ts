console.log(`[DEBUG] main.ts starting... CWD: ${process.cwd()}`);
import {
	bytesToHex,
	cre,
	getNetwork,
	type HTTPPayload,
	hexToBase64,
	Runner,
	type Runtime,
	type NodeRuntime,
	TxStatus,
	consensusMedianAggregation,
} from '@chainlink/cre-sdk'
import { encodeAbiParameters, parseAbiParameters, encodeFunctionData, decodeFunctionResult, getAddress } from 'viem'
import { z } from 'zod'

// ========================================
// SHIM FOR LOCAL EXECUTION (Node/Bun)
// ========================================
// The CRE SDK expects global functions injected by the host. 
// This shim provides basic mocks to allow the code to run in Bun/Node.
// @ts-ignore
if (typeof globalThis.log === 'undefined') {
	const mockFunc = () => { };
	const mockReturnZero = () => 0;
	const mockReturnBytes = () => new Uint8Array();

	// @ts-ignore
	globalThis.log = (msg: string) => console.log(`[CRE] ${msg}`);
	// @ts-ignore
	globalThis.now = () => Math.floor(Date.now() / 1000);
	// @ts-ignore
	globalThis.getWasiArgs = () => "[\"\", \"\"]"; // Satisfy length check
	// @ts-ignore
	globalThis.versionV2 = mockFunc;
	// @ts-ignore
	globalThis.switchModes = mockFunc;
	// @ts-ignore
	globalThis.sendResponse = mockReturnZero;
	// @ts-ignore
	globalThis.callCapability = mockReturnZero;
	// @ts-ignore
	globalThis.awaitCapabilities = mockReturnBytes;
	// @ts-ignore
	globalThis.getSecrets = mockReturnBytes;
	// @ts-ignore
	globalThis.awaitSecrets = mockReturnBytes;

	// Hijack Runner to support local execution
	const fs = require('fs');
	const path = require('path');
	const { create, fromBinary, toBinary } = require('@bufbuild/protobuf');
	const { anyPack } = require('@bufbuild/protobuf/wkt');

	// Attempt to find SDK schemas and utilities
	const creSdkPath = path.resolve(process.cwd(), 'node_modules', '@chainlink', 'cre-sdk');

	const loadSdkModule = (subpath: string) => {
		try {
			return require(path.join(creSdkPath, 'dist', subpath));
		} catch (e: any) {
			console.error(`[SHIM ERROR] Failed to load SDK module ${subpath}:`, e.message);
			return null;
		}
	};

	const sdkPb = loadSdkModule('generated/sdk/v1alpha/sdk_pb.js');
	const evmPb = loadSdkModule('generated/capabilities/blockchain/evm/v1alpha/client_pb.js');
	const valuesUtil = loadSdkModule('sdk/utils/values/value.js');

	let lastReq: any = null;

	// @ts-ignore
	globalThis.callCapability = (reqBytes: Uint8Array) => {
		try {
			const req = fromBinary(sdkPb.CapabilityRequestSchema, reqBytes);
			lastReq = req;
			console.log(`[DEBUG] Capability call: ${req.id} method: ${req.method} callbackId: ${req.callbackId}`);
			return 0; // Success
		} catch (e: any) {
			console.error('[SHIM ERROR] callCapability failed:', e.message);
			return -1;
		}
	};

	// @ts-ignore
	globalThis.awaitCapabilities = (reqBytes: Uint8Array) => {
		try {
			if (!lastReq) return new Uint8Array();
			if (!sdkPb) {
				console.error('[SHIM ERROR] sdkPb not loaded');
				return new Uint8Array();
			}

			let responsePayload: any;
			let responseSchema: any;

			if (lastReq.method === 'Report') {
				responseSchema = sdkPb.ReportResponseSchema;
				responsePayload = {
					configDigest: new Uint8Array(32).fill(0x01),
					seqNr: 1n,
					reportContext: new Uint8Array(32).fill(0x02),
					rawReport: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
					sigs: [{ signature: new Uint8Array(65).fill(0x03), signerId: 1 }]
				};
			} else if (lastReq.method === 'WriteReport') {
				responseSchema = evmPb ? evmPb.WriteReportReplySchema : null;
				responsePayload = {
					txStatus: 2, // SUCCESS
					txHash: new Uint8Array(32).fill(0xaa),
					errorMessage: ""
				};
			} else if (lastReq.method === 'CallContract') {
				responseSchema = evmPb ? evmPb.CallContractReplySchema : null;
				// Return mock supply (1,000,000 tokens)
				// 1e6 * 1e6 (assuming 6 decimals) = 1e12 = 0xE8D4A51000
				const supplyHex = '000000000000000000000000000000000000000000000000000000e8d4a51000';
				responsePayload = {
					data: new Uint8Array(Buffer.from(supplyHex, 'hex'))
				};
			} else if (lastReq.id === 'consensus@1.0.0-alpha' && lastReq.method === 'Simple') {
				const valuesPb = loadSdkModule('generated/values/v1/values_pb.js');
				responseSchema = valuesPb ? valuesPb.ValueSchema : null;
				responsePayload = {
					value: { case: 'string', value: 'CONSENSUS_SUCCESS' }
				};
			} else if (lastReq.id.includes('http') || lastReq.method === 'Get' || lastReq.method === 'Post') {
				// Generalized HTTP fetch mock for PoR
				// In some versions it uses a dynamic schema, but let's try returning a simple Value
				const valuesPb = loadSdkModule('generated/values/v1/values_pb.js');
				responseSchema = valuesPb ? valuesPb.ValueSchema : null;
				responsePayload = {
					value: { case: 'string', value: JSON.stringify({ totalReserve: 2000000.0 }) }
				};
				console.log('[DEBUG] Mocking HTTP response for PoR...');
			}

			if (responseSchema && responsePayload) {
				console.log(`[DEBUG] Constructing result for ${lastReq.id}.${lastReq.method}`);
				// CRITICAL: create the message instance first
				const msg = create(responseSchema, responsePayload);

				const capResp = create(sdkPb.CapabilityResponseSchema, {
					response: {
						case: 'payload',
						value: anyPack(responseSchema, msg)
					}
				});

				const awaitResp = create(sdkPb.AwaitCapabilitiesResponseSchema, {
					responses: {
						[Number(lastReq.callbackId)]: capResp
					}
				});

				return toBinary(sdkPb.AwaitCapabilitiesResponseSchema, awaitResp);
			}

			console.warn(`[SHIM WARNING] No schema/payload for capability: ${lastReq.id} method: ${lastReq.method}`);
			return new Uint8Array();
		} catch (e: any) {
			console.error('[SHIM ERROR] awaitCapabilities failed:', e.message);
			console.error(e.stack);
			return new Uint8Array();
		}
	};

	// @ts-ignore
	Runner.getRequest = () => {
		console.log('[DEBUG] Runner.getRequest hijacked');
		try {
			const configData = fs.readFileSync('config.json');
			console.log('[DEBUG] config.json read success');
			return {
				config: configData,
				maxResponseSize: 1024 * 1024,
				request: { case: 'trigger', value: { id: "0" } }
			};
		} catch (e: any) {
			console.error(`[SHIM ERROR] Failed to read config.json:`, e.message);
			throw e;
		}
	};

	// @ts-ignore
	Runner.prototype.handleExecutionPhase = async function (req, workflow, runtime) {
		console.log('[DEBUG] handleExecutionPhase hijacked');
		try {
			// Inject Mocks into runtime and cre.capabilities
			if (cre.capabilities.EVMClient && !(cre.capabilities.EVMClient.prototype as any).read) {
				(cre.capabilities.EVMClient.prototype as any).read = function (runtime: any, input: any) {
					console.log('[DEBUG] evmClient.read called, redirection to CallContract');
					return runtime.callCapability({
						capabilityId: this.capabilityId,
						method: 'CallContract',
						payload: input,
					});
				};
			}

			if (runtime && !((runtime as any).fetch)) {
				(runtime as any).fetch = function (input: any) {
					console.log('[DEBUG] runtime.fetch called, redirection to http Get');
					return this.callCapability({
						capabilityId: 'http@1.0.0',
						method: 'Get',
						payload: input
					});
				};
			}

			const payloadRaw = fs.readFileSync('http_trigger_payload.json', 'utf-8');
			const payloadFile = JSON.parse(payloadRaw);
			console.log(`[DEBUG] http_trigger_payload.json read success: ${payloadFile.messageType}`);

			let inputBuffer: Buffer;
			if (payloadFile.input) {
				inputBuffer = Buffer.from(payloadFile.input, 'base64');
			} else {
				inputBuffer = Buffer.from(payloadRaw);
			}

			const decodedPayload = { input: inputBuffer };
			const entry = workflow[0];

			console.log('[DEBUG] Calling entry function (onHTTPTrigger)...');
			const result = await entry.fn(runtime, decodedPayload);
			console.log('[DEBUG] entry function returned');

			if (sdkPb && valuesUtil) {
				const wrapped = valuesUtil.Value.wrap(result);
				return create(sdkPb.ExecutionResultSchema, {
					result: { case: 'value', value: wrapped.proto() },
				});
			} else {
				// Fallback if SDK modules failed to load
				return {
					result: { case: 'value', value: { value: { case: 'string', value: JSON.stringify(result) } } }
				};
			}
		} catch (e: any) {
			const errMsg = String(e);
			console.error(`[SHIM ERROR] Execution phase failed: ${errMsg}`);
			if (sdkPb) {
				return create(sdkPb.ExecutionResultSchema, {
					result: { case: 'error', value: errMsg },
				});
			}
			return { result: { case: 'error', value: errMsg } };
		}
	};
}
// Add type alias to avoid 'cre' namespace issues if necessary
type EVMClient = any; // Simplify for demo to avoid lint/namespace issues

// ========================================
// CONFIG SCHEMA
// ========================================
const configSchema = z.object({
	sepolia: z.object({
		stablecoinAddress: z.string(),
		mintingConsumerAddress: z.string(),
		ccipConsumerAddress: z.string(),
		basketFactoryAddress: z.string().optional(),
		chainSelector: z.string(),
	}),
	fuji: z.object({
		stablecoinAddress: z.string(),
		chainSelector: z.string(),
	}),
	porApiUrl: z.string(),
	decimals: z.number(),
})

type Config = z.infer<typeof configSchema>

// ========================================
// PAYLOAD SCHEMA
// ========================================
const payloadSchema = z.object({
	messageType: z.enum(['MINT', 'CREATE_BASKET']),
	transactionId: z.string(),
	// Minting fields
	beneficiary: z.object({
		account: z.string(),
		name: z.string().optional(),
	}).optional(),
	amount: z.string().optional(),
	currency: z.string().optional(),
	valueDate: z.string().optional(),
	bankReference: z.string().optional(),
	crossChain: z.object({
		enabled: z.boolean(),
		destinationChain: z.string(),
		beneficiary: z.string(),
	}).optional(),
	// Creation fields
	basketName: z.string().optional(),
	basketSymbol: z.string().optional(),
	basketAdmin: z.string().optional(),
})

type Payload = z.infer<typeof payloadSchema>

// ========================================
// CONSTANTS
// ========================================
const INSTRUCTION_MINT = 1
const INSTRUCTION_CREATE = 2

// StablecoinERC20 ABI (minimal)
const StablecoinABI = [
	{
		type: 'function',
		name: 'totalSupply',
		inputs: [],
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
	},
] as const

const BasketFactoryABI = [
	{
		type: 'function',
		name: 'createBasket',
		inputs: [
			{ name: 'name', type: 'string' },
			{ name: 'symbol', type: 'string' },
			{ name: 'admin', type: 'address' },
		],
		outputs: [
			{ name: 'stablecoin', type: 'address' },
			{ name: 'mintingConsumer', type: 'address' },
		],
		stateMutability: 'external',
	},
	{
		type: 'event',
		name: 'BasketCreated',
		inputs: [
			{ indexed: true, name: 'creator', type: 'address' },
			{ indexed: true, name: 'admin', type: 'address' },
			{ indexed: true, name: 'stablecoin', type: 'address' },
			{ indexed: false, name: 'mintingConsumer', type: 'address' },
			{ indexed: false, name: 'name', type: 'string' },
			{ indexed: false, name: 'symbol', type: 'string' },
		],
	},
] as const

// ========================================
// UTILITY FUNCTIONS
// ========================================
const safeJsonStringify = (obj: any): string =>
	JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value), 2)

const stringToBytes32 = (str: string): `0x${string}` => {
	const bytes32 = str.padEnd(32, '\0').slice(0, 32)
	return `0x${Buffer.from(bytes32).toString('hex')}` as `0x${string}`
}

// ========================================
// PROOF OF RESERVE VALIDATION
// ========================================
/**
 * Validates Proof of Reserve before minting
 * Fetches reserve data from API and compares to current total supply + requested mint
 */
const validateProofOfReserve = (
	runtime: Runtime<Config>,
	evmClient: EVMClient,
	config: Config,
	mintAmount: bigint,
): boolean => {
	runtime.log('\n[PoR Validation] Starting Secure Mint check...')

	// 1. Fetch On-Chain Total Supply
	runtime.log(`Fetching current total supply from: ${config.sepolia.stablecoinAddress}`)
	const totalSupplyEncoded = encodeFunctionData({
		abi: StablecoinABI,
		functionName: 'totalSupply',
	})

	const supplyResponse = evmClient.read(runtime, {
		receiver: config.sepolia.stablecoinAddress,
		data: totalSupplyEncoded,
	}).result()

	const currentSupply = decodeFunctionResult({
		abi: StablecoinABI,
		functionName: 'totalSupply',
		data: supplyResponse,
	}) as bigint

	runtime.log(`Current On-Chain Supply: ${currentSupply.toString()} wei`)

	// 2. Fetch Reserve Data from API
	runtime.log(`Fetching reserve data from: ${config.porApiUrl}`)

	let reserveData: { totalReserve: number; lastUpdated: string }

	if (config.porApiUrl.startsWith('file://')) {
		// Mock PoR data for local testing
		reserveData = {
			totalReserve: 1000000.00,  // Sync with mock-bank-api.ts default
			lastUpdated: '2025-10-29T00:00:00Z',
		}
		runtime.log('Using static mock PoR data')
	} else {
		// Fetch from real (or mock server) PoR API in node mode
		// We use Median aggregation on the totalReserve number
		const totalReserve = runtime.runInNodeMode(
			(nodeRuntime: NodeRuntime<Config>) => {
				const httpClient = new cre.capabilities.HTTPClient()
				const response = httpClient.sendRequest(nodeRuntime, {
					url: config.porApiUrl,
					method: 'GET',
				}).result()

				const data = JSON.parse(new TextDecoder().decode(response.body))
				return data.totalReserve as number
			},
			consensusMedianAggregation()
		)().result()

		reserveData = {
			totalReserve,
			lastUpdated: new Date().toISOString() // We can generate a fresh timestamp or fetch separately
		}
	}

	// 3. Scale reserves to wei (e.g., 18 decimals)
	const reservesWei = BigInt(Math.floor(reserveData.totalReserve * (10 ** config.decimals)))

	runtime.log(`Reported Reserves: ${reservesWei.toString()} wei ($${reserveData.totalReserve})`)
	runtime.log(`Projected Supply:  ${(currentSupply + mintAmount).toString()} wei (Current + ${mintAmount})`)

	// 4. THE KILLER FEATURE: Secure Mint Validation
	// Ensure that Reserves >= Current Supply + New Mint
	if (reservesWei < currentSupply + mintAmount) {
		const deficit = currentSupply + mintAmount - reservesWei
		throw new Error(
			`[PoR SECURE MINT FAILED] Insufficient reserves backing. ` +
			`Reserves: ${reserveData.totalReserve} USD. ` +
			`Required: ${(Number(currentSupply + mintAmount) / (10 ** config.decimals)).toFixed(2)} USD. ` +
			`Deficit: ${(Number(deficit) / (10 ** config.decimals)).toFixed(2)} USD.`
		)
	}

	runtime.log(`✓ PoR Secure Mint Passed: Total projected supply is fully backed by reserves.`)
	return true
}

/**
 * Mints stablecoins via ACE-protected consumer
 * ACE automatically checks if beneficiary is blacklisted
 * 
 * @param beneficiary - Address checked by ACE blacklist policy
 * @param mintRecipient - Address that receives the minted tokens
 */
const mintWithACE = (
	runtime: Runtime<Config>,
	evmClient: EVMClient,
	beneficiary: string,
	mintRecipient: string,
	amount: bigint,
	bankRef: string,
): string => {
	runtime.log(`\n[ACE Mint] Minting ${amount} tokens to ${mintRecipient}`)
	runtime.log(`ACE will check: Is beneficiary (${beneficiary}) blacklisted?`)

	// Normalize addresses
	const checksummedBeneficiary = getAddress(beneficiary)
	const checksummedMintRecipient = getAddress(mintRecipient)

	// Convert bankRef to bytes32
	const bankRefHex = stringToBytes32(bankRef)

	// Encode mint report: (instructionType=1, beneficiary, amount, bankRef)
	const reportData = encodeAbiParameters(
		parseAbiParameters('uint8 instructionType, address beneficiary, uint256 amount, bytes32 bankRef'),
		[INSTRUCTION_MINT, checksummedMintRecipient, amount, bankRefHex],
	)

	runtime.log(`Encoded mint report: ${reportData.slice(0, 66)}...`)

	// Generate DON-signed report
	const reportResponse = runtime
		.report({
			encodedPayload: hexToBase64(reportData),
			encoderName: 'evm',
			signingAlgo: 'ecdsa',
			hashingAlgo: 'keccak256',
		})
		.result()

	// Write to MintingConsumerWithACE
	const resp = evmClient
		.writeReport(runtime, {
			receiver: runtime.config.sepolia.mintingConsumerAddress,
			report: reportResponse,
			gasConfig: {
				gasLimit: '500000',
			},
		})
		.result()

	const txStatus = resp.txStatus

	if (txStatus !== TxStatus.SUCCESS) {
		const errorMsg = resp.errorMessage || txStatus

		if (errorMsg.includes('PolicyRunRejected') || errorMsg.includes('blacklisted')) {
			throw new Error(`[ACE REJECTED] Address ${beneficiary} is blacklisted`)
		}

		throw new Error(`Failed to mint: ${errorMsg}`)
	}

	if (resp.errorMessage && (resp.errorMessage.includes('PolicyRunRejected') || resp.errorMessage.includes('blacklisted'))) {
		throw new Error(`[ACE REJECTED] Address ${beneficiary} is blacklisted`)
	}

	const txHash = resp.txHash || new Uint8Array(32)
	const txHashHex = bytesToHex(txHash)

	runtime.log(`⚠️  Mint report delivered: ${txHashHex}`)
	runtime.log(`   ACE policies apply: Blacklist check for beneficiary`)
	runtime.log(`   Verify execution: https://sepolia.etherscan.io/tx/${txHashHex}`)
	return txHashHex
}

// ========================================
// CREATE BASKET
// ========================================
/**
 * Deploys a new basket (Stablecoin + Consumer) via BasketFactory
 */
const createBasket = (
	runtime: Runtime<Config>,
	evmClient: EVMClient,
	name: string,
	symbol: string,
	admin: string,
): { stablecoin: string; consumer: string; txHash: string } => {
	runtime.log(`[DEBUG] createBasket called: ${name}, ${symbol}, ${admin}`)
	const factoryAddress = runtime.config.sepolia.basketFactoryAddress
	if (!factoryAddress) {
		throw new Error('BasketFactory address not configured for Sepolia')
	}
	runtime.log(`[DEBUG] Factory address: ${factoryAddress}`)

	runtime.log(`\n[Factory] Creating basket: ${name} (${symbol}) for admin: ${admin}`)

	const encodedData = encodeFunctionData({
		abi: BasketFactoryABI,
		functionName: 'createBasket',
		args: [name, symbol, getAddress(admin)],
	})

	// Encode the call data as a report payload (simple case: just the calldata)
	const reportData = encodedData
	runtime.log(`[Factory] Report data (calldata): ${reportData}`)

	// Generate a signed report using the consensus capability
	const reportResponse = runtime
		.report({
			encodedPayload: hexToBase64(reportData),
			encoderName: 'evm',
			signingAlgo: 'ecdsa',
			hashingAlgo: 'keccak256',
		})
		.result()

	// Submit the report to the BasketFactory
	const writeReportResult = evmClient
		.writeReport(runtime, {
			receiver: factoryAddress,
			report: reportResponse,
			gasConfig: {
				gasLimit: '5000000',
			},
		})
		.result()

	runtime.log(`[Factory] writeReport response: ${JSON.stringify({
		txStatus: writeReportResult.txStatus,
		errorMessage: writeReportResult.errorMessage,
		txHash: writeReportResult.txHash ? bytesToHex(writeReportResult.txHash) : undefined
	})}`)

	if (writeReportResult.txStatus !== TxStatus.SUCCESS) {
		throw new Error(`Failed to create basket: ${writeReportResult.errorMessage || writeReportResult.txStatus}`)
	}

	const txHashHex = bytesToHex(writeReportResult.txHash || new Uint8Array(32))
	runtime.log(`⚠️  Basket creation TX: ${txHashHex}`)

	// In a real CRE, we would decode the logs to get the addresses.
	// For this demo, we'll assume the addresses are returned in the output or we log them.
	// NOTE: Deciphering logs in CRE SDK might require more plumbing, 
	// but for the demo we'll return the hash and expect the backend to parse if needed,
	// or we can simulate address generation if the SDK doesn't expose receipt logs easily.

	return {
		stablecoin: '0x...', // Simplified: Actual implementation would parse logs
		consumer: '0x...',
		txHash: txHashHex
	}
}

// ========================================
// CCIP TRANSFER WITH ACE
// ========================================
/**
 * Executes cross-chain transfer via ACE-protected CCIP consumer
 * ACE automatically checks if beneficiary is blacklisted
 * Note: We use "beneficiary" for consistency with minting operations (who receives tokens)
 */
const transferWithACE = (
	runtime: Runtime<Config>,
	evmClient: EVMClient,
	sender: string,
	beneficiary: string,
	amount: bigint,
	bankRef: string,
): string => {
	runtime.log(`\n[ACE CCIP] Transferring ${amount} tokens to ${beneficiary} on Fuji`)
	runtime.log('ACE will check: Is beneficiary blacklisted?')

	// Normalize addresses
	const checksummedSender = getAddress(sender)
	const checksummedBeneficiary = getAddress(beneficiary)

	// Get destination chain selector
	const destChainSelector = BigInt(runtime.config.fuji.chainSelector)

	// Convert bankRef to bytes32
	const bankRefHex = stringToBytes32(bankRef)

	// Encode CCIP report: (destChainSelector, sender, beneficiary, amount, bankRef)
	const reportData = encodeAbiParameters(
		parseAbiParameters('uint64 destinationChainSelector, address sender, address beneficiary, uint256 amount, bytes32 bankRef'),
		[destChainSelector, checksummedSender, checksummedBeneficiary, amount, bankRefHex],
	)

	runtime.log(`Encoded CCIP report: ${reportData.slice(0, 66)}...`)

	// Generate DON-signed report
	const reportResponse = runtime
		.report({
			encodedPayload: hexToBase64(reportData),
			encoderName: 'evm',
			signingAlgo: 'ecdsa',
			hashingAlgo: 'keccak256',
		})
		.result()

	// Write to CCIPTransferConsumerWithACE
	// ACE Policy Check happens here via runPolicy modifier:
	//   1. PolicyEngine calls CCIPTransferConsumerExtractor
	//   2. Extractor returns [beneficiary, sender, amount]
	//   3. PolicyEngine runs AddressBlacklistPolicy
	//   4. If blacklisted → reverts with PolicyRunRejected
	//   5. If allowed → CCIP transfer proceeds
	const resp = evmClient
		.writeReport(runtime, {
			receiver: runtime.config.sepolia.ccipConsumerAddress,
			report: reportResponse,
			gasConfig: {
				gasLimit: '1000000',
			},
		})
		.result()

	const txStatus = resp.txStatus

	if (txStatus !== TxStatus.SUCCESS) {
		const errorMsg = resp.errorMessage || txStatus

		// Check if it's a PolicyRunRejected error
		if (errorMsg.includes('PolicyRunRejected') || errorMsg.includes('blacklisted')) {
			throw new Error(`[ACE REJECTED] Beneficiary ${beneficiary} is blacklisted`)
		}

		throw new Error(`Failed to initiate CCIP transfer: ${errorMsg}`)
	}

	const txHash = resp.txHash || new Uint8Array(32)
	const txHashHex = bytesToHex(txHash)

	runtime.log(`⚠️  CCIP report delivered: ${txHashHex}`)
	runtime.log(`   ACE policies apply: VolumePolicy check (100-10,000 creUSD)`)
	runtime.log(`   Verify execution: https://sepolia.etherscan.io/tx/${txHashHex}`)
	return txHashHex
}

// ========================================
// HTTP TRIGGER HANDLER
// ========================================
const onHTTPTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): object => {
	runtime.log('=== Phase 3: PoR + ACE + CCIP Workflow ===')
	runtime.log(`[DEBUG] HTTP trigger received`)

	// Require payload
	if (!payload.input || payload.input.length === 0) {
		throw new Error('HTTP trigger payload is required')
	}

	runtime.log(`Payload: ${payload.input.toString()}`)

	try {
		// Parse MT103 bank message
		const payloadJson = JSON.parse(payload.input.toString())
		const parsedPayload = payloadSchema.parse(payloadJson)

		runtime.log(`[DEBUG] Parsed payload messageType: ${parsedPayload.messageType}`)
		runtime.log(`Parsed MT103 payload: ${safeJsonStringify(parsedPayload)}`)
		runtime.log(`Message Type: ${parsedPayload.messageType}`)
		runtime.log(`Transaction ID: ${parsedPayload.transactionId}`)
		if (parsedPayload.beneficiary) {
			runtime.log(`Beneficiary: ${parsedPayload.beneficiary.account}`)
		}
		if (parsedPayload.amount && parsedPayload.currency) {
			runtime.log(`Amount: ${parsedPayload.amount} ${parsedPayload.currency}`)
		}

		// Initialize EVM client for Sepolia
		const network = getNetwork({
			chainFamily: 'evm',
			chainSelectorName: 'ethereum-testnet-sepolia',
			isTestnet: true,
		})

		if (!network) {
			throw new Error('Sepolia network not found')
		}

		const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector)

		if (parsedPayload.messageType === 'CREATE_BASKET') {
			runtime.log(`[DEBUG] MATCHED CREATE_BASKET branch`)
			runtime.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
			runtime.log('ACTION: CREATE BASKET')
			runtime.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
			runtime.log(`[DEBUG] Entering CREATE_BASKET branch`)

			const { basketName, basketSymbol, basketAdmin } = parsedPayload
			if (!basketName || !basketSymbol || !basketAdmin) {
				throw new Error('Missing basket creation parameters')
			}
			runtime.log(`[DEBUG] Params OK: ${basketName}, ${basketSymbol}, ${basketAdmin}`)

			const result = createBasket(runtime, evmClient, basketName, basketSymbol, basketAdmin)
			runtime.log(`CREATE_BASKET_TX: ${result.txHash}`)
			runtime.log(`CREATE_BASKET_RESULT: ${JSON.stringify(result)}`)
			return {
				success: true,
				messageType: 'CREATE_BASKET',
				transactionId: parsedPayload.transactionId,
				txHash: result.txHash,
				// Backend will parse these from logs if needed, 
				// or we can use the deterministic nature if we had a salt
				etherscan: `https://sepolia.etherscan.io/tx/${result.txHash}`
			}
		}

		// MINT Logic
		if (!parsedPayload.beneficiary || !parsedPayload.amount || !parsedPayload.currency || !parsedPayload.bankReference) {
			throw new Error('Missing minting parameters')
		}

		// Convert amount to wei
		const amountWei = BigInt(parseFloat(parsedPayload.amount) * (10 ** runtime.config.decimals))
		const beneficiary = parsedPayload.beneficiary.account
		const hasCrossChain = parsedPayload.crossChain?.enabled === true

		// ========================================
		// STEP 1: Proof of Reserve Validation
		// ========================================
		runtime.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		runtime.log('STEP 1: Proof of Reserve Validation')
		runtime.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

		try {
			validateProofOfReserve(runtime, evmClient, runtime.config, amountWei)
		} catch (error: any) {
			runtime.log(`❌ PoR validation failed: ${error.message}`)
			return {
				success: false,
				error: 'POR_INSUFFICIENT_RESERVES',
				message: error.message,
				transactionId: parsedPayload.transactionId,
			}
		}

		// ========================================
		// STEP 2: Mint with ACE
		// ========================================
		runtime.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		runtime.log('STEP 2: Mint with ACE Policy Enforcement')
		runtime.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

		// Determine mint destination:
		// - If CCIP enabled: mint to CCIP consumer (tokens staged for cross-chain transfer)
		// - If CCIP disabled: mint to beneficiary (final destination)
		const mintRecipient = hasCrossChain
			? runtime.config.sepolia.ccipConsumerAddress
			: beneficiary

		runtime.log(`Mint destination: ${hasCrossChain ? 'CCIP Consumer (for cross-chain)' : 'Beneficiary (final)'}`)
		runtime.log(`Mint recipient: ${mintRecipient}`)

		let mintTxHash: string
		try {
			mintTxHash = mintWithACE(
				runtime,
				evmClient,
				beneficiary, // ACE checks this for blacklist
				mintRecipient, // Tokens minted here
				amountWei,
				parsedPayload.bankReference,
			)
		} catch (error: any) {
			runtime.log(`❌ Mint failed: ${error.message}`)
			return {
				success: false,
				error: error.message.includes('ACE REJECTED') ? 'ACE_POLICY_REJECTED' : 'MINT_FAILED',
				message: error.message,
				beneficiary: beneficiary,
				transactionId: parsedPayload.transactionId,
			}
		}

		// ========================================
		// STEP 3: Optional CCIP Transfer with ACE
		// ========================================
		let ccipTxHash: string | null = null

		if (hasCrossChain) {
			runtime.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
			runtime.log('STEP 3: CCIP Transfer with ACE Policy Enforcement')
			runtime.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

			const ccipBeneficiary = parsedPayload.crossChain!.beneficiary

			try {
				// Sender is the CCIP consumer (where tokens were minted)
				// Beneficiary is the end user on destination chain
				ccipTxHash = transferWithACE(
					runtime,
					evmClient,
					mintRecipient, // sender (CCIPConsumer - tokens were minted here)
					ccipBeneficiary, // who receives on destination chain
					amountWei,
					parsedPayload.bankReference,
				)
			} catch (error: any) {
				runtime.log(`❌ CCIP transfer failed: ${error.message}`)
				return {
					success: false,
					error: error.message.includes('ACE REJECTED') ? 'ACE_POLICY_REJECTED_CCIP' : 'CCIP_FAILED',
					message: error.message,
					mintTransaction: mintTxHash, // Mint succeeded but CCIP failed
					beneficiary: ccipBeneficiary,
					transactionId: parsedPayload.transactionId,
				}
			}
		} else {
			runtime.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
			runtime.log('STEP 3: CCIP Transfer - SKIPPED')
			runtime.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
			runtime.log('No cross-chain transfer requested')
		}

		// ========================================
		// REPORT DELIVERY RESPONSE
		// ========================================
		// Build result object (conditionally include CCIP fields to avoid null values)
		const result: any = {
			reportDelivered: true,
			transactionId: parsedPayload.transactionId,
			beneficiary: beneficiary,
			amount: parsedPayload.amount,
			currency: parsedPayload.currency,
			mintTransaction: mintTxHash,
			message: hasCrossChain
				? `Reports delivered: Mint + CCIP transfer to ${parsedPayload.crossChain!.destinationChain} (verify on-chain)`
				: `Report delivered: Mint ${parsedPayload.amount} ${parsedPayload.currency} to ${beneficiary} (verify on-chain)`,
			etherscanMint: `https://sepolia.etherscan.io/tx/${mintTxHash}`,
			verificationNote: 'ACE policies may block execution. Verify balance and events on-chain.',
		}

		// Only add CCIP fields if CCIP transfer was executed
		if (ccipTxHash) {
			result.ccipTransaction = ccipTxHash
			result.etherscanCCIP = `https://sepolia.etherscan.io/tx/${ccipTxHash}`
			result.ccipExplorer = `https://ccip.chain.link`
		}

		runtime.log(`\n⚠️  REPORTS DELIVERED TO CONSUMERS`)
		runtime.log(`   ACE policies applied during execution`)
		runtime.log(`   Verify on-chain to confirm actual results`)
		runtime.log(`\nResult: ${safeJsonStringify(result)}`)

		return result

	} catch (error: any) {
		runtime.log(`❌ Workflow error: ${error.message}`)
		throw error
	}
}

// ========================================
// WORKFLOW INITIALIZATION
// ========================================
const initWorkflow = (config: Config) => {
	const httpTrigger = new cre.capabilities.HTTPCapability()

	return [
		cre.handler(httpTrigger.trigger({}), onHTTPTrigger),
	]
}

export async function main() {
	const runner = await Runner.newRunner<Config>({
		configSchema,
	})
	await runner.run(initWorkflow)
}

main()
	.then(() => {
		console.log('[DEBUG] Workflow execution completed successfully');
		process.exit(0);
	})
	.catch((err) => {
		console.error('[DEBUG] Workflow execution failed:', err);
		process.exit(1);
	});
