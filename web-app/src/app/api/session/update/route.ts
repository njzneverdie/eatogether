import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { sessionId, updates } = await req.json()
  if (!sessionId || !updates) {
    return NextResponse.json({ error: 'sessionId and updates required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('sessions').update(updates).eq('id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
