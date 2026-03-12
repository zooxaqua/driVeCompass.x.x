"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const {
  calculateFuelCost,
  buildRouteComparisons,
  buildExperienceValue
} = require("../../../20_project/22_src/back/route_logic");
const { mapToComparisonCards } = require("../../../20_project/22_src/front/view_model");

function run() {
  const inputPath = path.resolve(__dirname, "../input/unit_cases.json");
  const outputPath = path.resolve(__dirname, "../output/unit_result.txt");
  const input = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const lines = [];
  lines.push("[UNIT] start");

  const fuelCost = calculateFuelCost(
    input.fuelCost.distanceKm,
    input.fuelCost.fuelEfficiencyKmL,
    input.fuelCost.fuelPriceYenPerL
  );
  assert.strictEqual(fuelCost, input.fuelCost.expectedFuelCostYen);
  lines.push("PASS calculateFuelCost normal");

  assert.throws(() => calculateFuelCost(10, 0, 170));
  lines.push("PASS calculateFuelCost abnormal");

  const routes = buildRouteComparisons({
    baseDistanceKm: 120,
    baseDurationMin: 150,
    fuelEfficiencyKmL: 15,
    fuelPriceYenPerL: 170
  });
  assert.strictEqual(routes.length, 3);
  lines.push("PASS buildRouteComparisons normal");

  const cards = mapToComparisonCards(routes);
  assert.strictEqual(cards[0].title, "fastest");
  lines.push("PASS mapToComparisonCards normal");

  const experience = buildExperienceValue(
    input.experience.fastestCostYen,
    input.experience.candidateCostYen
  );
  assert.strictEqual(experience.diffYen, input.experience.expectedDiffYen);
  lines.push("PASS buildExperienceValue normal");

  const noDiff = buildExperienceValue(3000, 3200);
  assert.strictEqual(noDiff.message, "差額なし（または節約効果なし）");
  lines.push("PASS buildExperienceValue abnormal");

  lines.push("[UNIT] all pass");
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf-8");
  process.stdout.write(`${lines.join("\n")}\n`);
}

run();
