# Balance, then a simulated transfer

User: How much ETH does `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` have, and what would sending 0.01 ETH to `0x000000000000000000000000000000000000dEaD` look like?

1. `eth_chainId` and `eth_getBalance` for that address.
2. `simulate_native_transfer` for 0.01 ETH to the burn address. Do not call `eth_sendRawTransaction`.
3. Report the balance, the network, and whether the simulation succeeded, including gas if the tool returned it.
