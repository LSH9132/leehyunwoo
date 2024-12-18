import { NextApiRequest, NextApiResponse } from "next";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",  // AWS 리전
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",  // AWS Access Key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",  // AWS Secret Key
  },
});

// Next.js API 구성 (bodyParser 비활성화)
export const config = {
  api: {
    bodyParser: false, // bodyParser 비활성화
  },
};

// S3 연결 테스트 핸들러
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // AWS S3에 연결하여 버킷 목록을 가져오는 테스트
    const data = await s3Client.send(new ListBucketsCommand({}));
    
    // 성공적인 연결 및 버킷 목록 반환
    res.status(200).json({
      message: "Successfully connected to AWS S3!",
      buckets: data.Buckets, // 버킷 목록
    });
  } catch (error) {
    // 연결 실패 시 오류 메시지
    console.error("Error connecting to S3:", error);
    res.status(500).json({
      error: "Error connecting to AWS S3",
      details: error.message,
    });
  }
};

// POST 요청 핸들러
export const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  return handler(req, res);
};
