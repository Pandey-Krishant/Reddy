import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("rw_session");
  cookieStore.delete("_ptb_session");

  return NextResponse.redirect(new URL("/", req.url), { status: 302 });
}
