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

        bool doCreate = false;
        string memory basketName;
        string memory basketSymbol;
        address basketAdmin;

        try vm.envString("BASKET_NAME") returns (string memory v) {
            basketName = v;
            doCreate = true;
        } catch {}
        try vm.envString("BASKET_SYMBOL") returns (string memory v) {
            basketSymbol = v;
            doCreate = true;
        } catch {}
        try vm.envAddress("BASKET_ADMIN") returns (address v) {
            basketAdmin = v;
            doCreate = true;
        } catch {}

        console.log("=== DeployBasketFactory ===");
        console.log("Deployer:    ", deployer);
        console.log("PolicyEngine:", policyEngine);

        vm.startBroadcast(pk);
        BasketFactory factory = new BasketFactory(policyEngine);

        if (doCreate) {
            console.log("=== Create Basket ===");
            console.log("Name:  ", basketName);
            console.log("Symbol:", basketSymbol);
            console.log("Admin: ", basketAdmin);
            (address stablecoin, address mintingConsumer) = factory.createBasket(basketName, basketSymbol, basketAdmin);
            console.log("Stablecoin deployed at:     ", stablecoin);
            console.log("MintingConsumer deployed at:", mintingConsumer);
        }

        vm.stopBroadcast();

        console.log("BasketFactory deployed at:", address(factory));
    }
}
