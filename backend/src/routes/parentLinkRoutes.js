import express from "express";
import {
  createParentLink,
  getParentLinks,
  getMyLinkedStudents,
  getStudentParentLinks,
  updateParentLink,
  deleteParentLink,
} from "../controllers/parentLinkController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement, allowRoles } from "../middlewares/roleMiddleware.js";
import {
  resolveUserAcademy,
  requireResolvedAcademy,
} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  parentLinkIdValidator,
  parentLinkStudentIdValidator,
  createParentLinkValidator,
  updateParentLinkValidator,
  listParentLinksValidator,
} from "../validators/parentLinkValidator.js";

const router = express.Router();

router.use(protect);

router.get(
  "/my-students",
  allowRoles("parent", "student"),
  getMyLinkedStudents
);

router.use(allowAcademyManagement);
router.use(resolveUserAcademy);
router.use(requireResolvedAcademy);

router
  .route("/")
  .post(createParentLinkValidator, validateRequest, createParentLink)
  .get(listParentLinksValidator, validateRequest, getParentLinks);

router.get(
  "/student/:studentId",
  parentLinkStudentIdValidator,
  validateRequest,
  getStudentParentLinks
);

router
  .route("/:id")
  .patch(updateParentLinkValidator, validateRequest, updateParentLink)
  .delete(parentLinkIdValidator, validateRequest, deleteParentLink);

export default router;