import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";
import { clientIp } from "@/lib/auth/ip";
import { assertLoginAllowed, LoginLockedError, recordLoginAttempt } from "@/lib/auth/lockout";
import { authConfig } from "@/auth.config";

class AuthLoginError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) {
          throw new AuthLoginError("invalid");
        }

        const email = parsed.data.email.toLowerCase();
        const ip = clientIp(request);

        try {
          await assertLoginAllowed(email, ip);
        } catch (error) {
          if (error instanceof LoginLockedError) {
            throw new AuthLoginError("locked");
          }
          throw error;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordHash: true,
          },
        });

        // Mesma falha para e-mail inexistente ou senha errada (anti-enumeração).
        if (!user?.passwordHash) {
          await recordLoginAttempt(email, ip, false);
          throw new AuthLoginError("invalid");
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          await recordLoginAttempt(email, ip, false);
          throw new AuthLoginError("invalid");
        }

        await recordLoginAttempt(email, ip, true);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
