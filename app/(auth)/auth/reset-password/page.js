'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (password !== confirm) return setError('Password tidak sama')
    if (password.length < 8) return setError('Minimal 8 karakter')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else router.push('/dashboard?message=password_updated')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Buat Password Baru</h1>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Password baru"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Konfirmasi password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </div>
      </div>
    </div>
  )
}