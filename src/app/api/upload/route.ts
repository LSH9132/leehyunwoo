import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// 업로드 처리 함수
export const POST = async (req: NextRequest) => {
  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  
  // multipart/form-data 형식이 아니면 에러
  if (!isMultipart) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }
  
  try {
    // body가 null인지 확인
    if (!req.body) {
      return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
    }
    
    // 요청의 바디를 스트림으로 처리
    const formData = await parseForm(req.body);
    const file = formData.file;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    
    // S3에 업로드
    const uniqueKey = `images/${uuidv4()}-${file.originalname}`;
    const fileStream = Readable.from(file.buffer);
    
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uniqueKey,
        Body: fileStream,
        ContentType: file.mimetype,
      },
    });
    
    await upload.done(); // Wait for the upload to complete
    
    return NextResponse.json({
      message: "File uploaded successfully",
      key: uniqueKey,
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
};

// 요청 바디에서 파일 파싱 함수
const parseForm = (stream: ReadableStream): Promise<any> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    const reader = stream.getReader();
    
    reader.read().then(function processText({ done, value }) {
      if (done) {
        const buffer = Buffer.concat(chunks);
        resolve(parseMultipart(buffer)); // multipart 파싱 함수 호출
        return;
      }
      chunks.push(value);
      reader.read().then(processText).catch(reject);
    }).catch(reject);
  });
};

// 간단한 multipart/form-data 파서 (필요한 최소한의 파싱만)
const parseMultipart = (buffer: Buffer) => {
  // MIME 타입을 추출하는 로직을 추가합니다.
  const fileMimeType = "image/jpeg"; // 예시 MIME 타입: image/jpeg
  const validMimeTypes = ["image/jpeg"]; // 지원하는 MIME 타입을 "image/jpeg"로 변경
  
  // 파일의 MIME 타입을 검사하여 jpg 파일만 처리하도록 제한
  if (!validMimeTypes.includes(fileMimeType)) {
    throw new Error("Invalid file type. Only JPG files are allowed.");
  }
  
  const file = {
    buffer: buffer,
    originalname: "uploaded-image.jpg", // 예시 파일 이름
    mimetype: fileMimeType, // MIME 타입: image/jpeg
  };
  
  return { file };
};
