import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
          console.log('User account is not active:', credentials.email)
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          console.log('Password validation failed for:', credentials.email)
          return null
        }
        
        console.log('Authentication successful for:', credentials.email)

        // Update lastSignIn time
        await db.user.update({
          where: { id: user.id },
          data: { lastSignIn: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          lastSignIn: new Date(),
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id  // Store the actual user ID
        token.role = user.role
        token.department = user.department
        token.lastSignIn = user.lastSignIn?.toISOString() || null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string  // Use the stored user ID instead of token.sub
        session.user.role = token.role as string
        session.user.department = token.department as string
        session.user.lastSignIn = token.lastSignIn as string | null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If the URL is already a role-specific dashboard, use it
      if (url.includes('/dashboard/admin') || url.includes('/dashboard/manager') || url.includes('/dashboard/employee')) {
        return url
      }

      // For any other redirect, go to the base URL (which will handle role-based redirect)
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  // Disable default redirects to prevent intermediate page flashes
  redirectProxyUrl: process.env.NEXTAUTH_URL
}
