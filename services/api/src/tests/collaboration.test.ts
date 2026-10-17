// Phase 9 collaboration unit tests: pure, no DB.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decodeCursor, encodeCursor, invalidMentions, validateBody } from "../persistence/collaborationRepository.js";
import { permissionsFor } from "../domain/authorization.js";

describe("phase9 cursors", () => {
  it("round-trips keyset cursor", () => {
    const c = encodeCursor("2026-10-17T00:00:00.000Z", "id-1");
    assert.deepEqual(decodeCursor(c), { c: "2026-10-17T00:00:00.000Z", id: "id-1" });
  });
  it("rejects garbage cursor as null", () => {
    assert.equal(decodeCursor("!!!"), null);
    assert.equal(decodeCursor(null), null);
  });
});

describe("phase9 comment rules", () => {
  it("accepts 1..4000 char bodies, rejects blanks", () => {
    assert.equal(validateBody(" hi "), "hi");
    assert.throws(() => validateBody("   "));
    assert.throws(() => validateBody("x".repeat(4001)));
  });
  it("rejects too many mentions", async () => {
    const q = async () => ({ rows: [] as { user_id: string }[] });
    await assert.rejects(() => invalidMentions(q, "o", Array.from({ length: 21 }, (_, i) => `u${i}`)), /too many/);
  });
  it("flags unknown users as invalid mentions", async () => {
    const q = async () => ({ rows: [{ user_id: "u1" }] });
    assert.deepEqual(await invalidMentions(q, "o", ["u1", "ghost"]), ["ghost"]);
  });
});

describe("phase9 permissions", () => {
  it("developer assigns + comments; client reads only", () => {
    assert.ok(permissionsFor("developer").includes("engineering.task.assign"));
    assert.ok(permissionsFor("developer").includes("collaboration.comment.create"));
    assert.ok(!permissionsFor("client").includes("engineering.task.assign"));
    assert.ok(permissionsFor("client").includes("collaboration.activity.read"));
  });
  it("designer comments but cannot assign", () => {
    assert.ok(permissionsFor("designer").includes("collaboration.comment.create"));
    assert.ok(!permissionsFor("designer").includes("engineering.task.assign"));
  });
});
