"use strict";

import type { RouteComparison, ExperienceValue } from './routeLogic';

export interface ComparisonCard {
  title: string;
  timeLabel: string;
  tollLabel: string;
  fuelLabel: string;
  totalLabel: string;
}

export interface FuelPricePoint {
  point: string;
  label: string;
}

export interface ScreenModel {
  cards: ComparisonCard[];
  fuelPrices: FuelPricePoint[];
  experience: string;
}

export function mapToComparisonCards(routes: RouteComparison[]): ComparisonCard[] {
  return routes.map((route) => ({
    title: route.type,
    timeLabel: `${route.durationMin}分`,
    tollLabel: `${route.tollYen}円`,
    fuelLabel: `${route.fuelCostYen}円`,
    totalLabel: `${route.totalCostYen}円`,
  }));
}

export function buildFuelPricePanel(
  prices: Record<string, number | undefined>
): FuelPricePoint[] {
  const points = ["origin", "midway", "destination"];
  return points.map((point) => {
    const price = prices[point];
    if (price == null) {
      return { point, label: "未取得" };
    }
    return { point, label: `${price}円/L` };
  });
}

export function buildScreenModel(payload: {
  routes: RouteComparison[];
  fuelPrices: Record<string, number | undefined>;
  experienceValue: ExperienceValue;
}): ScreenModel {
  return {
    cards: mapToComparisonCards(payload.routes),
    fuelPrices: buildFuelPricePanel(payload.fuelPrices),
    experience: payload.experienceValue.message,
  };
}
