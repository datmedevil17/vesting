import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { fetchEmployee,getProviderReadonly } from "@/services";

export async function GET(
  request: NextRequest,
  { params }: { params: { pubkey: string } }
) {
  try {
    const { pubkey } = params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
        const provider = getProviderReadonly();


    if (!pubkey || !orgId) {
      return NextResponse.json(
        { error: "Public key and organization ID are required" },
        { status: 400 }
      );
    }

    const employeePublicKey = new PublicKey(pubkey);
    const orgIdBN = new BN(orgId);

    const employee = await fetchEmployee(provider, employeePublicKey, orgIdBN);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee, { status: 200 });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}