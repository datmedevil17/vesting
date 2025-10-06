import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionSignature } from "@solana/web3.js";
import { TokenVesting } from "../../../target/types/token_vesting";

export const createOrganization = async (
  program: Program<TokenVesting>,
  owner: PublicKey,
  name: string
): Promise<TransactionSignature> => {
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );
  
  // Fetch program state to get the next organization ID
  const programState = await program.account.programState.fetch(programStatePda);
  const orgId = new BN(programState.totalOrganizations).add(new BN(1));
  
  const [organizationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  
  const tx = await program.methods
    .createOrganization(name)
    .accountsPartial({
      organization: organizationPda,
      owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  await program.provider.connection.confirmTransaction(tx, "finalized");
  return tx;
};

export const fetchAllOrganizations = async (
  program: Program<TokenVesting>
) => {
  try {
    return await program.account.organization.all();
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
};

export const fetchOrganization = async (
  program: Program<TokenVesting>,
  orgId: BN
) => {
  try {
    const [organizationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    return await program.account.organization.fetch(organizationPda);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
};

export const isOrganizationOwner = async (
  program: Program<TokenVesting>,
  userPublicKey: PublicKey,
  orgId: BN
): Promise<boolean> => {
  try {
    const organization = await fetchOrganization(program, orgId);
    return organization?.owner.equals(userPublicKey) || false;
  } catch (error) {
    return false;
  }
};