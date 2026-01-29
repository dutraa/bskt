// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {StablecoinERC20} from "./StablecoinERC20.sol";
import {MintingConsumerWithACE} from "./MintingConsumerWithACE.sol";

/**
 * @title BasketFactory
 * @notice Deploys Stablecoin + ACE Minting Consumer, wires roles, and hands stablecoin admin to caller/admin.
 */
contract BasketFactory {
    address public immutable policyEngine;

    event BasketCreated(
        address indexed creator,
        address indexed admin,
        address indexed stablecoin,
        address mintingConsumer,
        string name,
        string symbol
    );

    constructor(address _policyEngine) {
        policyEngine = _policyEngine;
    }

    /**
     * @notice Create a new Basket stablecoin instance.
     * @param name Token name
     * @param symbol Token symbol
     * @param admin Who should own/admin the stablecoin after setup (EOA now; DAO/multisig later)
     */
    function createBasket(
        string memory name,
        string memory symbol,
        address admin
    ) external returns (address stablecoin, address mintingConsumer) {
        require(admin != address(0), "admin=0");

        // 1) Deploy stablecoin owned by FACTORY so we can wire roles
        StablecoinERC20 sc = new StablecoinERC20(name, symbol, address(this));

        // 2) Deploy MintingConsumerWithACE behind ERC1967Proxy
        //    Owner of consumer = admin (so admin can manage policies later)
        MintingConsumerWithACE impl = new MintingConsumerWithACE();

        bytes memory initData = abi.encodeWithSelector(
            MintingConsumerWithACE.initialize.selector,
            admin,              // initialOwner (who can manage ACE policies)
            address(sc),        // stablecoin
            policyEngine,       // policyEngine
            address(0),         // expectedAuthor (0 for demo)
            bytes10("dummy")    // expectedWorkflowName (dummy for demo)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        MintingConsumerWithACE consumer = MintingConsumerWithACE(address(proxy));

        // 3) Wire mint/burn permissions
        sc.grantMintRole(address(consumer));
        sc.grantBurnRole(address(consumer));

        // 4) Hand stablecoin ownership to admin
        sc.transferOwnership(admin);

        emit BasketCreated(msg.sender, admin, address(sc), address(consumer), name, symbol);

        return (address(sc), address(consumer));
    }
}
