import { processCandidateProfile } from '../../tools/agentOrchestrator.js'; // Adjust path if needed
import { Request, Response } from 'express';
import prisma from '../../../config/prisma/prisma.js'; // Adjust path if necessary based on your structure

// 1. Fetch Openings (Filtered by Tenant + Pagination)
export const getOpenings = async (req: Request, res: Response) => {
  try {
    // Assuming your authentication middleware attaches the user to req.user
    const tenantId = (req as any).user?.tenantId; 
    
    // Pagination logic (default to page 1, 10 items per page)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!tenantId) {
      return res.status(403).json({ error: "Unauthorized: No tenant ID found for user." });
    }

    const openings = await prisma.opening.findMany({
      where: { tenantId },
      skip,
      take: limit,
      orderBy: { postedDate: 'desc' }
    });

    const total = await prisma.opening.count({ where: { tenantId } });

    res.status(200).json({
      data: openings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error fetching openings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Fetch Opening Details
export const getOpeningDetails = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const opening = await prisma.opening.findFirst({
      where: { id, tenantId }, // Strict tenant filtering
      include: {
        hiringProfiles: true // Includes uploaded profiles
      }
    });

    if (!opening) {
      return res.status(404).json({ error: "Opening not found." });
    }

    res.status(200).json({
      data: {
        ...opening,
        profilesCount: opening.hiringProfiles.length
      }
    });
  } catch (error) {
    console.error("Error fetching opening details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.S3_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

// 3. Generate Presigned URL
export const getPresignedUrl = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id: openingId } = req.params;
    const { filename, contentType } = req.body;

    if (!tenantId) return res.status(403).json({ error: "Unauthorized" });

    const timestamp = Date.now();
    const fileKey = `${tenantId}/${openingId}/${timestamp}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    res.status(200).json({ signedUrl, fileKey });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

// 4. Submit Profile (Uses Prisma Transaction)
export const submitProfile = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const username = (req as any).user?.username || "vendor_user";
    const { id: openingId } = req.params;
    const { s3Key } = req.body;

    if (!tenantId) return res.status(403).json({ error: "Unauthorized" });

    // 1. Save to DB first (Prisma Transaction)
    let savedProfileId: number;
    let jobRequirements: any;

    const profile = await prisma.$transaction(async (tx) => {
      const opening = await tx.opening.findFirst({ where: { id: openingId, tenantId } });
      if (!opening) throw new Error("Opening not found");

      // Save requirements to pass to the AI
      jobRequirements = {
        minExp: opening.experienceMin,
        maxExp: opening.experienceMax,
        skills: [], // Note: In a real app, you'd fetch this from the Opening model if you added a skills column
        location: opening.location || ""
      };

      const newProfile = await tx.hiringProfile.create({
        data: { openingId, s3Key, uploadedBy: username }
      });
      
      savedProfileId = newProfile.id;
      return newProfile;
    });

    // 2. Return success immediately (so the UI doesn't freeze)
    res.status(201).json({ message: "Profile submitted. AI evaluation started.", data: profile });

    // 3. Trigger AI Agent Asynchronously in the background
    processCandidateProfile(s3Key, jobRequirements)
      .then(async (aiResult) => {
        // Update the profile with the AI's verdict once it finishes
        await prisma.hiringProfile.update({
          where: { id: savedProfileId },
          data: {
            recommended: aiResult.recommended,
            recommendationScore: aiResult.score,
            recommendationConfidence: aiResult.confidence,
            recommendationReason: aiResult.reason,
            recommendationLatencyMs: aiResult.latency,
            recommendedAt: new Date()
          }
        });
        console.log(`AI Evaluation complete for profile ${savedProfileId}`);
      })
      .catch((err) => {
        console.error(`AI Evaluation failed for profile ${savedProfileId}:`, err);
      });

  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};