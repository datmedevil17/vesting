import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../../target/idl/token_vesting.json";
import { TokenVesting } from "../../../target/types/token_vesting";
import { RPC_URL } from "./constants";

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
  return new Program<TokenVesting>(idl as TokenVesting, provider);
};

export const getProviderReadonly = (): Program<TokenVesting> => {
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => { throw new Error("Read-only provider cannot sign transactions."); },
    signAllTransaction: async () => { throw new Error("Read-only provider cannot sign transactions."); },
  };
  const provider = new AnchorProvider(connection, wallet as unknown as Wallet, { commitment: "processed" });
  return new Program<TokenVesting>(idl as TokenVesting, provider);
};