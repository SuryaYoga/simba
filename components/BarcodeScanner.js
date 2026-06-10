'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, RefreshCw, Loader2 } from 'lucide-react'

const SCANNER_ID = 'html5qr-scanner-region'

export default function BarcodeScanner({ onDetected, onClose }) {
  const scannerRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { onDetectedRef.current = onDetected }, [onDetected])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === 2 || state === 3) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch {}
      scannerRef.current = null
    }
  }

  async function startScanner(deviceId) {
    await stopScanner()
    setError(null)
    setLoading(true)

    try {
      const scanner = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ],
        verbose: false,
      })
      scannerRef.current = scanner

      const config = {
        fps: 20,
        qrbox: { width: 300, height: 200 },
        aspectRatio: 1.333,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      }

      await scanner.start(
        deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
        config,
        (decodedText) => {
          onDetectedRef.current(decodedText)
          stopScanner()
          onCloseRef.current()
        },
        () => {}
      )

      setLoading(false)
    } catch (err) {
      setLoading(false)
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        setError('Izin kamera ditolak. Klik ikon kunci di address bar → Site settings → Camera → Allow.')
      } else if (err?.name === 'NotReadableError' || String(err).includes('not readable')) {
        setError('Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu klik Coba Lagi.')
      } else if (err?.name === 'NotFoundError') {
        setError('Tidak ada kamera ditemukan.')
      } else {
        setError('Gagal akses kamera: ' + (err?.message || String(err)))
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const camDevices = await Html5Qrcode.getCameras()

        if (cancelled) return

        if (!camDevices || camDevices.length === 0) {
          setLoading(false)
          setError('Tidak ada kamera ditemukan.')
          return
        }

        setDevices(camDevices)

        // Filter virtual camera untuk auto-select
        const realCams = camDevices.filter(d =>
          !/virtual|bytecast|obs|snap|droid|ivcam|epoccam/i.test(d.label)
        )
        const pool = realCams.length > 0 ? realCams : camDevices

        const backCamera = pool.find(d => /back|rear|environment/i.test(d.label))
        const physicalCamera = pool.find(d =>
          /webcam|usb|integrated|built.in|facetime|hd camera/i.test(d.label)
        )
        const chosen = backCamera || physicalCamera || pool[0]

        setSelectedDevice(chosen.id)
        startScanner(chosen.id)
      } catch (err) {
        if (!cancelled) {
          setLoading(false)
          setError('Gagal akses kamera: ' + (err?.message || String(err)))
        }
      }
    }

    init()
    return () => {
      cancelled = true
      stopScanner()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleChangeDevice(e) {
    const deviceId = e.target.value
    setSelectedDevice(deviceId)
    await startScanner(deviceId)
  }

  async function handleRetry() {
    setRetrying(true)
    await startScanner(selectedDevice)
    setRetrying(false)
  }

  function handleClose() {
    stopScanner()
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    // z-index 99999 — lebih tinggi dari Drawer (z-[100]) dan semua overlay lain
    <div style={{ zIndex: 99999 }} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-800">Scan Barcode</p>
            <p className="text-xs text-gray-400 mt-0.5">Arahkan kamera ke barcode produk</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Camera dropdown */}
        {devices.length > 1 && (
          <div className="px-5 pt-4 pb-0">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Pilih Kamera</label>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5">
              <Camera size={14} className="text-gray-500 dark:text-gray-300 shrink-0" />
              <select
                value={selectedDevice || ''}
                onChange={handleChangeDevice}
                className="w-full text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 outline-none cursor-pointer"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.label || `Kamera ${d.id.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Scanner region */}
        <div className="relative mt-3 bg-black min-h-[240px]">
          <div id={SCANNER_ID} className="w-full" />

          {/* Loading overlay */}
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black">
              <Loader2 size={28} className="text-white animate-spin" />
              <p className="text-white text-xs">Membuka kamera...</p>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 bg-black">
              <p className="text-white text-xs text-center leading-relaxed">{error}</p>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={retrying ? 'animate-spin' : ''} />
                {retrying ? 'Mencoba...' : 'Coba Lagi'}
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 text-center">Pastikan cahaya cukup & barcode tegak lurus</p>
        </div>

      </div>
    </div>,
    document.body
  )
}