import express from "express";
import {body} from "express-validator";
import {protect} from "../middlewares/authMiddleware.js";
import {allowAcademyManagement} from "../middlewares/roleMiddleware.js";
import {resolveUserAcademy,requireResolvedAcademy} from "../middlewares/academyAccessMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import {getReminders,updateReminderSettings,readReminders,claimDailyFlash} from "../controllers/academyReminderController.js";
const router=express.Router();
router.use(protect,allowAcademyManagement,resolveUserAcademy,requireResolvedAcademy);
router.get("/",getReminders);
router.patch("/settings",[
  ...["birthdays","dues","flash","inactiveBirthdays","inactiveDues"].map(key=>body(key).optional().isBoolean({strict:true})),
  body("range").optional().isIn([7,15,30]).toInt(),
  ...["birthdayTemplate","dueTemplate"].map(key=>body(key).optional().isString().isLength({max:500})),
],validateRequest,updateReminderSettings);
router.patch("/read",body("ids").isArray({max:500}),body("ids.*").isString().matches(/^(birthday|due):\d{4}-\d{2}-\d{2}:[a-fA-F0-9]{24}$/),validateRequest,readReminders);
router.post("/flash",body("kind").isIn(["birthday","due"]),validateRequest,claimDailyFlash);
export default router;
