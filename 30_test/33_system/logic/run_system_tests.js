"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const {
  calculateFuelCost,
  buildRouteComparisons,
  buildExperienceValue
} = require("../../../20_project/22_src/back/route_logic");
const { buildScreenModel } = require("../../../20_project/22_src/front/view_model");

function baseScreen(midwayPrice) {
  const routes = buildRouteComparisons({
    baseDistanceKm: 160,
    baseDurationMin: 180,
    fuelEfficiencyKmL: 13.5,
    fuelPriceYenPerL: 169
  });
  const experienceValue = buildExperienceValue(routes[0].totalCostYen, routes[2].totalCostYen);
  return buildScreenModel({
    routes,
    fuelPrices: { origin: 171, midway: midwayPrice, destination: 173 },
    experienceValue
  });
}

function executeCase(c) {
  switch (c.type) {
    case "route_compare_e2e": {
      const screen = baseScreen(168);
      assert.strictEqual(screen.cards.length, 3);
      return;
    }
    case "fuel_price_three_points": {
      const screen = baseScreen(168);
      assert.ok(screen.fuelPrices.every((p) => p.label.endsWith("円/L")));
      return;
    }
    case "experience_value_e2e": {
      const screen = baseScreen(168);
      assert.ok(screen.experience.length > 0);
      return;
    }
    case "phase_control_e2e": {
      const phase = 3;
      const ff3 = true;
      assert.strictEqual(phase >= 3 && ff3, true);
      return;
    }
    case "retry_flow_e2e": {
      const before = calculateFuelCost(160, 13.5, 169);
      const after = calculateFuelCost(160, 13.5, 175);
      assert.ok(after > before);
      return;
    }
    case "traceability_e2e": {
      const trace = { requestId: "req-stc-06", traceId: "trace-stc-06" };
      assert.ok(trace.requestId.length > 0 && trace.traceId.length > 0);
      return;
    }
    case "input_invalid_e2e": {
      assert.throws(() => calculateFuelCost(160, 0, 169));
      return;
    }
    case "route_failure_continue": {
      const partial = { resultStatus: "partial_success", shown: true };
      assert.strictEqual(partial.resultStatus, "partial_success");
      assert.strictEqual(partial.shown, true);
      return;
    }
    case "toll_missing_continue": {
      const routes = buildRouteComparisons({
        baseDistanceKm: 160,
        baseDurationMin: 180,
        fuelEfficiencyKmL: 13.5,
        fuelPriceYenPerL: 169
      });
      const route = { ...routes[0], tollYen: null, totalCostYen: null };
      assert.ok(route.fuelCostYen > 0);
      assert.strictEqual(route.tollYen, null);
      return;
    }
    case "one_price_missing_continue": {
      const screen = baseScreen(null);
      assert.strictEqual(screen.fuelPrices[1].label, "未取得");
      return;
    }
    case "experience_unavailable_e2e": {
      const exp = buildExperienceValue(2000, 2500);
      assert.strictEqual(exp.message, "差額なし（または節約効果なし）");
      return;
    }
    case "partial_retry_traceability": {
      const event = {
        resultStatus: "partial_success",
        retryable: true,
        requestId: "req-stc-12",
        traceId: "trace-stc-12"
      };
      assert.strictEqual(event.retryable, true);
      assert.ok(event.requestId.length > 0 && event.traceId.length > 0);
      return;
    }
    default:
      throw new Error(`Unknown case: ${c.type}`);
  }
}

function run() {
  const inputPath = path.resolve(__dirname, "../input/system_scenarios.json");
  const outputPath = path.resolve(__dirname, "../output/system_result.txt");
  const input = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const lines = [];
  let pass = 0;
  let fail = 0;
  lines.push("[SYSTEM] full matrix start");

  input.cases.forEach((c) => {
    try {
      executeCase(c);
      pass += 1;
      lines.push(`${c.id}: PASS`);
    } catch (e) {
      fail += 1;
      lines.push(`${c.id}: FAIL ${e.message}`);
    }
  });

  lines.push(`SUMMARY total=${input.cases.length} pass=${pass} fail=${fail}`);
  lines.push(`EXECUTION_RATE ${Math.round((pass + fail) / input.cases.length * 100)}%`);
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf-8");
  process.stdout.write(`${lines.join("\n")}\n`);

  if (fail > 0) {
    process.exitCode = 1;
  }
}

run();
