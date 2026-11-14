import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@uoda.edu.bd";

// In-memory failed attempts tracker for brute-force defense
const failedAttemptsMap = new Map<string, { count: number; lockUntil: number }>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local_client";
    const now = Date.now();

    // Check lock
    const attemptRecord = failedAttemptsMap.get(ip);
    if (attemptRecord && attemptRecord.lockUntil > now) {
      const waitSeconds = Math.ceil((attemptRecord.lockUntil - now) / 1000);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. For security, please wait ${waitSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const { email, password, trustDevice } = await request.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    const isEmailValid =
      normalizedEmail === ADMIN_EMAIL.toLowerCase() ||
      normalizedEmail === "admin";
    const isPasswordValid =
      cleanPassword === ADMIN_PASSWORD ||
      (process.env.NODE_ENV !== "production" &&
        (cleanPassword === "admin123" || cleanPassword === "uoda2026"));

    if (isEmailValid && isPasswordValid) {
      // Clear failed attempts on success
      failedAttemptsMap.delete(ip);

      const cookieStore = await cookies();

      // Cookie options:
      // If trustDevice is true: persist for 30 days
      // If trustDevice is false: standard 4-hour session
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        ...(trustDevice
          ? { maxAge: 60 * 60 * 24 * 30 } // 30 days
          : { maxAge: 60 * 60 * 4 } // 4 hours
        ),
      };

      cookieStore.set("uoda_admin_session", "authenticated", cookieOptions);

      if (trustDevice) {
        cookieStore.set("uoda_trusted_device", "true", {
          ...cookieOptions,
          httpOnly: false, // accessible to client for UX
        });
      }

      return NextResponse.json({
        success: true,
        trusted: !!trustDevice,
      });
    }

    // Record failure
    const currentCount = (attemptRecord?.count || 0) + 1;
    let lockUntil = 0;
    if (currentCount >= 5) {
      lockUntil = now + 5 * 60 * 1000; // 5 min lockout
    }
    failedAttemptsMap.set(ip, { count: currentCount, lockUntil });

    return NextResponse.json(
      { error: "Invalid credentials. Please verify your email and password." },
      { status: 401 }
    );
  } catch (err: unknown) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("uoda_admin_session");
  cookieStore.delete("uoda_trusted_device");
  return NextResponse.json({ success: true, message: "Logged out" });
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("uoda_admin_session");
  const trusted = cookieStore.get("uoda_trusted_device");
  return NextResponse.json({
    authenticated: session?.value === "authenticated",
    trusted: trusted?.value === "true",
  });
}
