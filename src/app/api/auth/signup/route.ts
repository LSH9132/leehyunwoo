import { NextResponse } from "next/server";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "@/utils/dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "유효하지 않은 이메일 형식입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검사 (최소 8자 이상)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 최소 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 기존 사용자 확인 (email을 사용하여 조회)
    const checkUser = await dynamoDb.send(
      new QueryCommand({
        TableName: "Users",
        IndexName: "EmailIndex", // EmailIndex를 사용하여 조회
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );

    if (checkUser.Items && checkUser.Items.length > 0) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 등록
    const params = {
      TableName: "Users",
      Item: {
        uuid: uuidv4(),
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLocation: null,
        lastUpdated: null
      },
    };

    await dynamoDb.send(new PutCommand(params));

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      user: { email },
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 