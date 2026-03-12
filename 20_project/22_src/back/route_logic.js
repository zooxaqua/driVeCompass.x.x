"use strict";

function roundYen(value) {
  return Math.round(value);
}

function calculateFuelCost(distanceKm, fuelEfficiencyKmL, fuelPriceYenPerL) {
  if (fuelEfficiencyKmL <= 0) {
    throw new Error("fuelEfficiencyKmL must be greater than zero");
  }
  if (distanceKm < 0 || fuelPriceYenPerL < 0) {
    throw new Error("distance and fuel price must be non-negative");
  }
  const liters = distanceKm / fuelEfficiencyKmL;
  return roundYen(liters * fuelPriceYenPerL);
}

function buildRouteComparisons(input) {
  const { baseDistanceKm, baseDurationMin, fuelEfficiencyKmL, fuelPriceYenPerL } = input;
  const templates = [
    { type: "fastest", distanceFactor: 1.0, durationFactor: 1.0, tollYen: 4200 },
    { type: "smart_saving", distanceFactor: 1.05, durationFactor: 1.15, tollYen: 2300 },
    { type: "full_saving", distanceFactor: 1.12, durationFactor: 1.45, tollYen: 0 }
  ];

  return templates.map((route) => {
    const distanceKm = Number((baseDistanceKm * route.distanceFactor).toFixed(1));
    const durationMin = Math.round(baseDurationMin * route.durationFactor);
    const fuelCostYen = calculateFuelCost(distanceKm, fuelEfficiencyKmL, fuelPriceYenPerL);
    const totalCostYen = fuelCostYen + route.tollYen;
    return {
      type: route.type,
      distanceKm,
      durationMin,
      tollYen: route.tollYen,
      fuelCostYen,
      totalCostYen
    };
  });
}

function buildExperienceValue(fastestCostYen, candidateCostYen) {
  const diffYen = fastestCostYen - candidateCostYen;
  if (diffYen <= 0) {
    return {
      diffYen,
      message: "差額なし（または節約効果なし）"
    };
  }
  if (diffYen >= 3000) {
    return {
      diffYen,
      message: "現地ランチ2人分に相当"
    };
  }
  return {
    diffYen,
    message: "ご当地スイーツ2人分に相当"
  };
}

module.exports = {
  calculateFuelCost,
  buildRouteComparisons,
  buildExperienceValue
};
