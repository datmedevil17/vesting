import { fetchAllEmployees, getProviderReadonly } from "@/services";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const provider = getProviderReadonly();
    const employees = await fetchAllEmployees(provider);

    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error("Error fetching all employees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

