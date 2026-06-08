'use client'
import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import BarcodeScanner from '@/components/BarcodeScanner'
import { addNotification } from '@/lib/notifications'
import {
  Search, ScanBarcode, Plus, X, ChevronLeft, ChevronRight,
  ArrowDownCircle, Package, Calendar, TrendingUp, MoreVertical,
  Pencil, Trash2, Eye, RotateCcw, ChevronDown, Check
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

const REQUIRED_FIELDS = {
  product_id: 'Produk',
  quantity: 'Jumlah',
  buy_price: 'Harga Beli / Modal',
  date: 'Tanggal',
}

function getDateRange(preset) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  switch (preset) {
    case 'today': return { from: today, to: today }
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay())
      return { from: d.toISOString().split('T')[0], to: today }
    }
    case 'month': return { from: `${today.slice(0, 7)}-01`, to: today }
    case '3month': {
      const d = new Date(now); d.setMonth(d.getMonth() - 3)
      return { from: d.toISOString().split('T')[0], to: today }
    }
    case 'year': return { from: `${today.slice(0, 4)}-01-01`, to: today }
    default: return { from: '', to: '' }
  }
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white ${msg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
      {msg.text}
    </div>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="text-xs text-rose-500 mt-1">{msg}</p>
}

function Drawer({ show, onClose, title, children }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full flex flex-col z-10 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-rose-500" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">Hapus Transaksi?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Transaksi ini akan dihapus permanen. Stok tidak akan dikembalikan otomatis.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Batal</button>
          <button onClick={onConfirm} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-600">Hapus</button>
        </div>
      </div>
    </div>
  )
}

function ActionMenu({ onDetail, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const btnRef = useRef(null)

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < 150)
    }
    setOpen(!open)
  }

  return (
    <div className="relative">
      <button ref={btnRef} onClick={handleOpen} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-20 w-36 py-1 ${dropUp ? 'bottom-8' : 'top-8'}`}>
            <button onClick={() => { onDetail(); setOpen(false) }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"><Eye size={14} /> Detail</button>
            <button onClick={() => { onEdit(); setOpen(false) }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"><Pencil size={14} /> Edit</button>
            <button onClick={() => { onDelete(); setOpen(false) }} className="flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 w-full"><Trash2 size={14} /> Hapus</button>
          </div>
        </>
      )}
    </div>
  )
}

const inputCls = (hasError) =>
  `border rounded-xl p-2.5 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
    hasError ? 'border-rose-400 dark:border-rose-500' : 'border-gray-200 dark:border-gray-700'
  }`

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const current = options.find(o => o.value === value)
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm min-w-[140px]">
        <span>{current?.label || placeholder}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`absolute left-0 top-11 min-w-max bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top
        ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        {options.map(({ value: val, label }) => (
          <button key={val} onClick={() => { onChange(val); setOpen(false) }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors whitespace-nowrap
              ${value === val
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {label}
            {value === val && <Check size={13} className="ml-auto text-blue-500" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function SearchableSelect({ value, onChange, options, placeholder, hasError }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  const current = options.find(o => o.value === value)

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between w-full rounded-xl p-2.5 text-sm border bg-white dark:bg-gray-800 text-left transition-colors
          ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}
          ${hasError ? 'border-rose-400 dark:border-rose-500' : open ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-gray-200 dark:border-gray-700'}`}
      >
        <span className="truncate">{current?.label || placeholder}</span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute left-0 top-12 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top
        ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border-none outline-none placeholder-gray-400"
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Produk tidak ditemukan</div>
          ) : filtered.map(({ value: val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => { onChange(val); setOpen(false); setQuery('') }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                ${value === val
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {label}
              {value === val && <Check size={13} className="ml-auto text-blue-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StockInPage() {
  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [filtered, setFiltered] = useState([])
  const [form, setForm] = useState({ product_id: '', quantity: '', old_quantity: 0, buy_price: '', note: '', date: new Date().toISOString().split('T')[0], supplier: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSupplier, setFilterSupplier] = useState('all')
  const [filterPreset, setFilterPreset] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [sortBy, setSortBy] = useState('terbaru')
  const [page, setPage] = useState(1)
  const [scanContext, setScanContext] = useState('form')

  useEffect(() => { fetchProducts(); fetchHistory() }, [])

  useEffect(() => {
    let from = filterDateFrom
    let to = filterDateTo
    if (filterPreset !== 'all' && filterPreset !== 'custom') {
      const range = getDateRange(filterPreset)
      from = range.from; to = range.to
    }
    let result = [...history]
    if (search) result = result.filter(h =>
      h.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.products?.barcode?.includes(search)
    )
    if (filterCategory !== 'all') result = result.filter(h => h.products?.category === filterCategory)
    if (filterSupplier !== 'all') result = result.filter(h => h.supplier === filterSupplier)
    if (from) result = result.filter(h => h.date >= from)
    if (to) result = result.filter(h => h.date <= to)
    if (sortBy === 'terbaru') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sortBy === 'terlama') result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    if (sortBy === 'jumlah-desc') result.sort((a, b) => b.quantity - a.quantity)
    if (sortBy === 'jumlah-asc') result.sort((a, b) => a.quantity - b.quantity)
    setFiltered(result)
    setPage(1)
  }, [history, search, filterCategory, filterSupplier, filterPreset, filterDateFrom, filterDateTo, sortBy])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, barcode, unit, image_url, category').order('name')
    setProducts(data || [])
  }

  async function fetchHistory() {
    setFetching(true)
    const { data } = await supabase
      .from('stock_in')
      .select('*, products(name, unit, barcode, image_url, category)')
      .order('created_at', { ascending: false })
    setHistory(data || [])
    setFetching(false)
  }

  function validateForm() {
    const errors = {}
    for (const [key, label] of Object.entries(REQUIRED_FIELDS)) {
      if (!form[key] || String(form[key]).trim() === '') {
        errors[key] = `${label} wajib diisi`
      }
    }
    return errors
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (fieldErrors[key]) setFieldErrors(e => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstKey = Object.keys(errors)[0]
      document.getElementById(`field-${firstKey}`)?.focus()
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (editId) {
      const difference = parseInt(form.quantity) - form.old_quantity
      const { error } = await supabase.from('stock_in').update({
        product_id: form.product_id,
        quantity: parseInt(form.quantity),
        buy_price: form.buy_price ? parseFloat(form.buy_price) : null,
        note: form.note || null,
        date: form.date,
        supplier: form.supplier || null,
      }).eq('id', editId)
      if (error) {
        setToast({ type: 'error', text: 'Gagal update transaksi' })
      } else {
        if (difference > 0) await supabase.rpc('increment_stock', { product_id: form.product_id, amount: difference })
        else if (difference < 0) await supabase.rpc('decrement_stock', { product_id: form.product_id, amount: Math.abs(difference) })
        setToast({ type: 'success', text: 'Transaksi berhasil diupdate' })
      }
      setEditId(null)
    } else {
      const { error } = await supabase.from('stock_in').insert({
        product_id: form.product_id,
        quantity: parseInt(form.quantity),
        buy_price: form.buy_price ? parseFloat(form.buy_price) : null,
        note: form.note || null,
        date: form.date,
        supplier: form.supplier || null,
        user_id: user.id,
      })
      if (error) { setToast({ type: 'error', text: 'Gagal menyimpan data' }); setLoading(false); return }
      await supabase.rpc('increment_stock', { product_id: form.product_id, amount: parseInt(form.quantity) })
      const produk = products.find(p => p.id === form.product_id)
      addNotification({
        type: 'stock_in',
        message: `Barang masuk: ${produk?.name || 'Produk'} +${form.quantity} ${produk?.unit || ''}`,
        link: '/stock-in',
      })
      setToast({ type: 'success', text: 'Barang masuk berhasil dicatat' })
    }

    resetForm()
    setLoading(false)
    setShowForm(false)
    fetchHistory()
  }

  async function handleDelete() {
    await supabase.rpc('decrement_stock', { product_id: deleteTarget.product_id, amount: deleteTarget.quantity })
    const { error } = await supabase.from('stock_in').delete().eq('id', deleteTarget.id)
    if (error) setToast({ type: 'error', text: 'Gagal hapus transaksi' })
    else setToast({ type: 'success', text: 'Transaksi berhasil dihapus' })
    setDeleteTarget(null)
    fetchHistory()
  }

  function handleEdit(item) {
    setEditId(item.id)
    setForm({
      product_id: item.product_id,
      quantity: item.quantity,
      old_quantity: item.quantity,
      buy_price: item.buy_price || '',
      note: item.note || '',
      date: item.date,
      supplier: item.supplier || '',
    })
    setFieldErrors({})
    setShowForm(true)
  }

  function resetForm() {
    setForm({ product_id: '', quantity: '', old_quantity: 0, buy_price: '', note: '', date: new Date().toISOString().split('T')[0], supplier: '' })
    setFieldErrors({})
    setEditId(null)
  }

  function resetFilter() {
    setSearch(''); setFilterCategory('all'); setFilterSupplier('all')
    setFilterPreset('all'); setFilterDateFrom(''); setFilterDateTo('')
    setShowCustomDate(false); setSortBy('terbaru')
  }

  function handlePresetChange(val) {
    setFilterPreset(val)
    setShowCustomDate(val === 'custom')
    if (val !== 'custom') { setFilterDateFrom(''); setFilterDateTo('') }
  }

  function handleBarcodeDetected(code) {
    if (scanContext === 'search') {
      setSearch(code)
      setToast({ type: 'success', text: `Barcode: ${code}` })
    } else {
      const product = products.find(p => p.barcode === code)
      if (product) {
        setField('product_id', product.id)
        setToast({ type: 'success', text: `Produk: ${product.name}` })
        setShowForm(true)
      } else {
        setToast({ type: 'error', text: 'Produk tidak ditemukan' })
      }
    }
  }

  function formatDateTime(str) {
    if (!str) return '-'
    return new Date(str).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(str) {
    if (!str) return '-'
    return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const suppliers = [...new Set(history.map(h => h.supplier).filter(Boolean))]
  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const stats = {
    total: history.length,
    totalItem: history.reduce((s, h) => s + h.quantity, 0),
    today: history.filter(h => h.date === today).reduce((s, h) => s + h.quantity, 0),
    month: history.filter(h => h.date?.startsWith(thisMonth)).reduce((s, h) => s + h.quantity, 0),
  }

  const totalPage = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  function getPaginationPages() {
    const pages = []
    for (let i = 1; i <= totalPage; i++) {
      if (i === 1 || i === totalPage || Math.abs(i - page) <= 1) pages.push(i)
      else if (pages[pages.length - 1] !== '...') pages.push('...')
    }
    return pages
  }

  const productOptions = products.map(p => ({ value: p.id, label: p.name }))

  const presetOptions = [
    { value: 'all', label: 'Semua Waktu' },
    { value: 'today', label: 'Hari Ini' },
    { value: 'week', label: 'Minggu Ini' },
    { value: 'month', label: 'Bulan Ini' },
    { value: '3month', label: '3 Bulan Terakhir' },
    { value: 'year', label: 'Tahun Ini' },
    { value: 'custom', label: 'Rentang Custom' },
  ]
  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori' },
    ...categories.map(c => ({ value: c, label: c }))
  ]
  const supplierOptions = [
    { value: 'all', label: 'Semua Supplier' },
    ...suppliers.map(s => ({ value: s, label: s }))
  ]
  const sortOptions = [
    { value: 'terbaru', label: 'Terbaru' },
    { value: 'terlama', label: 'Terlama' },
    { value: 'jumlah-desc', label: 'Jumlah Terbanyak' },
    { value: 'jumlah-asc', label: 'Jumlah Tersedikit' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {deleteTarget && <DeleteModal item={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {showScanner && (
        <BarcodeScanner
          onDetected={code => { handleBarcodeDetected(code); setShowScanner(false) }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Detail Drawer */}
      <Drawer show={!!showDetail} onClose={() => setShowDetail(null)} title="Detail Transaksi">
        {showDetail && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              {showDetail.products?.image_url
                ? <img src={showDetail.products.image_url} className="w-12 h-12 rounded-xl object-cover" alt={showDetail.products.name} />
                : <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Package size={20} className="text-gray-400" /></div>
              }
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{showDetail.products?.name}</p>
                <p className="text-xs text-gray-400 font-mono">{showDetail.products?.barcode || '-'}</p>
              </div>
            </div>
            {[
              { label: 'Jumlah Masuk', value: `+${showDetail.quantity} ${showDetail.products?.unit}` },
              { label: 'Harga Beli', value: showDetail.buy_price ? `Rp ${Number(showDetail.buy_price).toLocaleString('id-ID')}` : '-' },
              { label: 'Supplier', value: showDetail.supplier || '-' },
              { label: 'Tanggal', value: formatDate(showDetail.date) },
              { label: 'Waktu Input', value: formatDateTime(showDetail.created_at) },
              { label: 'Catatan', value: showDetail.note || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* Form Drawer */}
      <Drawer show={showForm} onClose={() => { setShowForm(false); resetForm() }} title={editId ? 'Edit Transaksi' : 'Catat Barang Masuk'}>
        <form onSubmit={handleSubmit} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} noValidate className="flex flex-col gap-4">

          {/* Produk — pakai SearchableSelect */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Produk <span className="text-rose-500">*</span></label>
            <div className="flex gap-2" id="field-product_id">
              <SearchableSelect
                value={form.product_id}
                onChange={val => setField('product_id', val)}
                options={productOptions}
                placeholder="Pilih produk"
                hasError={!!fieldErrors.product_id}
              />
              <button type="button" onClick={() => { setScanContext('form'); setShowScanner(true) }}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
                <ScanBarcode size={16} />
              </button>
            </div>
            <FieldError msg={fieldErrors.product_id} />
            <p className="text-xs text-gray-400 mt-1">Pilih produk atau scan barcode</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Jumlah <span className="text-rose-500">*</span></label>
              <div className="flex">
                <input id="field-quantity" type="number" min="1" placeholder="0" value={form.quantity} onChange={e => setField('quantity', e.target.value)}
                  className={`border rounded-l-xl p-2.5 text-sm flex-1 min-w-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${fieldErrors.quantity ? 'border-rose-400 dark:border-rose-500' : 'border-gray-200 dark:border-gray-700'}`}
                />
                <span className="border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-xl px-3 flex items-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800">
                  {products.find(p => p.id === form.product_id)?.unit || 'pcs'}
                </span>
              </div>
              <FieldError msg={fieldErrors.quantity} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Harga Beli / Modal <span className="text-rose-500">*</span></label>
              <input id="field-buy_price" type="number" min="0" placeholder="0" value={form.buy_price} onChange={e => setField('buy_price', e.target.value)} className={inputCls(fieldErrors.buy_price)} />
              <FieldError msg={fieldErrors.buy_price} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tanggal <span className="text-rose-500">*</span></label>
            <input id="field-date" type="date" value={form.date} onChange={e => setField('date', e.target.value)} className={inputCls(fieldErrors.date)} />
            <FieldError msg={fieldErrors.date} />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Supplier <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input placeholder="Nama supplier" value={form.supplier} onChange={e => setField('supplier', e.target.value)} className={inputCls(false)} list="supplier-list" />
            <datalist id="supplier-list">
              {suppliers.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Catatan <span className="text-gray-400 font-normal">(opsional)</span></label>
            <textarea placeholder="Tambah catatan" value={form.note} onChange={e => setField('note', e.target.value)} rows={3} className={inputCls(false) + ' resize-none'} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white rounded-xl p-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
              {loading ? 'Menyimpan...' : editId ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Drawer>

      <div className="px-4 md:px-6 py-6 max-w-8xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Barang Masuk</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Catat restok dan penambahan stok</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setScanContext('form'); setShowScanner(true) }} className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium bg-white dark:bg-gray-900">
              <ScanBarcode size={15} /> <span className="hidden sm:inline">Scan Barcode</span>
            </button>
            <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-700 font-medium">
              <Plus size={16} /> <span className="hidden sm:inline">Tambah Barang</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/60 p-3 rounded-xl shrink-0"><ArrowDownCircle size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
            <div className="min-w-0">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">Total Riwayat</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.total}</p>
              <p className="text-xs text-emerald-500 dark:text-emerald-500">transaksi</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/60 p-3 rounded-xl shrink-0"><Package size={20} className="text-blue-600 dark:text-blue-400" /></div>
            <div className="min-w-0">
              <p className="text-xs text-blue-500 dark:text-blue-400 mb-0.5">Total Item Masuk</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalItem}</p>
              <p className="text-xs text-blue-400 dark:text-blue-500">item</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/60 p-3 rounded-xl shrink-0"><Calendar size={20} className="text-purple-600 dark:text-purple-400" /></div>
            <div className="min-w-0">
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-0.5">Hari Ini</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.today}</p>
              <p className="text-xs text-purple-400 dark:text-purple-500">item</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/60 p-3 rounded-xl shrink-0"><TrendingUp size={20} className="text-amber-600 dark:text-amber-400" /></div>
            <div className="min-w-0">
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-0.5">Bulan Ini</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.month}</p>
              <p className="text-xs text-amber-500 dark:text-amber-500">item</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Cari produk / barcode..." value={search} onChange={e => setSearch(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <button onClick={() => { setScanContext('search'); setShowScanner(true) }}
                className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                <ScanBarcode size={15} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <CustomSelect value={filterPreset} onChange={val => handlePresetChange(val)} options={presetOptions} placeholder="Semua Waktu" />
              {showCustomDate && (
                <>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm dark:[color-scheme:dark]" />
                  <span className="flex items-center text-gray-400 text-sm">—</span>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm dark:[color-scheme:dark]" />
                </>
              )}
              <CustomSelect value={filterCategory} onChange={setFilterCategory} options={categoryOptions} placeholder="Semua Kategori" />
              <CustomSelect value={filterSupplier} onChange={setFilterSupplier} options={supplierOptions} placeholder="Semua Supplier" />
              <CustomSelect value={sortBy} onChange={setSortBy} options={sortOptions} placeholder="Terbaru" />
              <button onClick={resetFilter} className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table Desktop */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Tanggal</th>
                <th className="px-5 py-3 text-left">Produk</th>
                <th className="px-5 py-3 text-left">Supplier</th>
                <th className="px-5 py-3 text-left">Jumlah</th>
                <th className="px-5 py-3 text-left">Harga Beli</th>
                <th className="px-5 py-3 text-left">Catatan</th>
                <th className="px-5 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fetching && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                  {[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}
                </tr>
              ))}
              {!fetching && paginated.map(h => (
                <tr key={h.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDateTime(h.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {h.products?.image_url
                        ? <img src={h.products.image_url} className="w-9 h-9 rounded-lg object-cover shrink-0" alt={h.products.name} />
                        : <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0"><Package size={14} className="text-gray-400" /></div>
                      }
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{h.products?.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{h.products?.barcode || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-sm">{h.supplier || '-'}</td>
                  <td className="px-5 py-3">
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs px-2.5 py-1 rounded-full">
                      +{h.quantity} {h.products?.unit}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{h.buy_price ? `Rp ${Number(h.buy_price).toLocaleString('id-ID')}` : '-'}</td>
                  <td className="px-5 py-3 text-gray-400 text-sm max-w-32 truncate">{h.note || '-'}</td>
                  <td className="px-5 py-3">
                    <ActionMenu onDetail={() => setShowDetail(h)} onEdit={() => handleEdit(h)} onDelete={() => setDeleteTarget(h)} />
                  </td>
                </tr>
              ))}
              {!fetching && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <ArrowDownCircle size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Belum ada data barang masuk</p>
                    <button onClick={() => { resetForm(); setShowForm(true) }} className="mt-3 text-emerald-600 text-sm hover:underline">+ Catat sekarang</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards Mobile */}
        <div className="md:hidden flex flex-col gap-3 mb-4">
          {fetching && [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded mb-2 w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
          {!fetching && paginated.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <ArrowDownCircle size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada data</p>
            </div>
          )}
          {paginated.map(h => (
            <div key={h.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {h.products?.image_url
                    ? <img src={h.products.image_url} className="w-11 h-11 rounded-xl object-cover shrink-0" alt={h.products.name} />
                    : <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0"><Package size={16} className="text-gray-400" /></div>
                  }
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{h.products?.name}</p>
                    <p className="text-xs text-gray-400">{h.supplier || 'Tanpa supplier'}</p>
                    <p className="text-xs text-gray-400 font-mono">{h.products?.barcode || '-'}</p>
                  </div>
                </div>
                <ActionMenu onDetail={() => setShowDetail(h)} onEdit={() => handleEdit(h)} onDelete={() => setDeleteTarget(h)} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs px-2.5 py-1 rounded-full">
                  +{h.quantity} {h.products?.unit}
                </span>
                <span className="text-xs text-gray-400">{formatDateTime(h.created_at)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{h.buy_price ? `Rp ${Number(h.buy_price).toLocaleString('id-ID')}` : 'Harga tidak dicatat'}</span>
              </div>
              {h.note && <p className="text-xs text-gray-400 mt-1 border-t border-gray-100 dark:border-gray-800 pt-2">{h.note}</p>}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-3">
            <p className="text-xs text-gray-400">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} data
            </p>
            <div className="flex gap-1 items-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                Previous
              </button>
              {getPaginationPages().map((n, i) =>
                n === '...'
                  ? <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                  : <button key={n} onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-sm ${page === n ? 'bg-emerald-600 text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                      {n}
                    </button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPage, p + 1))} disabled={page === totalPage}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}

        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center z-40">
          <Plus size={24} />
        </button>

      </div>
    </div>
  )
}