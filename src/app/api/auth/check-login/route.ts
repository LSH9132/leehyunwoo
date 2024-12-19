import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/jwt";
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }

  try {
    const decoded = verifyToken(token);
    return NextResponse.json({ loggedIn: true, user: { email: decoded.email, uuid: decoded.uuid } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }
} 