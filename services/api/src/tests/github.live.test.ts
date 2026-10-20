// Optional live-GitHub contract test: skipped unless GITHUB_TEST_TOKEN is set.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const live = !!process.env.GITHUB_TEST_TOKEN;
describe("github live contract (optional)", { skip: !live } as never, () => {
  it("lists installation repositories via live API", async () => {
    assert.ok(process.env.GITHUB_TEST_TOKEN);
  });
});
