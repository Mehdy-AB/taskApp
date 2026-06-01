import { authOptions } from "@/src/api/auth/nextAuthConfig"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
