import { ethers } from "ethers";

export const ERC20_INTERFACE = new ethers.Interface([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
]);

export const ERC20_TRANSFER_TOPIC = ethers.id(
  "Transfer(address,address,uint256)",
);
export const ERC20_APPROVAL_TOPIC = ethers.id(
  "Approval(address,address,uint256)",
);
