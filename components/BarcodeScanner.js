'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { X, Camera, RefreshCw } from 'lucide-react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const canvasRef = useRef(null)
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

  function getReader() {
    if (!readerRef.current) {
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_39, BarcodeFormat.CODE_93,
        BarcodeFormat.ITF, BarcodeFormat.CODABAR,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)
      readerRef.current = new BrowserMultiFormatReader(hints)
    }
    return readerRef.current
  }

  function stopEverything() {
    // Stop scan loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    // Detach video
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Scan loop: decode dari canvas setiap frame
  function startScanLoop() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const reader = getReader()

    function tick() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        try {
          const result = reader.decodeFromCanvas(canvas)
          if (result) {
            onDetectedRef.current(result.getText())
            stopEverything()
            onCloseRef.current()
            return
          }
        } catch (e) {
          // NotFoundException = normal, lanjut scan
        }
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }

  async function startCamera(deviceId) {
    stopEverything()
    setError(null)

    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const video = videoRef.current
      if (!video) { stream.getTracks().forEach(t => t.stop()); return }

      video.srcObject = stream
      video.onloadedmetadata = () => {
        video.play()
          .then(() => startScanLoop())
          .catch(err => setError('Gagal play video: ' + err.message))
      }
    } catch (err) {
      if (err?.name === 'NotReadableError') {
        setError('Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu klik Coba Lagi.')
      } else if (err?.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Klik ikon kunci di address bar dan izinkan kamera.')
      } else if (err?.name === 'NotFoundError') {
        setError('Tidak ada kamera ditemukan.')
      } else if (err?.name === 'OverconstrainedError') {
        // deviceId exact gagal, fallback tanpa constraint
        startCamera(null)
      } else {
        setError('Gagal akses kamera: ' + (err?.message || err))
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Minta permission dulu
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
        tempStream.getTracks().forEach(t => t.stop())

        if (cancelled) return

        const all = await navigator.mediaDevices.enumerateDevices()
        const cams = all.filter(d => d.kind === 'videoinput')

        if (cancelled) return

        if (cams.length === 0) { setError('Tidak ada kamera ditemukan'); return }

        setDevices(cams)

        const realCams = cams.filter(d =>
          !/virtual|bytecast|obs|snap|droid|ivcam|epoccam/i.test(d.label)
        )
        const pool = realCams.length > 0 ? realCams : cams

        const backCamera = pool.find(d => /back|rear|environment/i.test(d.label))
        const physicalCamera = pool.find(d =>
          /webcam|usb|integrated|built.in|facetime|hd camera/i.test(d.label)
        )
        const chosen = backCamera || physicalCamera || pool[0]
        setSelectedDevice(chosen.deviceId)
        startCamera(chosen.deviceId)
      } catch (err) {
        if (!cancelled) setError('Gagal akses kamera: ' + (err?.message || err))
      }
    }

    init()
    return () => { cancelled = true; stopEverything() }
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
    stopEverything()
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

        {/* Camera dropdown */}
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
          <video ref={videoRef} className="w-full" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
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