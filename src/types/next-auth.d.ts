import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: Role;
    pwdStamp?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    pwd?: string;
    invalid?: boolean;
  }
}
