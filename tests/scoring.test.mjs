import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

async function sourceModule(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
}

const scoring = await sourceModule("../src/lib/scoring.ts");
const dates = await sourceModule("../src/data/types.ts");
const base = {
  id: "fixture",
  name: "Fixture",
  issuer: "Example",
  network: "Visa",
  country: "US",
  annualFee: 35,
  annualFeeCurrency: "USD",
  fxFee: 2,
  rewardRate: "1%",
  rewardRateBest: 1,
  welcomeBonus: "",
  eligibility: "Example",
  features: [],
  categories: [],
  description: "Test fixture",
  applyUrl: "https://example.com",
  color: "",
};

test("beginner fee comparison uses the same currency basis", () => {
  const usd = scoring.automatedScore(base, "beginner");
  const yen = scoring.automatedScore(
    { ...base, annualFee: 5000, annualFeeCurrency: "JPY" },
    "beginner",
  );
  assert.equal(usd, yen);
});

test("repeated feature tags cannot inflate automated score", () => {
  assert.equal(
    scoring.automatedScore({ ...base, features: ["golf", "golf"] }),
    scoring.automatedScore({ ...base, features: ["golf"] }),
  );
});

test("ranking leaves the source catalogue order intact", () => {
  const cards = [base, { ...base, id: "premium", features: ["priority-pass"] }];
  assert.equal(scoring.rankCards(cards)[0].id, "premium");
  assert.equal(cards[0].id, "fixture");
});

test("future and malformed dates are not labelled newly added", () => {
  const now = new Date("2026-10-17T12:00:00Z");
  assert.equal(dates.isNewCard({ ...base, addedAt: "2030-01-01" }, now), false);
  assert.equal(dates.isNewCard({ ...base, addedAt: "invalid" }, now), false);
  assert.equal(dates.isNewCard({ ...base, addedAt: "2026-10-16" }, now), true);
});

test("scores stay within their documented bounds for catalogue fixtures", () => {
  for (const fee of [0, 35, 1000, 100000]) {
    const score = scoring.optimizerScore({ ...base, annualFee: fee }, "travel");
    assert.ok(Number.isFinite(score) && score >= 0 && score <= 100);
  }
});
