import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TokenVesting } from "../../../target/types/token_vesting";

export const getDashboardStats = async (
  program: Program<TokenVesting>,
  owner: PublicKey,
  orgId: BN
) => {
  try {
    const [organizationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    return await program.methods
      .getDashboardStats()
      .accounts({
          organization: organizationPda,
          owner,
      })
      .view();
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return null;
  }
};

export const getEmployeeDashboard = async (
  program: Program<TokenVesting>,
  employee: PublicKey,
  orgId: BN
) => {
  try {
    const [organizationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [employeePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("employee"), employee.toBuffer(), orgId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    return await program.methods
      .getEmployeeDashboard()
      .accountsPartial({
        employee: employeePda,
      })
      .view();
  } catch (error) {
    console.error("Error getting employee dashboard:", error);
    return null;
  }
};