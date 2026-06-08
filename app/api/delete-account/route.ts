import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id

    // 1. Hapus stock_in & stock_out
    await supabaseAdmin.from('stock_in').delete().eq('user_id', userId)
    await supabaseAdmin.from('stock_out').delete().eq('user_id', userId)

    // 2. Hapus foto produk dari storage
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('image_url')
      .eq('user_id', userId)

    if (products && products.length > 0) {
      const imagePaths = products
        .filter(p => p.image_url)
        .map(p => {
          try {
            const url = new URL(p.image_url)
            const marker = '/object/public/product-images/'
            const idx = url.pathname.indexOf(marker)
            return idx !== -1 ? decodeURIComponent(url.pathname.slice(idx + marker.length)) : null
          } catch { return null }
        })
        .filter(Boolean) as string[]

      if (imagePaths.length > 0) {
        await supabaseAdmin.storage.from('product-images').remove(imagePaths)
      }
    }

    // 3. Hapus products
    await supabaseAdmin.from('products').delete().eq('user_id', userId)

    // 4. Hapus avatar dari storage
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profile?.avatar_url) {
      try {
        const url = new URL(profile.avatar_url)
        const match = url.pathname.match(/\/avatars\/(.+)/)
        if (match) await supabaseAdmin.storage.from('avatars').remove([match[1]])
      } catch {}
    }

    // 5. Hapus profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 6. Hapus auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}