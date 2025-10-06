import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionSignature } from "@solana/web3.js";
import { TokenVesting } from "../../../target/types/token_vesting";

export const initializeProgram = async (
  program: Program<TokenVesting>,
  admin: PublicKey
): Promise<TransactionSignature> => {
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );
  const tx = await program.methods
    .initializeProgram()
    .accountsPartial({
      programState: programStatePda,
      admin,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  await program.provider.connection.confirmTransaction(tx, "finalized");
  return tx;
};

export const fetchProgramState = async (program: Program<TokenVesting>) => {
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );
  
  try {
    return await program.account.programState.fetch(programStatePda);
  } catch (error) {
    console.error("Error fetching program state:", error);
    return null;
  }
};