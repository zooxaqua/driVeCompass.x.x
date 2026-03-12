"use strict";

function mapToComparisonCards(routes) {
  return routes.map((route) => ({
    title: route.type,
    timeLabel: `${route.durationMin}分`,
    tollLabel: `${route.tollYen}円`,
    fuelLabel: `${route.fuelCostYen}円`,
    totalLabel: `${route.totalCostYen}円`
  }));
}

function buildFuelPricePanel(prices) {
  const points = ["origin", "midway", "destination"];
  return points.map((point) => {
    const price = prices[point];
    if (price == null) {
      return { point, label: "未取得" };
    }
    return { point, label: `${price}円/L` };
  });
}

function buildScreenModel(payload) {
  return {
    cards: mapToComparisonCards(payload.routes),
    fuelPrices: buildFuelPricePanel(payload.fuelPrices),
    experience: payload.experienceValue.message
  };
}

module.exports = {
  mapToComparisonCards,
  buildFuelPricePanel,
  buildScreenModel
};
