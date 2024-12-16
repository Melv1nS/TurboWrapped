import { getOrCreateArtistLocation } from '@/app/utils/artistLocation';
import { PrismaClient } from '@prisma/client';

// Mock the entire artistLocation module
jest.mock('@/app/utils/artistLocation', () => ({
  getOrCreateArtistLocation: jest.fn()
}));

describe('getOrCreateArtistLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached location if it exists', async () => {
    const mockLocation = {
      artistId: '123',
      artistName: 'Test Artist',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.0060
    };

    (getOrCreateArtistLocation as jest.Mock).mockResolvedValue(mockLocation);

    const result = await getOrCreateArtistLocation('123', 'Test Artist');
    
    expect(result).toEqual(mockLocation);
  });

  it('creates new location if none exists', async () => {
    const mockLocation = {
      artistId: '123',
      artistName: 'Test Artist',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.0060
    };

    (getOrCreateArtistLocation as jest.Mock).mockResolvedValue(mockLocation);

    const result = await getOrCreateArtistLocation('123', 'Test Artist');
    
    expect(result).toEqual(mockLocation);
  });
});