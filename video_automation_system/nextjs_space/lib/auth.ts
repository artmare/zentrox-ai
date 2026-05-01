import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'placeholder',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          if (!user || !user.passwordHash) return null
          if (!user.emailVerified) return null
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) return null
          return { id: user.id, email: user.email, name: user?.name ?? '' }
        } catch {
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  // debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  cookies: {
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ account, profile }: any) {
      if (account?.provider === 'google') {
        const isVerifiedByProvider = profile?.email_verified === true
        return isVerifiedByProvider
      }
      return true
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user?.id
        token.email = user?.email
        token.name = user?.name
      }
      return token
    },
    async session({ session, token }: any) {
      if (session?.user) {
        (session.user as any).id = token?.id
        session.user.email = token?.email ?? ''
        session.user.name = token?.name ?? ''
      }
      return session
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
}
