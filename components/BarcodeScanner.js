'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { X, Camera, RefreshCw } from 'lucide-react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const streamRef = useRef(null)
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
      BarcodeFormat.UPC_A, BarcodeFormat.CODE_39,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    return new BrowserMultiFormatReader(hints)
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    try { readerRef.current?.reset() } catch {}
  }

  async function startCamera(deviceId) {
    stopStream()
    setError(null)

    try {
      // Grab stream manual dulu biar bisa handle NotReadableError
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      })
      streamRef.current = stream

      // Kasih stream ke video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      // Baru decode dari video element (bukan dari deviceId)
      const reader = createReader()
      readerRef.current = reader

      reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result) {
          onDetectedRef.current(result.getText())
          stopStream()
          onCloseRef.current()
        }
        if (err && err?.name !== 'NotFoundException') {
          console.error('Scan error:', err)
        }
      })
    } catch (err) {
      if (err?.name === 'NotReadableError') {
        setError('Kamera sedang dipakai aplikasi lain (OBS, Zoom, tab lain). Tutup dulu lalu coba lagi.')
      } else if (err?.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Aktifkan kamera di pengaturan browser.')
      } else if (err?.name === 'NotFoundError') {
        setError('Tidak ada kamera ditemukan.')
      } else if (err?.name === 'OverconstrainedError') {
        // deviceId exact gagal, coba tanpa constraint
        startCamera(null)
      } else {
        setError('Gagal akses kamera: ' + (err?.message || err))
      }
    }
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(async allDevices => {
        // enumerateDevices butuh permission dulu buat dapet label
        // minta permission sekali dulu
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
          tempStream.getTracks().forEach(t => t.stop())
        } catch {}

        const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
        // enumerateDevices lagi setelah permission granted buat dapet label
        const labeled = await navigator.mediaDevices.enumerateDevices()
        const cams = labeled.filter(d => d.kind === 'videoinput')

        if (cams.length === 0) {
          setError('Tidak ada kamera ditemukan')
          return
        }
        setDevices(cams)

        const backCamera = cams.find(d => /back|rear|environment/i.test(d.label))
        const physicalCamera = cams.find(d =>
          /webcam|usb|integrated|built.in|facetime|hd camera/i.test(d.label) &&
          !/virtual|obs|snap|droid|ivcam|epoccam/i.test(d.label)
        )
        const chosen = backCamera || physicalCamera || cams[0]
        setSelectedDevice(chosen.deviceId)
        startCamera(chosen.deviceId)
      })
      .catch(err => {
        setError('Gagal akses kamera: ' + (err?.message || err))
      })

    return () => { stopStream() }
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
    stopStream()
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div style={{ zIndex: 9999 }} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-semibold text-gray-800">Scan Barcode</p>
            <p className="text-xs text-gray-400 mt-0.5">Arahkan kamera ke barcode produk</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="bg-black relative min-h-[220px] flex items-center justify-center">
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

        {devices.length > 1 && (
          <div className="px-5 pt-4 pb-1">
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

        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 text-center">Pastikan cahaya cukup & barcode tegak lurus</p>
        </div>
      </div>
    </div>,
    document.body
  )
}