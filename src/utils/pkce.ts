/**
 * PKCE (Proof Key for Code Exchange) utility functions for OAuth2
 * Implements RFC 7636 for secure authorization flow
 */

/**
 * Generates a cryptographically random code verifier (43-128 characters)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generates a code challenge from a verifier using SHA-256
 * @param verifier - The code verifier string
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Base64-URL encoding without padding (RFC 7636 compliant)
 */
function base64UrlEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
