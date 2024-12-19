require('dotenv').config({ path: '.env.local' });
const { 
  DynamoDBClient, 
  CreateTableCommand,
  DescribeTableCommand,
  ScalarAttributeType,
  KeyType 
} = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function checkAndCreateTable() {
  // 테이블 존재 여부 확인
  try {
    await client.send(new DescribeTableCommand({ TableName: "Users" }));
    console.log("Users 테이블이 이미 존재합니다.");
    return;
  } catch (err: any) {
    if (err.name !== 'ResourceNotFoundException') {
      console.error("테이블 확인 중 오류 발생:", err);
      throw err;
    }
  }

  // 테이블이 없는 경우 생성
  const params = {
    TableName: "Users",
    KeySchema: [
      { AttributeName: "uuid", KeyType: KeyType.HASH }
    ],
    AttributeDefinitions: [
      { AttributeName: "uuid", AttributeType: ScalarAttributeType.S },
      { AttributeName: "email", AttributeType: ScalarAttributeType.S }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "EmailIndex",
        KeySchema: [
          { AttributeName: "email", KeyType: KeyType.HASH }
        ],
        Projection: {
          ProjectionType: "ALL"
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  // 테이블 생성
  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("Users 테이블이 생성되었습니다:", data);
    return data;
  } catch (err) {
    console.error("테이블 생성 중 오류 발생:", err);
    throw err;
  }
}

// 테이블 생성 함수 호출
checkAndCreateTable().catch(err => {
  console.error("테이블 생성 실패:", err);
});

module.exports = checkAndCreateTable; 