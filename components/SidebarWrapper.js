'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NotificationPanel from './NotificationPanel'
import Sidebar from './Sidebar'

export default function SidebarWrapper() {
  const [lowStock, setLowStock] = useState(0)
  const [profile, setProfile] = useState(null)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password') {
      fetchData()
    }
  }, [pathname])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: products } = await supabase.from('products').select('stock, min_stock')
    const low = (products || []).filter(p => p.stock <= p.min_stock).length
    setLowStock(low)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
  }

  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') return null
  return <Sidebar lowStock={lowStock} profile={profile} />
  
}

