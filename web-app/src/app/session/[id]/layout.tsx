'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/useSessionStore'
import { createServiceClient } from '@/lib/supabase/server'

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col">{children}</div>
}
