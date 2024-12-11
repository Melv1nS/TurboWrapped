// Replace 'any' with specific type
async jwt({ token, account, user }: {
    token: JWT;
    account: Account | null;
    user: User | null;
}) {
    // ... rest of the code
}

// Remove unused 'error' variable or use it
async session({ session, token }: {
    session: Session;
    token: JWT;
}) {
    session.user = token.user;
    session.accessToken = token.accessToken;
    // Remove this line if not using the error
    // session.error = token.error;
    return session;
} 