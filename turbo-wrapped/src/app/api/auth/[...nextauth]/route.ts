import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import prisma from "@/app/lib/prisma";
import rateLimit from "@/app/lib/rate-limit";

// Initialize rate limiter for auth endpoint
const limiter = rateLimit('auth');

// Define all required scopes
const REQUIRED_SCOPES = [
    "user-read-email",     // Required for authentication
    "user-top-read",       // Required for top artists, tracks, and genres
    "user-read-recently-played"  // Required for listening history tracking
].join(',');

export const OPTIONS = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: REQUIRED_SCOPES,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, request }) {
      try {
        // Get IP address or fallback to a default
        const ip = request?.headers?.['x-forwarded-for'] || 
                  request?.socket?.remoteAddress || 
                  'anonymous';
        
        // Check rate limit
        const { success, remaining, limit, resetIn } = await limiter.check(ip);
        
        if (!success) {
          throw new Error('TOO_MANY_REQUESTS');
        }

        if (user.email && account) {
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: { name: user.name || '' },
            create: {
              email: user.email,
              name: user.name || '',
              trackingEnabled: false,
            },
          });

          if (account.provider === 'spotify') {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
              },
              create: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
              },
            });
          }
        }
        return true;
      } catch (error) {
        if (error.message === 'TOO_MANY_REQUESTS') {
          return false;
        }
        console.error('Sign in error:', error);
        return false;
      }
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user,
        };
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log successful sign-ins for monitoring
      console.log(`User ${user.email} signed in successfully`);
    },
    async signOut({ token }) {
      // Log sign-outs for monitoring
      console.log(`User signed out`);
    },
    async error(error) {
      // Log authentication errors
      console.error('Auth error:', error);
    }
  },
  pages: {
    error: '/auth/error', // Custom error page
    signOut: '/', // Redirect to home after sign out
  },
};

async function refreshAccessToken(token) {
  try {
    const url = 'https://accounts.spotify.com/api/token';
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + (data.expires_in * 1000),
      refreshToken: data.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const handler = NextAuth(OPTIONS);

// Export the handler directly using the new Next.js Edge Runtime format
export const GET = handler;
export const POST = handler;