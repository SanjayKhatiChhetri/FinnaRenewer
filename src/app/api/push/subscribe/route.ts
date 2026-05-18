import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { subscribePush, unsubscribePush } from "@/server/actions/settings";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await subscribePush(body);
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json();
  const result = await unsubscribePush(endpoint);
  return NextResponse.json(result);
}
