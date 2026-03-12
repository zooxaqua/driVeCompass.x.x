import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    phase: 1,
    flags: {
      showFuelPrice: false,
      showExperienceValue: false,
    },
  })
}
