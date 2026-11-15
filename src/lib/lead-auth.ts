import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDatabase } from "@/lib/db";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const reqHeaders = await headers();

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (session?.user) {
    return session.user as AuthUser;
  }

  // Fallback: Support Bearer JWT token verification for API callers
  const authHeader = reqHeaders.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const payload = await (auth.api as unknown as {
          verifyJWT?: (args: { body: { token: string } }) => Promise<{ sub?: string; id?: string }>;
        }).verifyJWT?.({
          body: { token },
        }).catch(() => null);

        const userId = payload?.sub || payload?.id;
        if (userId) {
          const db = await getDatabase();
          const dbUser = await db.collection<{
            id?: string;
            _id: unknown;
            name?: string;
            email?: string;
            image?: string | null;
            emailVerified?: boolean;
            createdAt?: Date;
            updatedAt?: Date;
          }>("user").findOne({
            $or: [{ id: userId }],
          });

          if (dbUser) {
            return {
              id: dbUser.id || String(dbUser._id),
              name: dbUser.name || "",
              email: dbUser.email || "",
              image: dbUser.image || null,
              emailVerified: Boolean(dbUser.emailVerified),
              createdAt: dbUser.createdAt,
              updatedAt: dbUser.updatedAt,
            };
          }
        }
      } catch {
        // Token was invalid or expired
      }
    }
  }

  return null;
}
