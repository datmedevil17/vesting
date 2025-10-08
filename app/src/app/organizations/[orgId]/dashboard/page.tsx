import React, { useMemo } from "react";
import {
  getDashboardStats,
  isOrganizationOwner,
  getProvider,
} from "@/services";
import { useWallet } from "@solana/wallet-adapter-react";

const page = () => {
  const { connected, publicKey, signTransaction, sendTransaction } =
    useWallet();

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !sendTransaction) return null;
    return getProvider(publicKey, signTransaction, sendTransaction);
  }, [publicKey, signTransaction, sendTransaction]);

  return <div></div>;
};

export default page;
