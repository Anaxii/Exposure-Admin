pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDC is ERC20 {
    constructor() ERC20("USDC", "USDC"){}

    function mint(address user, uint256 amount) public {
        _mint(user, amount);
    }
}
