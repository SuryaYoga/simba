'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle, FileText, HelpCircle, Settings, LogOut, Menu, X, ChevronRight, ChevronLeft } from 'lucide-react'
import NotificationPanel from './NotificationPanel'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produk', icon: Package },
  { href: '/stock-in', label: 'Barang Masuk', icon: ArrowDownCircle },
  { href: '/stock-out', label: 'Barang Keluar', icon: ArrowUpCircle },
  { href: '/laporan', label: 'Laporan', icon: FileText },
  { href: '/bantuan', label: 'Bantuan', icon: HelpCircle },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar({ lowStock = 0, profile = null }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const el = document.getElementById('main-content')
    if (!el) return
    const isMobile = window.innerWidth < 768
    if (isMobile) return
    el.style.marginLeft = collapsed ? '4rem' : '16rem'
  }, [collapsed])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavLinks = ({ onClick, mini }) => (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} onClick={onClick}
            title={mini ? label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative group
              ${active
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'}
              ${mini ? 'justify-center' : ''}`}>
            <Icon size={18} className="shrink-0" />
            {!mini && <span className="truncate">{label}</span>}
            {!mini && active && <ChevronRight size={14} className="ml-auto shrink-0" />}
            {mini && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {label}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={{ background: 'var(--sidebar-bg, #1a1f2e)' }} className={`hidden md:flex flex-col min-h-screen fixed top-0 left-0 z-30 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo */}
      <div className={`border-b border-white/10 ${collapsed ? 'px-3 py-3' : 'p-0'}`}>
        {!collapsed ? (
          <div className="relative w-full">
            <video
              ref={(el) => { if (el) { el.muted = true; el.play().catch(() => {}) } }}
              loop={true}
              playsInline={true}
              className="w-full block"
            >
              <source src="/logo-video.webm" type="video/webm" />
              <source src="/logo-video.mp4" type="video/mp4" />
            </video>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute top-1/2 -translate-y-1/2 right-2 text-white hover:text-blue-300 bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-white transition-colors mx-auto flex"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

        {/* Nav */}
        <div className="px-3 flex-1">
          <NavLinks mini={collapsed} />
        </div>

        {/* Bottom: profile + logout */}
        <div className="mt-auto px-3 pb-5 border-t border-white/10 pt-4">
          {!collapsed && (
            <Link href="/profile"
              className="flex items-center gap-3 px-2 mb-2 hover:bg-white/10 rounded-xl p-2 transition-colors cursor-pointer">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                    {profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/profile" className="flex justify-center mb-2 py-2 hover:bg-white/10 rounded-xl transition-colors">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                : <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                    {profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
              }
            </Link>
          )}
          <div className={`mb-1 ${collapsed ? 'flex justify-center py-2' : 'px-1 py-1'}`}>
            <NotificationPanel mode="desktop" sidebarCollapsed={collapsed} />
          </div>
          <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 w-full transition-all ${collapsed ? 'justify-center' : ''}`}>
            <LogOut size={18} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div style={{ background: '#1a1f2e' }} className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white">
          <Menu size={22} />
        </button>
        <span className="font-bold text-white">SIMBA</span>
        <NotificationPanel />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div style={{ background: '#1a1f2e' }} className="relative w-72 h-full flex flex-col px-4 py-6 z-10">
            <div className="flex items-center justify-between mb-6 px-2">
            <video
              ref={(el) => { if (el) { el.muted = true; el.play().catch(() => {}) } }}
              loop={true}
              playsInline={true}
              className="h-12 w-auto block"
            >
              <source src="/logo-video.webm" type="video/webm" />
              <source src="/logo-video.mp4" type="video/mp4" />
            </video>
            <button onClick={() => setMobileOpen(false)}
              className="text-gray-400 hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>
            <Link href="/profile" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-2 mb-6 hover:bg-white/10 rounded-xl p-2 transition-colors">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold">
                    {profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
              }
              <div>
                <p className="font-medium text-white">{profile?.name || 'User'}</p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
            </Link>
            <NavLinks onClick={() => setMobileOpen(false)} />
            <div className="mt-auto pt-6 border-t border-white/10">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 w-full transition-colors">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}