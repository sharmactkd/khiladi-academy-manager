import express from "express";

import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../controllers/branchController.js";

import { protect } from "../middlewares/authMiddleware.js";
import {
  allowAcademyManagement,
  requireAcademyOwner,
} from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { requireFeature } from "../middlewares/featureMiddleware.js";

import {
  branchIdValidator,
  createBranchValidator,
  updateBranchValidator,
  listBranchesValidator,
} from "../validators/branchValidator.js";

const router = express.Router();

router.use(protect);
router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);
router.use(requireFeature("multiBranch"));

router
  .route("/")
  .post(requireAcademyOwner, createBranchValidator, validateRequest, createBranch)
  .get(listBranchesValidator, validateRequest, getBranches);

router
  .route("/:id")
  .get(branchIdValidator, validateRequest, getBranchById)
  .patch(requireAcademyOwner, updateBranchValidator, validateRequest, updateBranch)
  .delete(requireAcademyOwner, branchIdValidator, validateRequest, deleteBranch);

export default router;