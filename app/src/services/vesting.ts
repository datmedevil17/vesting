import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionSignature } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenVesting } from "../../../target/types/token_vesting";

export const initializeVestingSchedule = async (
  program: Program<TokenVesting>,
  employer: PublicKey,
  orgId: BN,
  employee: PublicKey,
  tokenMint: PublicKey,
  totalAmount: BN,
  startTime: BN,
  cliffTime: BN,
  endTime: BN,
  revocable: boolean
): Promise<TransactionSignature> => {
  const connection = program.provider.connection;

  // 1. Program state PDA
  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );

  // 2. Organization PDA
  const [organizationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  // 3. Employee PDA
  const [employeePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("employee"), employee.toBuffer(), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  // 4. Fetch program state to get next schedule ID
  const programState = await program.account.programState.fetch(programStatePda);
  const scheduleId = new BN(programState.totalVestingSchedules).add(new BN(1));

  // 5. Vesting schedule PDA
  const [vestingSchedulePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vesting_schedule"),
      orgId.toArrayLike(Buffer, "le", 8),
      employee.toBuffer(),
      tokenMint.toBuffer(),
      scheduleId.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  // 6. Vesting token account (ATA for the vesting schedule PDA)
  const vestingTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    vestingSchedulePda,
    true, // PDA is off-curve
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // 7. Employer token account (must exist and have enough tokens)
  const employerTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    employer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const employerBalance = await connection.getTokenAccountBalance(employerTokenAccount);
  if (new BN(employerBalance.value.amount).lt(totalAmount)) {
    throw new Error("Employer has insufficient token balance");
  }

  // 8. Send transaction
  const tx = await program.methods
    .initializeVestingSchedule(
      orgId,
      totalAmount,
      startTime,
      cliffTime,
      endTime,
      revocable
    )
    .accountsPartial({
      programState: programStatePda,
      organization: organizationPda,
      employee: employeePda,
      vestingSchedule: vestingSchedulePda,
      vestingTokenAccount,
      employerTokenAccount,
      tokenMint,
      employer,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
    })
    .rpc();

  await connection.confirmTransaction(tx, "finalized");
  console.log("Vesting schedule initialized:", tx);
  return tx;
};

export const fetchEmployeeVestingSchedules = async (
  program: Program<TokenVesting>,
  orgId: BN,
  employee: PublicKey
) => {
  try {
    // Fetch all vesting schedules and filter by orgId and employee
    const allSchedules = await program.account.vestingSchedule.all();
    return allSchedules.filter(
      (item) =>
        item.account.orgId.eq(orgId) &&
        item.account.employee.equals(employee)
    );
  } catch (error) {
    console.error("Error fetching vesting schedules:", error);
    return [];
  }
};

export const fetchAllVestingSchedules = async (program: Program<TokenVesting>) => {
  try {
    return await program.account.vestingSchedule.all();
  } catch (error) {
    console.error("Error fetching all vesting schedules:", error);
    return [];
  }
};

export const fetchVestingSchedule = async (
  program: Program<TokenVesting>,
  orgId: BN,
  employee: PublicKey,
  tokenMint: PublicKey,
  scheduleId: BN
) => {
  try {
    const [vestingSchedulePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vesting_schedule"),
        orgId.toArrayLike(Buffer, "le", 8),
        employee.toBuffer(),
        tokenMint.toBuffer(),
        scheduleId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    return await program.account.vestingSchedule.fetch(vestingSchedulePda);
  } catch (error) {
    console.error("Error fetching vesting schedule:", error);
    return null;
  }
};

export const claimTokens = async (
  program: Program<TokenVesting>,
  orgId: BN,
  employee: PublicKey,
  tokenMint: PublicKey,
  scheduleId: BN
): Promise<TransactionSignature> => {
  try {
    const [vestingSchedulePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vesting_schedule"),
        orgId.toArrayLike(Buffer, "le", 8),
        employee.toBuffer(),
        tokenMint.toBuffer(),
        scheduleId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    const vestingTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vestingSchedulePda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    const employeeTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      employee,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    const tx = await program.methods
      .claimTokens()
      .accountsPartial({
        vestingSchedule: vestingSchedulePda,
        vestingTokenAccount,
        employeeTokenAccount,
        employee,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
      
    await program.provider.connection.confirmTransaction(tx, "finalized");
    return tx;
  } catch (error) {
    console.error("Error claiming tokens:", error);
    throw error;
  }
};

export const getClaimableAmount = async (
  program: Program<TokenVesting>,
  orgId: BN,
  employee: PublicKey,
  tokenMint: PublicKey,
  scheduleId: BN
): Promise<BN> => {
  try {
    const [vestingSchedulePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vesting_schedule"),
        orgId.toArrayLike(Buffer, "le", 8),
        employee.toBuffer(),
        tokenMint.toBuffer(),
        scheduleId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const result = await program.methods
      .getClaimableAmount()
      .accountsPartial({
        vestingSchedule: vestingSchedulePda,
      })
      .view();
    
    return new BN(result);
  } catch (error) {
    console.error("Error getting claimable amount:", error);
    return new BN(0);
  }
};

export const revokeVestingSchedule = async (
  program: Program<TokenVesting>,
  employer: PublicKey,
  orgId: BN,
  employee: PublicKey,
  tokenMint: PublicKey,
  scheduleId: BN
): Promise<TransactionSignature> => {
  const [organizationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("organization"), orgId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [vestingSchedulePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vesting_schedule"),
      orgId.toArrayLike(Buffer, "le", 8),
      employee.toBuffer(),
      tokenMint.toBuffer(),
      scheduleId.toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );

  const vestingTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    vestingSchedulePda,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const employerTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    employer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = await program.methods
    .revokeVesting()
    .accountsPartial({
      vestingSchedule: vestingSchedulePda,
      vestingTokenAccount,
      employerTokenAccount,
      employer,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  await program.provider.connection.confirmTransaction(tx, "finalized");
  return tx;
};