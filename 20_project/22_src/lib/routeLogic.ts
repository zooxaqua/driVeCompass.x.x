"use strict";

export interface RouteInput {
  baseDistanceKm: number;
  baseDurationMin: number;
  fuelEfficiencyKmL: number;
  fuelPriceYenPerL: number;
}

export interface RouteComparison {
  type: string;
  distanceKm: number;
  durationMin: number;
  tollYen: number;
  fuelCostYen: number;
  totalCostYen: number;
}

export interface ExperienceValue {
  diffYen: number;
  message: string;
}

function roundYen(value: number): number {
  return Math.round(value);
}

export function calculateFuelCost(
  distanceKm: number,
  fuelEfficiencyKmL: number,
  fuelPriceYenPerL: number
): number {
  if (fuelEfficiencyKmL <= 0) {
    throw new Error("fuelEfficiencyKmL must be greater than zero");
  }
  if (distanceKm < 0 || fuelPriceYenPerL < 0) {
    throw new Error("distance and fuel price must be non-negative");
  }
  const liters = distanceKm / fuelEfficiencyKmL;
  return roundYen(liters * fuelPriceYenPerL);
}

export function buildRouteComparisons(input: RouteInput): RouteComparison[] {
  const { baseDistanceKm, baseDurationMin, fuelEfficiencyKmL, fuelPriceYenPerL } = input;
  const templates = [
    { type: "fastest", distanceFactor: 1.0, durationFactor: 1.0, tollYen: 4200 },
    { type: "smart_saving", distanceFactor: 1.05, durationFactor: 1.15, tollYen: 2300 },
    { type: "full_saving", distanceFactor: 1.12, durationFactor: 1.45, tollYen: 0 },
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
      totalCostYen,
    };
  });
}

export function buildExperienceValue(
  fastestCostYen: number,
  candidateCostYen: number
): ExperienceValue {
  const diffYen = fastestCostYen - candidateCostYen;
  if (diffYen <= 0) {
    return {
      diffYen,
      message: "差額なし（または節約効果なし）",
    };
  }
  if (diffYen >= 3000) {
    return {
      diffYen,
      message: "現地ランチ2人分に相当",
    };
  }
  return {
    diffYen,
    message: "ご当地スイーツ2人分に相当",
  };
}
