import assert from "node:assert/strict";
import test from "node:test";

import FeePayment from "../src/models/FeePayment.js";

test("collection idempotency index excludes null and empty legacy keys", () => {
  const definition = FeePayment.schema.indexes().find(([keys]) => keys.academy === 1 && keys.collectionKey === 1);
  assert.ok(definition, "collectionKey index must exist");
  const [, options] = definition;
  assert.equal(options.unique, true);
  assert.equal(options.sparse, undefined);
  assert.deepEqual(options.partialFilterExpression, {
    collectionKey: { $type: "string", $gt: "" },
  });
});
