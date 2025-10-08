import { fetchAllOrganizations, getProviderReadonly } from "@/services";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const provider = getProviderReadonly();
    const organizations = await fetchAllOrganizations(provider);

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organizations",
      },
      { status: 500 }
    );
  }
}
