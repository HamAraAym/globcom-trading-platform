import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "online", 
    message: "Tasks API Endpoint Active. Internal app uses Server Actions." 
  });
}