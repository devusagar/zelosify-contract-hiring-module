import { Request, Response } from 'express';
import prisma from '../../../config/prisma/prisma.js'; // Adjust path if needed

// 1. Fetch Openings (Filtered strictly by hiringManagerId)
export const getManagerOpenings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // Assuming auth middleware attaches user ID
    
    if (!userId) return res.status(403).json({ error: "Unauthorized" });

    const openings = await prisma.opening.findMany({
      where: { hiringManagerId: userId },
      orderBy: { postedDate: 'desc' }
    });

    res.status(200).json({ data: openings });
  } catch (error) {
    console.error("Error fetching manager openings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Fetch Profiles for a specific opening (Includes AI Recommendation data)
export const getOpeningProfiles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: openingId } = req.params;

    // Security check: Ensure this opening actually belongs to this Hiring Manager
    const opening = await prisma.opening.findUnique({ where: { id: openingId } });
    if (!opening || opening.hiringManagerId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to this opening" });
    }

    const profiles = await prisma.hiringProfile.findMany({
      where: { openingId, isDeleted: false },
      orderBy: { recommendationScore: 'desc' } // Best candidates at the top
    });

    res.status(200).json({ data: profiles });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 3. Shortlist a Profile
export const shortlistProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: profileId } = req.params;

    // Verify ownership via Prisma transaction to prevent unauthorized edits
    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.hiringProfile.findUnique({
        where: { id: parseInt(profileId) },
        include: { opening: true }
      });

      if (!profile || profile.opening.hiringManagerId !== userId) {
        throw new Error("Unauthorized action");
      }

      return await tx.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: { 
          status: 'SHORTLISTED', 
          shortlistedBy: userId, 
          shortlistedAt: new Date() 
        }
      });
    });

    res.status(200).json({ message: "Profile shortlisted", data: updatedProfile });
  } catch (error: any) {
    res.status(403).json({ error: error.message || "Server error" });
  }
};

// 4. Reject a Profile
export const rejectProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: profileId } = req.params;

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.hiringProfile.findUnique({
        where: { id: parseInt(profileId) },
        include: { opening: true }
      });

      if (!profile || profile.opening.hiringManagerId !== userId) {
        throw new Error("Unauthorized action");
      }

      return await tx.hiringProfile.update({
        where: { id: parseInt(profileId) },
        data: { 
          status: 'REJECTED', 
          rejectedBy: userId, 
          rejectedAt: new Date() 
        }
      });
    });

    res.status(200).json({ message: "Profile rejected", data: updatedProfile });
  } catch (error: any) {
    res.status(403).json({ error: error.message || "Server error" });
  }
};