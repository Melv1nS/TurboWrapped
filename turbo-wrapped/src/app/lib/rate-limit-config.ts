export interface RateLimitConfig {
    interval: number;  // in milliseconds
    limit: number;
  }
  
  export const rateLimits: Record<string, RateLimitConfig> = {
    // Authentication endpoints
    'auth': {
      interval: 60 * 1000,  // 1 minute
      limit: 30
    },
    
    // Core data endpoints
    'tracks': {
      interval: 60 * 1000,
      limit: 50
    },
    'artists': {
      interval: 60 * 1000,
      limit: 50
    },
    'genres': {
      interval: 60 * 1000,
      limit: 50
    },
    
    // History and analytics endpoints
    'listening-history': {
      interval: 60 * 1000,
      limit: 30
    },
    'heatmap': {
      interval: 60 * 1000,
      limit: 20
    },
    'insights': {
      interval: 60 * 1000,
      limit: 20
    },
    'diversity': {
      interval: 60 * 1000,
      limit: 20
    },
    
    // User preference endpoints
    'tracking-preferences': {
      interval: 60 * 1000,
      limit: 10
    },
    
    // Data management endpoints
    'delete-user-data': {
      interval: 60 * 1000,
      limit: 5
    },
    'download-history': {
      interval: 60 * 1000,
      limit: 10
    },
    
    // Default fallback
    'default': {
      interval: 60 * 1000,
      limit: 30
    }
  }