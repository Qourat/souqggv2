import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Set it in .env.local');
}
const encodedSecret = new TextEncoder().encode(SECRET);

export async function encrypt(payload: { userId: string; username: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as { userId: string; username: string; role: string };
  } catch {
    return null;
  }
}

export async function verifyToken(token: string) {
  return await decrypt(token);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await decrypt(token);
}