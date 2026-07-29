import { NextResponse } from "next/server";
import { listExceptions } from "@/lib/exceptions";

export async function GET() {
  return NextResponse.json(await listExceptions());
}
