import { param, query } from "express-validator";

export const notificationIdValidator = [
  param("id").isMongoId().withMessage("Invalid notification ID"),
];

export const listNotificationsValidator = [
  query("isRead").optional({ checkFalsy: true }).isBoolean(),
  query("type")
    .optional({ checkFalsy: true })
    .isIn([
      "announcement",
      "fee_reminder",
      "attendance",
      "belt_test",
      "championship",
      "certificate",
      "id_card",
      "system",
    ]),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];