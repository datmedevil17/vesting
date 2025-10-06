import { BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const getTokenBalance = async (
  connection: Connection,
  tokenMint: PublicKey,
  owner: PublicKey
): Promise<BN> => {
  try {
    const tokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      owner,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return new BN(balance.value.amount);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return new BN(0);
  }
};