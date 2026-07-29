import { NextResponse } from "next/server";
import { listExceptions } from "@/lib/data";

export async function GET() {
  return NextResponse.json(listExceptions());
}
