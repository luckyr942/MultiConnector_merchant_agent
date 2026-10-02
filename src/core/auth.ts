// Authentication strategy helpers for Basic Auth, API Keys, and Bearer Tokens

export type AuthStrategy =
  | { type: 'basic'; username: string; password?: string }
  | { type: 'api_key_header'; headerName: string; apiKey: string }
  | { type: 'bearer'; token: string };

export function createAuthHeaders(auth: AuthStrategy): Record<string, string> {
  switch (auth.type) {
    case 'basic': {
      const creds = Buffer.from(`${auth.username}:${auth.password ?? ''}`).toString('base64');
      return { Authorization: `Basic ${creds}` };
    }
    case 'api_key_header':
      return { [auth.headerName]: auth.apiKey };
    case 'bearer':
      return { Authorization: `Bearer ${auth.token}` };
  }
}
