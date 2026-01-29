// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {BasketFactory} from "../src/BasketFactory.sol";

contract DeployBasketFactory is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address policyEngine = vm.envAddress("POLICY_ENGINE");

        console.log("=== DeployBasketFactory ===");
        console.log("Deployer:    ", deployer);
        console.log("PolicyEngine:", policyEngine);

        vm.startBroadcast(pk);
        BasketFactory factory = new BasketFactory(policyEngine);
        vm.stopBroadcast();

        console.log("BasketFactory deployed at:", address(factory));
    }
}
