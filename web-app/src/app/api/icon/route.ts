import { NextRequest, NextResponse } from 'next/server'

// Generates a simple SVG icon as PNG-like response for PWA
export async function GET(req: NextRequest) {
  const size = req.nextUrl.searchParams.get('size') ?? '192'
  const s = parseInt(size)
  const r = Math.round(s * 0.2)
  const cx = s / 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#1a1f36"/>
  <circle cx="${cx}" cy="${cx}" r="${s * 0.28}" fill="none" stroke="white" stroke-width="${s * 0.055}" opacity="0.9"/>
  <line x1="${cx}" y1="${s * 0.28}" x2="${cx}" y2="${s * 0.72}" stroke="white" stroke-width="${s * 0.055}" stroke-linecap="round" opacity="0.9"/>
  <line x1="${s * 0.28}" y1="${cx}" x2="${s * 0.72}" y2="${cx}" stroke="white" stroke-width="${s * 0.055}" stroke-linecap="round" opacity="0.9"/>
</svg>`

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  })
}
