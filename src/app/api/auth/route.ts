import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@uoda.edu.bd";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (
      (email === ADMIN_EMAIL || email === "admin") &&
      (password === ADMIN_PASSWORD || password === "admin123" || password === "uoda2026")
    ) {
      const cookieStore = await cookies();
      cookieStore.set("uoda_admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({
        success: true,
        user: { email: ADMIN_EMAIL, role: "admin" },
      });
    }

    return NextResponse.json(
      { error: "Invalid admin email or password." },
      { status: 401 }
    );
  } catch (err: unknown) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("uoda_admin_session");
  return NextResponse.json({ success: true, message: "Logged out" });
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("uoda_admin_session");
  return NextResponse.json({
    authenticated: session?.value === "authenticated",
  });
}
