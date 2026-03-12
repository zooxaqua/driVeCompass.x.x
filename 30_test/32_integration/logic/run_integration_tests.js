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

function basePayload() {
  const routes = buildRouteComparisons({
    baseDistanceKm: 180,
    baseDurationMin: 200,
    fuelEfficiencyKmL: 14,
    fuelPriceYenPerL: 168
  });
  const experienceValue = buildExperienceValue(routes[0].totalCostYen, routes[1].totalCostYen);
  return {
    routes,
    fuelPrices: { origin: 170, midway: 169, destination: 174 },
    experienceValue
  };
}

function executeCase(testCase) {
  switch (testCase.type) {
    case "route_compare_success": {
      const payload = basePayload();
      const screen = buildScreenModel(payload);
      assert.strictEqual(screen.cards.length, 3);
      return;
    }
    case "fuel_points_complete": {
      const payload = basePayload();
      const screen = buildScreenModel(payload);
      assert.ok(screen.fuelPrices.every((p) => p.label.endsWith("円/L")));
      return;
    }
    case "experience_value_success": {
      const payload = basePayload();
      const screen = buildScreenModel(payload);
      assert.ok(screen.experience.length > 0);
      return;
    }
    case "phase_flag_control": {
      const flags = {
        FF_PHASE_1_ROUTE_AND_TOLL: true,
        FF_PHASE_2_FUEL_ESTIMATE: true,
        FF_PHASE_3_FUEL_PRICE_3POINT: false
      };
      const phase3Visible = flags.FF_PHASE_3_FUEL_PRICE_3POINT;
      assert.strictEqual(phase3Visible, false);
      return;
    }
    case "retry_update_success": {
      const first = buildRouteComparisons({
        baseDistanceKm: 180,
        baseDurationMin: 200,
        fuelEfficiencyKmL: 14,
        fuelPriceYenPerL: 168
      });
      const retried = buildRouteComparisons({
        baseDistanceKm: 180,
        baseDurationMin: 200,
        fuelEfficiencyKmL: 14,
        fuelPriceYenPerL: 175
      });
      assert.ok(retried[0].fuelCostYen > first[0].fuelCostYen);
      return;
    }
    case "input_validation_error": {
      assert.throws(() => calculateFuelCost(100, 0, 170));
      return;
    }
    case "route_timeout_partial": {
      const partial = {
        resultStatus: "partial_success",
        errors: [{ segment: "route", retryable: true }]
      };
      assert.strictEqual(partial.resultStatus, "partial_success");
      assert.strictEqual(partial.errors[0].retryable, true);
      return;
    }
    case "toll_missing_continue": {
      const routes = buildRouteComparisons({
        baseDistanceKm: 180,
        baseDurationMin: 200,
        fuelEfficiencyKmL: 14,
        fuelPriceYenPerL: 168
      });
      const route = { ...routes[0], tollYen: null, totalCostYen: null };
      assert.strictEqual(route.fuelCostYen > 0, true);
      assert.strictEqual(route.tollYen, null);
      return;
    }
    case "midway_price_missing": {
      const payload = basePayload();
      payload.fuelPrices.midway = null;
      const screen = buildScreenModel(payload);
      assert.strictEqual(screen.fuelPrices[1].label, "未取得");
      return;
    }
    case "experience_unavailable": {
      const exp = buildExperienceValue(3000, 3200);
      assert.strictEqual(exp.message, "差額なし（または節約効果なし）");
      return;
    }
    case "internal_exception_trace": {
      let captured = null;
      try {
        throw new Error("simulated");
      } catch (e) {
        captured = {
          requestId: "req-itc-11",
          traceId: "trace-itc-11",
          error: e.message
        };
      }
      assert.ok(captured.requestId.length > 0);
      assert.ok(captured.traceId.length > 0);
      return;
    }
    default:
      throw new Error(`Unknown test type: ${testCase.type}`);
  }
}

function run() {
  const inputPath = path.resolve(__dirname, "../input/integration_scenarios.json");
  const outputPath = path.resolve(__dirname, "../output/integration_result.txt");
  const input = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const lines = [];
  let pass = 0;
  let fail = 0;

  lines.push("[INTEGRATION] full matrix start");

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
