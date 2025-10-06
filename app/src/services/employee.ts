import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionSignature } from "@solana/web3.js";
import { TokenVesting } from "../../../target/types/token_vesting";

export const joinOrganization = async (
  program: Program<TokenVesting>,
  employeeSigner: PublicKey,
  orgId: BN,
  employeeName: string,
  employeePosition: string
): Promise<TransactionSignature> => {
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );
  
  const [organizationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  
  const [employeePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("employee"), employeeSigner.toBuffer(), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  
  const tx = await program.methods
    .joinOrganization(orgId, employeeName, employeePosition)
    .accountsPartial({
      programState: programStatePda,
      organization: organizationPda,
      employee: employeePda,
      employeeSigner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  await program.provider.connection.confirmTransaction(tx, "finalized");
  return tx;
};

export const fetchOrganizationEmployees = async (
  program: Program<TokenVesting>,
  orgId: BN
) => {
  try {
    // Fetch all employee accounts and filter by organization ID
    const allEmployees = await program.account.employee.all();
    return allEmployees.filter(
      (employee) => employee.account.orgId.eq(orgId)
    );
  } catch (error) {
    console.error("Error fetching organization employees:", error);
    return [];
  }
};

export const fetchAllEmployees = async (program: Program<TokenVesting>) => {
  try {
    return await program.account.employee.all();
  } catch (error) {
    console.error("Error fetching all employees:", error);
    return [];
  }
};

export const fetchEmployee = async (
  program: Program<TokenVesting>,
  employeePublicKey: PublicKey,
  orgId: BN
) => {
  try {
    const [employeePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("employee"), employeePublicKey.toBuffer(), orgId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    return await program.account.employee.fetch(employeePda);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return null;
  }
};

export const removeEmployee = async (
  program: Program<TokenVesting>,
  owner: PublicKey,
  orgId: BN,
  employee: PublicKey
): Promise<TransactionSignature> => {
  const [organizationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [employeePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("employee"), employee.toBuffer(), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const tx = await program.methods
    .removeEmployeeFromOrg(orgId)
    .accountsPartial({
      organization: organizationPda,
      employee: employeePda,
      owner,
    })
    .rpc();

  await program.provider.connection.confirmTransaction(tx, "finalized");
  return tx;
};

export const isEmployeeOfOrganization = async (
  program: Program<TokenVesting>,
  userPublicKey: PublicKey,
  orgId: BN
): Promise<boolean> => {
  try {
    const employee = await fetchEmployee(program, userPublicKey, orgId);
    return employee !== null;
  } catch (error) {
    return false;
  }
};