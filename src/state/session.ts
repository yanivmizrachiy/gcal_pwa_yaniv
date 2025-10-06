/**
 * In-memory session state management
 * Stores OAuth tokens and user information
 * Phase A.2 will add localStorage persistence
 */

export interface UserInfo {
  email?: string;
  name?: string;
  picture?: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: string;
  scope: string;
}

class SessionStore {
  private tokens: TokenData | null = null;
  private user: UserInfo | null = null;

  setTokens(tokens: TokenData): void {
    this.tokens = tokens;
  }

  getTokens(): TokenData | null {
    return this.tokens;
  }

  getAccessToken(): string | null {
    if (!this.tokens) return null;
    if (Date.now() >= this.tokens.expiresAt) {
      // Token expired
      return null;
    }
    return this.tokens.accessToken;
  }

  setUser(user: UserInfo): void {
    this.user = user;
  }

  getUser(): UserInfo | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  clear(): void {
    this.tokens = null;
    this.user = null;
  }
}

// Singleton instance
export const sessionStore = new SessionStore();
