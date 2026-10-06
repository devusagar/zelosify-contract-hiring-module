import { getOpenings, getOpeningDetails, getPresignedUrl, submitProfile } from '../../controllers/vendor/vendorController.js';
import { Router } from 'express';
import { getOpenings, getOpeningDetails } from '../../controllers/vendor/vendorController';
// Import your existing auth and role middleware here (e.g., verifyToken, requireRole)

const router = Router();

// The middleware should verify the JWT and check if role === 'IT_VENDOR'
// Example: router.use(verifyToken, requireRole('IT_VENDOR'));

router.get('/openings', getOpenings);
router.get('/openings/:id', getOpeningDetails);

// We will add the S3 presign and upload routes here next!
// Hiring Module Routes (IT Vendor)
router.get('/openings', getOpenings);
router.get('/openings/:id', getOpeningDetails);
router.post('/openings/:id/profiles/presign', getPresignedUrl);
router.post('/openings/:id/profiles/upload', submitProfile);
export default router;