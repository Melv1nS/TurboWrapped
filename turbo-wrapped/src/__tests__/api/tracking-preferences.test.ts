import { GET, POST } from '@/app/api/tracking-preferences/route';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Mock next-auth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
    default: jest.fn(() => ({
        GET: jest.fn(),
        POST: jest.fn()
    }))
}));

// Mock [...nextauth]/route.ts
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  OPTIONS: {
    providers: [],
    callbacks: {
      async signIn() { return true; },
      async jwt() { return {}; },
      async session() { return {}; }
    }
  },
  GET: jest.fn(),
  POST: jest.fn()
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data) => ({
      json: () => Promise.resolve(data)
    }))
  }
}));

// Mock prisma
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe('Tracking Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unauthorized when no session exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const response = await GET(new Request('http://localhost:3000/api/tracking-preferences'));
    const data = await response.json();
    
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  });

  it('should return tracking preferences for authenticated user', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      trackingEnabled: true
    });

    const response = await GET(new Request('http://localhost:3000/api/tracking-preferences'));
    const data = await response.json();

    expect(data).toEqual({ trackingEnabled: true });
    expect(NextResponse.json).toHaveBeenCalledWith({ trackingEnabled: true });
  });
}); 