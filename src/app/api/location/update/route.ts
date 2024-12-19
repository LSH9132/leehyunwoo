import { NextResponse } from "next/server";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "@/utils/dynamodb";
import { verifyToken } from "@/utils/jwt";
import { cookies } from 'next/headers';
import { ReturnValue } from "@aws-sdk/client-dynamodb";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    // 로그인 상태 확인
    if (!token) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded.uuid) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 });
    }

    const { latitude, longitude } = await request.json();
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: "잘못된 위치 정보 형식입니다." }, { status: 400 });
    }

    // 현재 시간과 마지막 업데이트 시간 비교
    const lastUpdated = new Date(decoded.lastUpdated);
    const now = new Date();
    const timeDiff = (now.getTime() - lastUpdated.getTime()) / 1000; // 초 단위로 변환

    if (timeDiff < 10) { // 10초 미만일 경우 업데이트 방지
      return NextResponse.json({ error: "위치 업데이트는 10초 간격으로 가능합니다." }, { status: 429 });
    }

    const params = {
      TableName: "Users",
      Key: {
        uuid: decoded.uuid,
      },
      UpdateExpression: "set lastLocation = :loc, lastUpdated = :time",
      ExpressionAttributeValues: {
        ":loc": { latitude, longitude },
        ":time": now.toISOString() // 현재 시간으로 업데이트
      },
      ReturnValues: ReturnValue.ALL_NEW
    };

    await dynamoDb.send(new UpdateCommand(params));

    return NextResponse.json({ 
      message: "위치가 업데이트되었습니다.",
      location: { latitude, longitude }
    });

  } catch (error) {
    console.error("Location update error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "위치 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 