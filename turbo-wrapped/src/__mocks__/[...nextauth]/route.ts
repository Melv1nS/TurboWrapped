export const OPTIONS = {
    providers: [],
    callbacks: {
      async signIn() { return true; },
      async jwt() { return {}; },
      async session() { return {}; }
    }
  };
  
  const mockHandler = {
    GET: jest.fn(),
    POST: jest.fn()
  };
  
  export { mockHandler as GET, mockHandler as POST };