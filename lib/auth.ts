import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "change-this-secret-key"
);

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT";
};

export async function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT";
}) {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as {
    userId: string;
    email: string;
    name: string;
    role: "ADMIN" | "AGENT";
  };
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get("attendance_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "AGENT";
}) {
  const cookieStore = cookies();
  const token = await createSessionToken(user);

  cookieStore.set("attendance_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set("attendance_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
