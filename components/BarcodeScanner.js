'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { X, Camera, RefreshCw } from 'lucide-react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [error, setError] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { onDetectedRef.current = onDetected }, [onDetected])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  function createReader() {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE,
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_39, BarcodeFormat.CODE_93,
      BarcodeFormat.ITF, BarcodeFormat.CODABAR,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.ASSUME_GS1, true)
    return new BrowserMultiFormatReader(hints, 200) // scan interval 200ms (default 500ms)
  }

  function stopReader() {
    try { readerRef.current?.reset() } catch {}
    readerRef.current = null
  }

  async function startCamera(deviceId) {
    stopReader()
    setError(null)

    try {
      const reader = createReader()
      readerRef.current = reader

      // Pakai decodeFromVideoDevice — biar reader yang handle stream-nya sendiri
      // Ini lebih stabil dan ga konflik sama srcObject manual
      await reader.decodeFromVideoDevice(
        deviceId || undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            onDetectedRef.current(result.getText())
            stopReader()
            onCloseRef.current()
          }
          if (err && err?.name !== 'NotFoundException') {
            console.error('Scan error:', err)
          }
        }
      )
    } catch (err) {
      if (err?.name === 'NotReadableError') {
        setError('Kamera sedang dipakai aplikasi lain (OBS, Zoom, tab lain). Tutup dulu lalu coba lagi.')
      } else if (err?.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Aktifkan kamera di pengaturan browser.')
      } else if (err?.name === 'NotFoundError') {
        setError('Tidak ada kamera ditemukan.')
      } else if (err?.name === 'OverconstrainedError') {
        startCamera(null)
      } else {
        setError('Gagal akses kamera: ' + (err?.message || err))
      }
    }
  }

  useEffect(() => {
    let isMounted = true

    async function initDevices() {
      try {
        // Minta permission dulu buat dapetin label
        try {
          const temp = await navigator.mediaDevices.getUserMedia({ video: true })
          temp.getTracks().forEach(t => t.stop())
        } catch {}

        const all = await navigator.mediaDevices.enumerateDevices()
        const cams = all.filter(d => d.kind === 'videoinput')

        if (!isMounted) return

        if (cams.length === 0) {
          setError('Tidak ada kamera ditemukan')
          return
        }

        setDevices(cams)

        // Prioritas: kamera belakang > kamera fisik > kamera pertama
        // Tidak exclude virtual camera — biarkan user pilih sendiri via dropdown
        const backCamera = cams.find(d => /back|rear|environment/i.test(d.label))
        const physicalCamera = cams.find(d =>
          /webcam|usb|integrated|built.in|facetime|hd camera/i.test(d.label)
        )
        const chosen = backCamera || physicalCamera || cams[0]

        setSelectedDevice(chosen.deviceId)
        startCamera(chosen.deviceId)
      } catch (err) {
        if (isMounted) setError('Gagal akses kamera: ' + (err?.message || err))
      }
    }

    initDevices()

    return () => {
      isMounted = false
      stopReader()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChangeDevice(e) {
    const deviceId = e.target.value
    setSelectedDevice(deviceId)
    startCamera(deviceId)
  }

  async function handleRetry() {
    setRetrying(true)
    await startCamera(selectedDevice)
    setRetrying(false)
  }

  function handleClose() {
    stopReader()
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div style={{ zIndex: 9999 }} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-semibold text-gray-800">Scan Barcode</p>
            <p className="text-xs text-gray-400 mt-0.5">Arahkan kamera ke barcode produk</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Camera dropdown — selalu tampil kalau ada >1 kamera */}
        {devices.length > 1 && (
          <div className="px-5 pt-4 pb-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Camera size={14} className="text-gray-400 shrink-0" />
              <select
                value={selectedDevice || ''}
                onChange={handleChangeDevice}
                className="w-full text-xs text-gray-700 bg-transparent outline-none"
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Kamera ${d.deviceId.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Video */}
        <div className="bg-black relative min-h-[220px] flex items-center justify-center mt-3">
          <video ref={videoRef} className="w-full" playsInline muted autoPlay />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 bg-black/70">
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