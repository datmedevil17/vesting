import { fetchOrganization, getProviderReadonly } from "@/services";
import { NextRequest, NextResponse } from "next/server";
import { BN } from "@coral-xyz/anchor";

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;
    console.log("API: Received orgId:", orgId);

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Check if orgId is a valid number for BN conversion
    if (isNaN(Number(orgId))) {
      console.error("API: Invalid orgId format:", orgId);
      return NextResponse.json(
        { success: false, error: "Invalid organization ID format" },
        { status: 400 }
      );
    }

    console.log("API: Getting provider...");
    const provider = getProviderReadonly();
    
    console.log("API: Converting orgId to BN...");
    const orgIdBN = new BN(orgId);
    console.log("API: orgIdBN:", orgIdBN.toString());

    console.log("API: Fetching organization...");
    const organization = await fetchOrganization(provider, orgIdBN);
    console.log("API: Organization fetched:", organization ? "Found" : "Not found");

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: organization 
    }, { status: 200 });
  } catch (error) {
    console.error("API: Detailed error:", error);
    console.error("API: Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("API: Error message:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}