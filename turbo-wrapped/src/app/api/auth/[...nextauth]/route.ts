import NextAuth from "next-auth/next";
import { type NextAuthOptions } from "next-auth";
import SpotifyProvider from 'next-auth/providers/spotify';

const OPTIONS: NextAuthOptions = {
    providers: [
        SpotifyProvider({
            authorization:
                'https://accounts.spotify.com/authorize?scope=user-read-email,user-top-read,user-read-recently-played,user-read-currently-playing',
            clientId: process.env.SPOTIFY_CLIENT_ID || '',
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        }),
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
                    user
                };
            }

            // Return previous token if the access token has not expired
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            // Access token expired, try to refresh it
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            session.user = token.user;
            session.accessToken = token.accessToken;
            session.error = token.error;
            
            return session;
        },
    }
};

async function refreshAccessToken(token: any) {
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
                refresh_token: token.refreshToken as string,
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
            // Fall back to old refresh token, but use new one if present
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

export { OPTIONS };
export { handler as GET, handler as POST };