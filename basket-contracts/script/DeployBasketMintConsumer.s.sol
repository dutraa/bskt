// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MintingConsumerWithACE} from "../src/MintingConsumerWithACE.sol";
import {StablecoinERC20} from "../src/StablecoinERC20.sol";

contract DeployBasketMintConsumer is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address policyEngine = vm.envAddress("POLICY_ENGINE");
        address stablecoin  = vm.envAddress("BASKET_SC");

        console.log("=== DeployBasketMintConsumer ===");
        console.log("Deployer:     ", deployer);
        console.log("PolicyEngine: ", policyEngine);
        console.log("Stablecoin:   ", stablecoin);

        vm.startBroadcast(pk);

        // 1) Deploy implementation
        MintingConsumerWithACE impl = new MintingConsumerWithACE();
        console.log("MintingConsumer impl:  ", address(impl));

        // 2) Initialize via proxy
        bytes memory initData = abi.encodeWithSelector(
            MintingConsumerWithACE.initialize.selector,
            deployer,                // initialOwner
            stablecoin,              // stablecoin (YOUR BASKET TOKEN)
            policyEngine,            // policy engine
            address(0),              // expectedAuthor (0 for demo)
            bytes10("dummy")         // expectedWorkflowName
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        address consumer = address(proxy);

        console.log("MintingConsumer proxy: ", consumer);

        // 3) Grant roles on the stablecoin to the consumer
        StablecoinERC20(stablecoin).grantMintRole(consumer);
        StablecoinERC20(stablecoin).grantBurnRole(consumer);

        vm.stopBroadcast();

        console.log("DONE.");
        console.log("Update workflow config.json mintingConsumerAddress to:");
        console.log(consumer);
    }
}
