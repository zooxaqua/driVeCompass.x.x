import { NextResponse } from 'next/server'
import { buildRouteComparisons, buildExperienceValue } from '@/lib/routeLogic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { origin, destination, fuelEfficiencyKmL } = body

    if (!origin || !destination || fuelEfficiencyKmL == null) {
      return NextResponse.json(
        { status: 'error', message: '必須項目が不足しています (origin, destination, fuelEfficiencyKmL)' },
        { status: 400 }
      )
    }

    const baseDistanceKm = 150
    const baseDurationMin = 120
    const fuelPriceYenPerL = 170

    const routes = buildRouteComparisons({
      baseDistanceKm,
      baseDurationMin,
      fuelEfficiencyKmL: Number(fuelEfficiencyKmL),
      fuelPriceYenPerL,
    })

    const fastestCost = routes[0].totalCostYen
    const fullSavingCost = routes[routes.length - 1].totalCostYen
    const experienceValue = buildExperienceValue(fastestCost, fullSavingCost)

    return NextResponse.json({
      status: 'success',
      routes,
      experienceValue,
    })
  } catch (err) {
    console.error('[POST /api/comparisons]', err)
    return NextResponse.json(
      { status: 'error', message: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
