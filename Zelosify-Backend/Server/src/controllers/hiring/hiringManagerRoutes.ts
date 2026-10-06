import { Router } from 'express';
import { 
  getManagerOpenings, 
  getOpeningProfiles, 
  shortlistProfile, 
  rejectProfile 
} from '../../controllers/hiring/hiringManagerController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js'; // Adjust path
import { requireRole } from '../../middlewares/roleMiddleware.js'; // Adjust path

const router = Router();

// Enforce API-level RBAC for Hiring Managers
router.use(verifyToken, requireRole('HIRING_MANAGER'));

router.get('/openings', getManagerOpenings);
router.get('/openings/:id/profiles', getOpeningProfiles);
router.post('/profiles/:id/shortlist', shortlistProfile);
router.post('/profiles/:id/reject', rejectProfile);

export default router;