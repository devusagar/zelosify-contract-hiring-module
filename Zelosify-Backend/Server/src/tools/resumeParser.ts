import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import pdfParse from 'pdf-parse';
import { parseOfficeAsync } from 'officeparser';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.S3_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

// Tool: Fetch and Parse Resume (Supports PDF & PPTX)
export const fetchAndParseResume = async (s3Key: string): Promise<string> => {
  try {
    // 1. Retrieve the file from S3
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
    });
    const response = await s3Client.send(command);
    const byteArray = await response.Body?.transformToByteArray();
    
    if (!byteArray) throw new Error("Failed to download file from S3");
    const buffer = Buffer.from(byteArray);

    // 2. Extract text based on file format
    const extension = s3Key.split('.').pop()?.toLowerCase();
    let extractedText = "";

    if (extension === 'pdf') {
      // Parse PDF natively from buffer
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } 
    else if (extension === 'pptx') {
      // OfficeParser requires a file path, so we use a temporary file
      const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.pptx`);
      await fs.writeFile(tempFilePath, buffer);
      
      extractedText = await parseOfficeAsync(tempFilePath);
      
      // Clean up temp file
      await fs.unlink(tempFilePath);
    } 
    else {
      throw new Error("Unsupported file format. Only PDF and PPTX are allowed.");
    }

    // Clean up excessive whitespace
    return extractedText.replace(/\s+/g, ' ').trim();

  } catch (error) {
    console.error("Resume Parsing Error:", error);
    throw new Error("Failed to parse resume content");
  }
};