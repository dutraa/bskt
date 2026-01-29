import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface MintRequest {
    beneficiary: string;
    amount: string;
    stablecoinAddress: string;
    mintingConsumerAddress: string;
}

interface WorkflowResult {
    success: boolean;
    mintTx?: string;
    error?: string;
}

const WORKFLOW_DIR = process.env.WORKFLOW_DIR || '../bank-stablecoin-por-ace-ccip-workflow';

/**
 * Updates the workflow config.json with the provided addresses
 */
async function updateWorkflowConfig(request: MintRequest): Promise<void> {
    const configPath = path.join(WORKFLOW_DIR, 'config.json');

    try {
        // Read existing config
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        // Update addresses
        config.stablecoinAddress = request.stablecoinAddress;
        config.mintingConsumerAddress = request.mintingConsumerAddress;

        // Write back to file
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(`[CONFIG] Updated workflow config with new addresses`);
    } catch (error) {
        throw new Error(`Failed to update workflow config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Updates the HTTP trigger payload with beneficiary and amount
 */
async function updateTriggerPayload(request: MintRequest): Promise<void> {
    const payloadPath = path.join(WORKFLOW_DIR, 'http_trigger_payload.json');

    try {
        // Read existing payload
        const payloadContent = await fs.readFile(payloadPath, 'utf-8');
        const payload = JSON.parse(payloadContent);

        // Update beneficiary and amount
        if (payload.bankMessage) {
            payload.bankMessage.beneficiary = request.beneficiary;
            payload.bankMessage.amount = request.amount;
        }

        // Write back to file
        await fs.writeFile(payloadPath, JSON.stringify(payload, null, 2));
        console.log(`[PAYLOAD] Updated trigger payload with beneficiary and amount`);
    } catch (error) {
        throw new Error(`Failed to update trigger payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Executes the CRE workflow and extracts the transaction hash
 */
async function executeWorkflow(): Promise<string> {
    try {
        console.log(`[WORKFLOW] Executing CRE workflow in ${WORKFLOW_DIR}`);

        // Change to workflow directory and run the workflow
        // This assumes you have a script or command to run the workflow
        // Adjust the command based on your actual workflow execution method
        // Using absolute path to bun to avoid PATH issues in WSL/subprocesses
        const command = `cd ${WORKFLOW_DIR} && /home/shirosuke/.bun/bin/bun run main.ts`;

        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        console.log(`[WORKFLOW] Output: ${stdout}`);
        if (stderr) {
            console.warn(`[WORKFLOW] Stderr: ${stderr}`);
        }

        // Extract transaction hash from output
        // This regex pattern may need adjustment based on actual output format
        const txHashMatch = stdout.match(/0x[a-fA-F0-9]{64}/);

        if (txHashMatch) {
            return txHashMatch[0];
        } else {
            throw new Error('Transaction hash not found in workflow output');
        }
    } catch (error) {
        throw new Error(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Main function to run the workflow with the provided mint request
 */
export async function runWorkflow(request: MintRequest): Promise<WorkflowResult> {
    try {
        // Step 1: Update workflow config with addresses
        await updateWorkflowConfig(request);

        // Step 2: Update trigger payload with beneficiary and amount
        await updateTriggerPayload(request);

        // Step 3: Execute the workflow
        const mintTx = await executeWorkflow();

        return {
            success: true,
            mintTx
        };
    } catch (error) {
        console.error('[WORKFLOW ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
