import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface WorkflowRequest {
    messageType: 'MINT' | 'CREATE_BASKET';
    transactionId: string;
    // Mint fields
    beneficiary?: {
        account: string;
    };
    amount?: string;
    currency?: string;
    bankReference?: string;
    stablecoinAddress?: string;
    mintingConsumerAddress?: string;
    // Create fields
    basketName?: string;
    basketSymbol?: string;
    basketAdmin?: string;
}

interface WorkflowResult {
    success: boolean;
    txHash?: string;
    error?: string;
    output?: string;
}

const getWorkflowDir = () => {
    // Current file is in src/, project root is three levels up
    const relativeToSrc = path.resolve(__dirname, '../../bank-stablecoin-por-ace-ccip-workflow');
    const relativeToRoot = path.resolve(process.cwd(), 'bank-stablecoin-por-ace-ccip-workflow');
    const relativeToBackend = path.resolve(process.cwd(), '../bank-stablecoin-por-ace-ccip-workflow');

    try {
        if (require('fs').existsSync(relativeToSrc)) return relativeToSrc;
        if (require('fs').existsSync(relativeToRoot)) return relativeToRoot;
        if (require('fs').existsSync(relativeToBackend)) return relativeToBackend;
    } catch (e) { }

    return relativeToSrc; // Fallback
};

const WORKFLOW_DIR = process.env.WORKFLOW_DIR
    ? path.isAbsolute(process.env.WORKFLOW_DIR)
        ? process.env.WORKFLOW_DIR
        : path.resolve(process.cwd(), process.env.WORKFLOW_DIR)
    : getWorkflowDir();

/**
 * Updates the workflow config.json with the provided metadata if needed
 */
async function updateWorkflowConfig(request: WorkflowRequest): Promise<void> {
    const configPath = path.join(WORKFLOW_DIR, 'config.json');

    try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        let updated = false;

        if (request.stablecoinAddress) {
            config.stablecoinAddress = request.stablecoinAddress;
            updated = true;
        }
        if (request.mintingConsumerAddress) {
            config.mintingConsumerAddress = request.mintingConsumerAddress;
            updated = true;
        }

        if (updated) {
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            console.log(`[CONFIG] Updated workflow config with addresses`);
        }
    } catch (error) {
        throw new Error(`Failed to update workflow config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Updates the HTTP trigger payload
 */
async function updateTriggerPayload(request: WorkflowRequest): Promise<void> {
    const payloadPath = path.join(WORKFLOW_DIR, 'http_trigger_payload.json');

    try {
        // We'll just overwrite the whole payload for simplicity and reliability
        const payload = {
            messageType: request.messageType,
            transactionId: request.transactionId,
            beneficiary: request.beneficiary,
            amount: request.amount,
            currency: request.currency || 'USD',
            bankReference: request.bankReference || `ref-${Date.now()}`,
            basketName: request.basketName,
            basketSymbol: request.basketSymbol,
            basketAdmin: request.basketAdmin
        };

        await fs.writeFile(payloadPath, JSON.stringify(payload, null, 2));
        console.log(`[PAYLOAD] Updated trigger payload for ${request.messageType}`);
    } catch (error) {
        throw new Error(`Failed to update trigger payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Executes the CRE workflow and extracts the transaction hash
 */
async function executeWorkflow(): Promise<{ txHash: string, output: string }> {
    try {
        console.log(`[WORKFLOW] Executing CRE workflow in ${WORKFLOW_DIR}`);

        const bunCmd = process.env.BUN_PATH || 'bun';

        return new Promise((resolve, reject) => {
            console.log(`[WORKFLOW] Running: ${bunCmd} run main.ts`);
            const child = spawn(bunCmd, ['run', 'main.ts'], {
                cwd: WORKFLOW_DIR,
                env: process.env
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stdout += chunk;
                process.stdout.write(`[WORKFLOW STDOUT] ${chunk}`);
            });

            child.stderr.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stderr += chunk;
                process.stderr.write(`[WORKFLOW STDERR] ${chunk}`);
            });

            child.on('close', (code: number) => {
                if (code !== 0) {
                    reject(new Error(`Workflow process exited with code ${code}\n${stderr}`));
                    return;
                }

                // Extract transaction hash from output
                // Support both CREATE_BASKET and MINT flow prefixes
                let txHash = '';
                const txMatch = stdout.match(/(?:CREATE_BASKET_TX|Mint report delivered|CCIP report delivered):\s*(0x[a-fA-F0-9]{64})/i);
                if (txMatch) {
                    txHash = txMatch[1];
                }

                if (!txHash) {
                    console.error(`[WORKFLOW] Full stdout for debugging:\n${stdout}`);
                    reject(new Error(`Transaction hash not found in workflow output. Output: ${stdout.slice(0, 5000)}...`));
                    return;
                }

                resolve({ txHash, output: stdout });
            });

            child.on('error', (err: Error) => {
                reject(err);
            });
        });
    } catch (error) {
        throw new Error(`Workflow execution setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Main entry point to run the workflow
 */
export async function runWorkflow(request: WorkflowRequest): Promise<WorkflowResult> {
    try {
        console.log(`[RUNNER] Starting ${request.messageType} flow...`);

        // Step 1: Update workflow config (mostly for MINT to point to correct contracts)
        await updateWorkflowConfig(request);

        // Step 2: Update trigger payload
        await updateTriggerPayload(request);

        // Step 3: Execute the workflow
        const { txHash, output } = await executeWorkflow();

        return {
            success: true,
            txHash,
            output
        };
    } catch (error) {
        console.error('[RUNNER ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
