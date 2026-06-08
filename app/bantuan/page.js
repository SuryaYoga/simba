'use client'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle,
  FileText, Settings, User, Search, ChevronDown, ChevronRight,
  Lightbulb, CheckCircle2, Info, X, BookOpen
} from 'lucide-react'
import faqs from './faqs.json'

const quickHelp = [
  {
    icon: LayoutDashboard,
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Dashboard',
    desc: 'Melihat ringkasan stok dan aktivitas toko',
    panduan: [
      { step: 1, title: 'Buka Dashboard', desc: 'Klik menu "Dashboard" di sidebar kiri untuk melihat ringkasan stok.' },
      { step: 2, title: 'Filter Periode', desc: 'Gunakan dropdown di kanan atas untuk melihat data per periode (hari ini, minggu, bulan, tahun, atau semua waktu).' },
      { step: 3, title: 'Stok Menipis', desc: 'Produk yang stoknya di bawah minimum akan muncul di bagian peringatan dengan tombol Restock.' },
      { step: 4, title: 'Grafik Tren', desc: 'Grafik menampilkan perbandingan barang masuk vs keluar 6 bulan terakhir.' },
      { step: 5, title: 'Produk Terlaris', desc: 'Lihat produk dengan penjualan terbanyak di periode yang dipilih.' },
    ]
  },
  {
    icon: Package,
    iconBg: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    title: 'Kelola Produk',
    desc: 'Cara menambah, mengedit, dan menghapus produk',
    panduan: [
      { step: 1, title: 'Tambah Produk', desc: 'Klik tombol "Tambah Produk" → isi nama, kategori, harga jual, harga beli, stok awal, dan barcode/SKU (wajib diisi).' },
      { step: 2, title: 'Scan Barcode', desc: 'Klik ikon kamera di samping input barcode untuk scan barcode dari kemasan produk.' },
      { step: 3, title: 'Upload Foto', desc: 'Klik area foto untuk upload gambar produk dari perangkatmu (opsional).' },
      { step: 4, title: 'Edit Produk', desc: 'Klik ikon pensil di baris produk untuk mengubah data produk. Harga beli tidak bisa diubah di sini — ubah di Barang Masuk.' },
      { step: 5, title: 'Hapus Produk', desc: 'Klik ikon hapus dan konfirmasi di dialog yang muncul.' },
      { step: 6, title: 'Search & Filter', desc: 'Gunakan kolom pencarian atau filter kategori/status untuk mencari produk.' },
    ]
  },
  {
    icon: ArrowDownCircle,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: 'Barang Masuk',
    desc: 'Panduan input stok masuk / restock produk',
    panduan: [
      { step: 1, title: 'Tambah Barang Masuk', desc: 'Klik "Tambah Barang" atau tombol scan di kanan atas halaman Barang Masuk.' },
      { step: 2, title: 'Pilih Produk', desc: 'Pilih produk dari dropdown atau scan barcode untuk otomatis mengisi produk.' },
      { step: 3, title: 'Isi Jumlah & Harga Beli', desc: 'Masukkan jumlah yang masuk dan harga beli / modal per satuan (wajib diisi).' },
      { step: 4, title: 'Isi Supplier', desc: 'Isi nama supplier jika ingin mencatat asal barang (opsional).' },
      { step: 5, title: 'Simpan', desc: 'Klik "Simpan" — stok produk otomatis bertambah sesuai jumlah yang diinput.' },
      { step: 6, title: 'Edit & Hapus', desc: 'Klik ikon titik tiga di baris transaksi untuk edit atau hapus.' },
    ]
  },
  {
    icon: ArrowUpCircle,
    iconBg: 'bg-orange-50 dark:bg-orange-950',
    iconColor: 'text-orange-500 dark:text-orange-400',
    title: 'Barang Keluar',
    desc: 'Panduan transaksi keluar / penjualan produk',
    panduan: [
      { step: 1, title: 'Tambah Barang Keluar', desc: 'Klik "Tambah Barang" atau scan barcode produk yang ingin dicatat.' },
      { step: 2, title: 'Pilih Produk', desc: 'Pilih produk — stok tersedia akan otomatis tampil.' },
      { step: 3, title: 'Isi Jumlah', desc: 'Masukkan jumlah yang keluar. Sistem akan validasi agar tidak melebihi stok.' },
      { step: 4, title: 'Pilih Alasan', desc: 'Pilih alasan keluar: Terjual, Rusak, Kadaluarsa, Retur, Hilang, atau Lainnya.' },
      { step: 5, title: 'Harga Otomatis', desc: 'Harga saat transaksi diambil otomatis dari data produk.' },
      { step: 6, title: 'Simpan', desc: 'Klik "Simpan" — stok otomatis berkurang.' },
    ]
  },
  {
    icon: FileText,
    iconBg: 'bg-rose-50 dark:bg-rose-950',
    iconColor: 'text-rose-500 dark:text-rose-400',
    title: 'Laporan',
    desc: 'Cara melihat dan export laporan ke PDF',
    panduan: [
      { step: 1, title: 'Buka Laporan', desc: 'Klik menu "Laporan" di sidebar untuk melihat analisis lengkap inventaris.' },
      { step: 2, title: 'Pilih Periode', desc: 'Pilih preset waktu (hari ini, minggu, bulan, tahun) atau gunakan Custom Range.' },
      { step: 3, title: 'Ringkasan', desc: 'Lihat total produk, nilai stok, barang masuk/keluar, dan estimasi keuntungan.' },
      { step: 4, title: 'Grafik & Analisis', desc: 'Grafik menampilkan tren masuk vs keluar. Produk terlaris dan ringkasan alasan keluar juga tersedia.' },
      { step: 5, title: 'Export PDF', desc: 'Klik "Export PDF" di kanan atas — laporan otomatis terunduh.' },
    ]
  },
  {
    icon: Settings,
    iconBg: 'bg-slate-50 dark:bg-slate-900',
    iconColor: 'text-slate-600 dark:text-slate-400',
    title: 'Pengaturan',
    desc: 'Kelola preferensi dan pengaturan aplikasi',
    panduan: [
      { step: 1, title: 'Tema Aplikasi', desc: 'Buka Pengaturan → pilih Light, Dark, atau System sesuai preferensi tampilan.' },
      { step: 2, title: 'Mata Uang', desc: 'Pilih mata uang yang digunakan — Rupiah (Rp) atau Dollar (US$).' },
      { step: 3, title: 'Satuan Default', desc: 'Atur satuan default (pcs, box, kg, dll) — otomatis terisi saat tambah produk baru.' },
      { step: 4, title: 'Minimum Stok Default', desc: 'Atur nilai minimum stok default — otomatis terisi di form tambah produk baru.' },
      { step: 5, title: 'Notifikasi', desc: 'Aktifkan atau nonaktifkan notifikasi untuk: stok menipis, produk baru, barang masuk, dan barang keluar.' },
      { step: 6, title: 'Pusat Bantuan', desc: 'Klik "Pusat Bantuan" untuk membuka panduan penggunaan aplikasi.' },
      { step: 7, title: 'Reset ke Default', desc: 'Klik "Reset ke Default" di kanan atas untuk mengembalikan semua preferensi ke pengaturan awal.' },
    ]
  },
  {
    icon: User,
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Profil & Akun',
    desc: 'Kelola profil, keamanan, dan informasi akun',
    panduan: [
      { step: 1, title: 'Edit Nama & Toko', desc: 'Klik tombol "Edit profil" di kartu profil → ubah nama lengkap atau nama toko/bisnis → klik "Simpan Perubahan".' },
      { step: 2, title: 'Foto Profil', desc: 'Saat edit profil, klik ikon kamera di foto → pilih gambar (maks 2MB). Untuk hapus foto, klik "Hapus foto profil".' },
      { step: 3, title: 'Ganti Email', desc: 'Buka Keamanan Akun → Ganti Email → masukkan kode OTP yang dikirim ke email aktif → verifikasi → isi email baru → konfirmasi.' },
      { step: 4, title: 'Ganti Password', desc: 'Buka Keamanan Akun → Ganti Password → isi password saat ini, password baru (min 6 karakter), dan konfirmasi → simpan.' },
      { step: 5, title: 'Lupa Password', desc: 'Di form ganti password, klik "Lupa password?" — link reset akan dikirim ke email terdaftar.' },
      { step: 6, title: 'Info Akun', desc: 'Lihat role akun, waktu login terakhir, dan perangkat yang digunakan di bagian Info Akun.' },
      { step: 7, title: 'Hapus Akun', desc: 'Di bagian Zona Berbahaya, klik "Hapus Akun" → ketik HAPUS untuk konfirmasi. Semua data dihapus permanen.' },
    ]
  },
]

const steps = [
  { num: 1, icon: Package, iconBg: 'bg-violet-50 dark:bg-violet-950', iconColor: 'text-violet-600 dark:text-violet-400', numBg: 'bg-violet-600', title: 'Kelola Produk', desc: 'Tambah produk terlebih dahulu sebelum transaksi.' },
  { num: 2, icon: ArrowDownCircle, iconBg: 'bg-emerald-50 dark:bg-emerald-950', iconColor: 'text-emerald-600 dark:text-emerald-400', numBg: 'bg-emerald-600', title: 'Barang Masuk', desc: 'Input stok awal atau restock produk.' },
  { num: 3, icon: ArrowUpCircle, iconBg: 'bg-orange-50 dark:bg-orange-950', iconColor: 'text-orange-500 dark:text-orange-400', numBg: 'bg-orange-500', title: 'Barang Keluar', desc: 'Catat penjualan atau pengeluaran barang.' },
  { num: 4, icon: FileText, iconBg: 'bg-blue-50 dark:bg-blue-950', iconColor: 'text-blue-600 dark:text-blue-400', numBg: 'bg-blue-600', title: 'Laporan', desc: 'Pantau stok, penjualan, dan keuntungan.' },
]

const tips = [
  'Gunakan minimum stok untuk mendapatkan notifikasi produk hampir habis.',
  'Lakukan input barang masuk secara rutin agar stok tetap akurat.',
  'Export laporan secara berkala untuk backup data bisnis.',
]

const techStack = [
  { label: 'Next.js', bg: 'bg-black', text: 'text-white', letter: 'N' },
  { label: 'React', bg: 'bg-sky-500', text: 'text-white', letter: 'R' },
  { label: 'Tailwind', bg: 'bg-teal-500', text: 'text-white', letter: 'T' },
  { label: 'Supabase', bg: 'bg-emerald-600', text: 'text-white', letter: 'S' },
]

export default function BantuanPage() {
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCards = quickHelp.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bantuan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Panduan penggunaan aplikasi SIMBA</p>
        </div>

        {/* Hero / Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-t-4 border-t-blue-600 p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-2.5 rounded-xl">
                <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pusat Bantuan</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500">Temukan jawaban dan panduan penggunaan</p>
              </div>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari panduan atau pertanyaan..."
                className="w-full md:w-96 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quickHelp.length}</p>
              <p>Panduan</p>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{faqs.length}</p>
              <p>FAQ</p>
            </div>
          </div>
        </div>

        {/* Panduan Cepat */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-blue-600 rounded-full" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Panduan Cepat</h3>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {filteredCards.map((item) => (
                <button
                  key={item.title}
                  onClick={() => setSelectedGuide(item)}
                  className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-200 flex flex-col gap-2 w-44"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${item.iconBg} w-8 h-8 rounded-xl flex items-center justify-center shrink-0`}>
                      <item.icon size={15} className={item.iconColor} />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{item.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {filteredCards.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Tidak ditemukan panduan untuk "{search}"</p>
          )}
        </section>

        {/* FAQ + Kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* FAQ — scrollable */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 shrink-0">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">FAQ</h3>
              <span className="ml-auto text-xs text-gray-400">{faqs.length} pertanyaan</span>
            </div>
            <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-100 dark:divide-gray-800">
              {filteredFaqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-start justify-between px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors gap-3"
                  >
                    <span className={`text-sm leading-snug flex-1 ${openFaq === i ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-gray-400 mt-0.5 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-blue-500' : ''}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Tidak ditemukan FAQ untuk "{search}"</p>
              )}
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Alur Penggunaan */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 bg-blue-600 rounded-full" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Alur Penggunaan</h3>
              </div>
              <div className="hidden sm:flex items-start">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex items-start flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`${step.numBg} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0`}>{step.num}</span>
                        <div className={`${step.iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                          <step.icon size={17} className={step.iconColor} />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-center mb-1">{step.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed px-1">{step.desc}</p>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex items-center mt-5 mx-1">
                        <div className="w-5 h-px bg-gray-200 dark:bg-gray-700" />
                        <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 -ml-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="sm:hidden flex flex-col gap-0">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`${step.numBg} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0`}>{step.num}</span>
                      {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`${step.iconBg} w-8 h-8 rounded-xl flex items-center justify-center`}>
                          <step.icon size={15} className={step.iconColor} />
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{step.title}</p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-amber-400 rounded-full" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Tips & Informasi</h3>
                <Lightbulb size={15} className="text-amber-400 ml-auto" />
              </div>
              <div className="flex flex-col gap-2.5">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-3">
                    <CheckCircle2 size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tentang */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Tentang Aplikasi</h3>
                <span className="ml-auto bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-lg">v1.0.0</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Dibuat dengan</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {techStack.map(({ label, bg, text, letter }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className={`${bg} ${text} text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0`}>{letter}</div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Database</p>
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <div className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center">S</div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Supabase</span>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-start gap-3">
          <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Tidak menemukan jawaban yang kamu cari? Hubungi pengembang langsung melalui{' '}
            <a
              href="https://wa.me/6282146773813"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>

      </div>

      {/* Panduan Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedGuide(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`${selectedGuide.iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                  <selectedGuide.icon size={17} className={selectedGuide.iconColor} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{selectedGuide.title}</h3>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4 max-h-96 overflow-y-auto">
              {selectedGuide.panduan.map((p, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`${selectedGuide.iconBg} w-7 h-7 rounded-full flex items-center justify-center shrink-0`}>
                      <span className={`text-xs font-bold ${selectedGuide.iconColor}`}>{p.step}</span>
                    </div>
                    {i < selectedGuide.panduan.length - 1 && (
                      <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{p.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}