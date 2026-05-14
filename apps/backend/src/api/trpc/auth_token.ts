import crypto from 'crypto';

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'dev-auth-secret-change-me';
const tokenDenylist = new Set<string>();

export type AuthPayload = {
  userId: number;
  email: string;
  exp: number;
};

export function signAuthToken(payload: Omit<AuthPayload, 'exp'>, ttlSeconds = 60 * 60 * 24) {
  const fullPayload: AuthPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyAuthToken(token: string): AuthPayload | null {
  if (isTokenRevoked(token)) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;

  const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as AuthPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, originalHash] = stored.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

export function revokeAuthToken(token: string) {
  tokenDenylist.add(token);
}

export function isTokenRevoked(token: string) {
  return tokenDenylist.has(token);
}
