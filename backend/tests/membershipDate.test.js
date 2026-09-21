import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/khiladi_membership_date_test";
process.env.JWT_ACCESS_SECRET ||= "membership-date-access-secret-with-at-least-32-chars";
process.env.JWT_REFRESH_SECRET ||= "membership-date-refresh-secret-with-at-least-32-chars";

const { parseMembershipDate } = await import("../src/services/membershipService.js");

test("custom due date remains the selected calendar day", () => {
  assert.equal(
    parseMembershipDate("2026-09-01", "Due date").toISOString(),
    "2026-09-01T00:00:00.000Z",
  );
});

test("calendar validation rejects an invalid custom due date", () => {
  assert.throws(
    () => parseMembershipDate("not-a-date", "Due date"),
    /Due date is invalid/,
  );
  assert.throws(
    () => parseMembershipDate("2026-02-31", "Due date"),
    /Due date is invalid/,
  );
});
