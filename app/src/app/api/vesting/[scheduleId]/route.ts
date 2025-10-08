import { fetchVestingSchedule, getProviderReadonly } from "@/services";
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export async function GET(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const { scheduleId } = params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const employee = searchParams.get('employee');
    const tokenMint = searchParams.get('tokenMint');

    if (!scheduleId || !orgId || !employee || !tokenMint) {
      return NextResponse.json(
        { error: "Schedule ID, organization ID, employee, and token mint are required" },
        { status: 400 }
      );
    }

    // Validate and convert parameters
    let employeePublicKey: PublicKey;
    let tokenMintPublicKey: PublicKey;
    try {
      employeePublicKey = new PublicKey(employee);
      tokenMintPublicKey = new PublicKey(tokenMint);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid public key format" },
        { status: 400 }
      );
    }

    const provider = getProviderReadonly();
    const orgIdBN = new BN(orgId);
    const scheduleIdBN = new BN(scheduleId);

    const vestingSchedule = await fetchVestingSchedule(
      provider, 
      orgIdBN, 
      employeePublicKey, 
      tokenMintPublicKey, 
      scheduleIdBN
    );

    if (!vestingSchedule) {
      return NextResponse.json(
        { error: "Vesting schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(vestingSchedule, { status: 200 });
  } catch (error) {
    console.error("Error fetching vesting schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}