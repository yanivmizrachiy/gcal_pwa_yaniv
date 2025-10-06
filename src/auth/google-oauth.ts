/**
 * Google OAuth2 authentication with PKCE flow
 * Phase A.1: Scaffolding with PKCE generation and auth URL construction
 * Phase A.2: Will implement token exchange via Apps Script proxy
 */

import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import { sessionStore } from '../state/session';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

interface PKCEState {
  codeVerifier: string;
  state: string;
}

/**
 * Initiates OAuth2 authorization flow with PKCE
 */
export async function startAuth(): Promise<void> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Missing OAuth configuration. Check VITE_GOOGLE_CLIENT_ID and VITE_REDIRECT_URI');
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateCodeVerifier(); // Random state for CSRF protection

  // Store PKCE parameters for later verification (Phase A.2)
  const pkceState: PKCEState = { codeVerifier, state };
  sessionStorage.setItem('pkce_state', JSON.stringify(pkceState));

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  window.location.href = authUrl;
}

/**
 * Handles OAuth2 redirect callback
 * Phase A.1: Stub implementation - will be completed in Phase A.2
 */
export function handleRedirect(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return Promise.reject(new Error(`OAuth error: ${error}`));
  }

  if (!code || !state) {
    return Promise.resolve(false);
  }

  // Verify state parameter
  const storedState = sessionStorage.getItem('pkce_state');
  if (!storedState) {
    return Promise.reject(new Error('Missing PKCE state'));
  }

  const pkceState: PKCEState = JSON.parse(storedState);
  if (pkceState.state !== state) {
    return Promise.reject(new Error('State mismatch - possible CSRF attack'));
  }

  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);

  // TODO Phase A.2: Exchange code for tokens via Apps Script proxy
  console.log('OAuth code received. Token exchange to be implemented in Phase A.2');
  return Promise.resolve(true);
}

/**
 * Exchanges authorization code for access tokens
 * Phase A.2: Will implement via Apps Script backend proxy
 */
export async function exchangeCodeForTokens(_code: string, _codeVerifier: string): Promise<void> {
  // Placeholder - will be implemented in Phase A.2 with Apps Script backend
  throw new Error('Token exchange not yet implemented - coming in Phase A.2');
}

/**
 * Logs out the current user
 */
export function logout(): void {
  sessionStore.clear();
  sessionStorage.removeItem('pkce_state');
  // Redirect to home
  window.location.href = '/';
}
