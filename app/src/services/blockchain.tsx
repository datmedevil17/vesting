import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionSignature,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import idl from "../../../target/idl/token_vesting.json";
import { TokenVesting } from "../../../target/types/token_vesting";
import { getClusterURL } from "@/utils/helpers";

/* cluster / rpc */
const CLUSTER: string = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const RPC_URL: string = getClusterURL(CLUSTER);

/* ---------- Providers ---------- */
export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: unknown,
  sendTransaction: unknown
): Program<TokenVesting> | null => {
  if (!publicKey || !signTransaction) {
    console.log("Wallet not connected or missing signTransaction");
    return null;
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<TokenVesting>(idl as unknown as TokenVesting, provider);
};

export const getProviderReadonly = (): Program<TokenVesting> => {
  const connection = new Connection(RPC_URL, "confirmed");

  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
    signAllTransactions: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
  };

  const provider = new AnchorProvider(
    connection,
    wallet as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<TokenVesting>(idl as unknown as TokenVesting, provider);
};

/* ---------- Helpers ---------- */

/**
 * Confirm tx (finalized)
 */
const confirmTx = async (program: Program<any>, tx: string) => {
  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    "confirmed"
  );
  const latestBlockhash = await connection.getLatestBlockhash();

  await connection.confirmTransaction(
  {
    signature: tx,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  },
  "confirmed"
);
return tx;
};

/* PDA helper utilities (useful for client-side lookups) */
export const getProgramStatePda = (programId: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("program_state")], programId)[0];

export const getOrganizationPda = (programId: PublicKey, orgId: number) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("organization"), new BN(orgId).toArrayLike(Buffer, "le", 8)],
    programId
  )[0];

export const getEmployeePda = (programId: PublicKey, orgId: number, employee: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("employee"), employee.toBuffer(), new BN(orgId).toArrayLike(Buffer, "le", 8)],
    programId
  )[0];

export const getVestingSchedulePda = (
  programId: PublicKey,
  orgId: number,
  employee: PublicKey,
  tokenMint: PublicKey,
  scheduleId: number | BN
) =>
  PublicKey.findProgramAddressSync(
    [
      Buffer.from("vesting_schedule"),
      new BN(orgId).toArrayLike(Buffer, "le", 8),
      employee.toBuffer(),
      tokenMint.toBuffer(),
      new BN(scheduleId).toArrayLike(Buffer, "le", 8),
    ],
    programId
  )[0];

/**
 * Compute the associated token account for the vesting schedule PDA (owner = vestingSchedulePda)
 * - allowOwnerOffCurve = true because PDAs are off-curve
 */
export const getVestingTokenAta = async (vestingSchedulePda: PublicKey, tokenMint: PublicKey) =>
  getAssociatedTokenAddress(tokenMint, vestingSchedulePda, true);

/* ---------- Instruction wrappers (minimal accounts passed) ---------- */

/**
 * 1. initializeProgram
 * Accounts (IDL): programState (PDA auto), admin (signer)
 * - Don't pass programState or systemProgram/rent (Anchor will inject)
 */
export const initializeProgram = async (
  program: Program<TokenVesting>,
  admin: PublicKey
): Promise<TransactionSignature> => {
  const tx = await program.methods.initializeProgram().accounts({
    admin,
    // no programState, systemProgram, or rent here — Anchor auto-resolves
  } as any).rpc();

  return confirmTx(program, tx);
};

/**
 * 2. createOrganization
 * IDL accounts: programState (PDA), organization (PDA), owner (signer)
 * - We only pass `owner`; PDAs auto-resolve
 */
export const createOrganization = async (
  program: Program<TokenVesting>,
  owner: PublicKey,
  name: string
): Promise<TransactionSignature> => {
  const tx = await program.methods.createOrganization(name).accounts({
    owner,
    // programState & organization PDAs are auto-derived by Anchor per IDL
  } as any).rpc();

  return confirmTx(program, tx);
};

/**
 * 3. joinOrganization
 * IDL accounts: programState, organization (PDA), employee (PDA), employeeSigner (signer)
 * - Pass only the employeeSigner
 */
export const joinOrganization = async (
  program: Program<TokenVesting>,
  orgId: number,
  employeeSigner: PublicKey,
  employeeName: string,
  employeePosition: string
): Promise<TransactionSignature> => {
  const tx = await program.methods
    .joinOrganization(new BN(orgId), employeeName, employeePosition)
    .accounts({
      employeeSigner,
      // programState, organization, employee PDAs auto-resolve
    } as any)
    .rpc();

  return confirmTx(program, tx);
};

/**
 * 4. initializeVestingSchedule
 * IDL accounts: programState, organization, employee, vestingSchedule, vestingTokenAccount, employerTokenAccount, tokenMint, employer (signer)
 * - We pass employer (signer), employerTokenAccount (the ATA / token account the employer funds from), tokenMint.
 * - Anchor will derive vestingSchedule & vestingTokenAccount PDAs (per IDL)
 */
export const initializeVestingSchedule = async (
  program: Program<TokenVesting>,
  orgId: number,
  employer: PublicKey,
  employee: PublicKey,
  tokenMint: PublicKey,
  employerTokenAccount: PublicKey,
  totalAmount: number | BN,
  startTime: number | BN,
  cliffTime: number | BN,
  endTime: number | BN,
  revocable: boolean
): Promise<TransactionSignature> => {
  const tx = await program.methods
    .initializeVestingSchedule(
      new BN(orgId),
      new BN(totalAmount),
      new BN(startTime),
      new BN(cliffTime),
      new BN(endTime),
      revocable
    )
    .accounts({
      employer,
      employerTokenAccount,
      tokenMint,
      // programState, organization, employee, vestingSchedule, vestingTokenAccount auto-resolve
    } as any)
    .rpc();

  return confirmTx(program, tx);
};

/**
 * 5. claimTokens
 * IDL accounts: vestingSchedule (PDA), vestingTokenAccount (PDA), employeeTokenAccount (writable), employee (signer)
 * - Pass employee (signer) and employeeTokenAccount (the ATA to receive tokens).
 * - vestingSchedule & vestingTokenAccount auto-resolve
 */
export const claimTokens = async (
  program: Program<TokenVesting>,
  employee: PublicKey,
  employeeTokenAccount: PublicKey
): Promise<TransactionSignature> => {
  const tx = await program.methods
    .claimTokens()
    .accounts({
      employee,
      employeeTokenAccount,
      // vestingSchedule & vestingTokenAccount auto-resolve
    } as any)
    .rpc();

  return confirmTx(program, tx);
};

/**
 * 6. revokeVesting
 * IDL accounts: vestingSchedule (PDA), vestingTokenAccount (PDA), employerTokenAccount (writable), employer (signer)
 * - Pass employer and employerTokenAccount (destination)
 */
export const revokeVesting = async (
  program: Program<TokenVesting>,
  employer: PublicKey,
  employerTokenAccount: PublicKey
): Promise<TransactionSignature> => {
  const tx = await program.methods
    .revokeVesting()
    .accounts({
      employer,
      employerTokenAccount,
      // vestingSchedule & vestingTokenAccount auto-resolve by Anchor
    } as any)
    .rpc();

  return confirmTx(program, tx);
};

/**
 * 7. removeEmployeeFromOrg
 * IDL accounts: organization (PDA), employee (PDA), owner (signer)
 * - Pass owner (signer)
 */
export const removeEmployeeFromOrg = async (
  program: Program<TokenVesting>,
  orgId: number,
  owner: PublicKey
): Promise<TransactionSignature> => {
  const tx = await program.methods
    .removeEmployeeFromOrg(new BN(orgId))
    .accounts({
      owner,
      // organization & employee PDAs are auto-derived
    } as any)
    .rpc();

  return confirmTx(program, tx);
};

/* ---------- Views (read-only) ---------- */

/**
 * 8. getClaimableAmount
 * IDL returns u64; pass only the minimal account (vestingSchedule is a PDA and anchor will derive it if given contextual input)
 * Here we pass vestingSchedule explicitly because user likely has it — passing PDAs for view calls is OK.
 */
export const getClaimableAmount = async (
  program: Program<TokenVesting>,
  vestingSchedulePda: PublicKey
): Promise<number> => {
  const res = await program.methods
    .getClaimableAmount()
    .accounts({
      vestingSchedule: vestingSchedulePda,
    } as any)
    .view();

  // Anchor returns BN for u64; convert to number (careful with overflow)
  return (res as BN).toNumber();
};

/**
 * 9. getDashboardStats
 * Pass nothing — Anchor will auto-resolve programState PDA per IDL. But some generated clients require the PDA passed — if your types complain, use getProgramStatePda(program.programId) and pass under programState.
 */
export const getDashboardStats = async (program: Program<TokenVesting>) => {
  try {
    // first try letting Anchor auto-resolve (no explicit programState)
    return await program.methods.getDashboardStats().view();
  } catch {
    // fallback: explicitly pass the PDA (some generated clients expect explicit account)
    const programState = getProgramStatePda(program.programId);
    return await program.methods
      .getDashboardStats()
      .accounts({ programState } as any)
      .view();
  }
};

/**
 * 10. getEmployeeDashboard
 * This endpoint's IDL marks `employee` as signer true. For view calls, pass the employee pubkey.
 */
export const getEmployeeDashboard = async (
  program: Program<TokenVesting>,
  employee: PublicKey
) => {
  return await program.methods.getEmployeeDashboard().accounts({ employee } as any).view();
};

/**
 * 11. getEmployeeInfo
 * Pass employee PDA (client helper provided above)
 */
export const getEmployeeInfo = async (
  program: Program<TokenVesting>,
  orgId: number,
  employeePubkey: PublicKey
) => {
  const employeePda = getEmployeePda(program.programId, orgId, employeePubkey);
  return await program.methods
    .getEmployeeInfo(new BN(orgId))
    .accounts({ employee: employeePda } as any)
    .view();
};

/**
 * 12. getEmployerDashboard
 * Pass employer (signer) and let Anchor resolve organization PDA automatically.
 */
export const getEmployerDashboard = async (
  program: Program<TokenVesting>,
  orgId: number,
  employer: PublicKey
) => {
  return await program.methods
    .getEmployerDashboard(new BN(orgId))
    .accounts({ employer } as any)
    .view();
};

/**
 * 13. getOrganizationEmployees
 * Pass owner (signer) and orgId as BN arg
 */
export const getOrganizationEmployees = async (
  program: Program<TokenVesting>,
  orgId: number,
  owner: PublicKey
) => {
  return await program.methods
    .getOrganizationEmployees(new BN(orgId))
    .accounts({ owner } as any)
    .view();
};

/**
 * 14. getOrganizationInfo
 * Pass only orgId argument; Anchor will resolve organization PDA
 */
export const getOrganizationInfo = async (program: Program<TokenVesting>, orgId: number) => {
  return await program.methods.getOrganizationInfo(new BN(orgId)).view();
};

/**
 * 15. getVestingInfo
 * If you have the vestingSchedule PDA, pass it explicitly (most reliable).
 */
export const getVestingInfo = async (program: Program<TokenVesting>, vestingSchedulePda: PublicKey) => {
  return await program.methods.getVestingInfo().accounts({ vestingSchedule: vestingSchedulePda } as any).view();
};

/* ---------- Utility: compute employee ATA (if you need a default) ---------- */
export const getEmployeeTokenAta = async (employeePubkey: PublicKey, tokenMint: PublicKey) =>
  getAssociatedTokenAddress(tokenMint, employeePubkey);

