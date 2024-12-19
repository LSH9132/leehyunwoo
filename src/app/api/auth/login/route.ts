import { NextResponse } from "next/server";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "@/utils/dynamodb";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/utils/rate-limit";
import { generateToken } from "@/utils/jwt";

const limiter = rateLimit({
  interval: 60 * 1000, // 1분
  uniqueTokenPerInterval: 500, // 최대 500개의 고유 토큰
});

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // DynamoDB에서 사용자 조회
    const params = {
      TableName: "Users",
      IndexName: "EmailIndex", // EmailIndex를 사용하여 조회
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };

    const { Items: users } = await dynamoDb.send(new QueryCommand(params));

    if (!users || users.length === 0) {
      return NextResponse.json(
        { 
          error: "auth/user-not-found",
          message: "등록되지 않은 이메일입니다." 
        },
        { status: 401 }
      );
    }

    const user = users[0];

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { 
          error: "auth/wrong-password",
          message: "비밀번호가 일치하지 않습니다." 
        },
        { status: 401 }
      );
    }

    // 로그인 성공 시 JWT 토큰 생성
    const token = generateToken({ 
      userId: user.uuid, 
      email: user.email,
      uuid: user.uuid,
      lastUpdated: new Date().toISOString()
    });

    // Set JWT token in HTTP-only cookie
    const response = NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
      }
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        error: "auth/server-error",
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 
      },
      { status: 500 }
    );
  }
} 