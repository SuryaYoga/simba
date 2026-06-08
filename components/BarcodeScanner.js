'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { X, Camera } from 'lucide-react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [error, setError] = useState(null)
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

  function startReader(deviceId) {
    try { readerRef.current?.reset() } catch {}
    setError(null)
    const reader = createReader()
    readerRef.current = reader
    reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
      if (result) {
        onDetectedRef.current(result.getText())
        reader.reset()
        onCloseRef.current()
      }
      if (err && err?.name !== 'NotFoundException') {
        console.error('Scan error:', err)
      }
    }).catch(err => {
      setError('Gagal buka kamera: ' + (err?.message || err))
    })
  }

  useEffect(() => {
    const reader = createReader()
    reader.listVideoInputDevices()
      .then(list => {
        if (!list || list.length === 0) {
          setError('Tidak ada kamera ditemukan')
          return
        }
        setDevices(list)
        const backCamera = list.find(d => /back|rear|environment/i.test(d.label))
        const physicalCamera = list.find(d =>
          /webcam|usb|integrated|built.in|facetime|hd camera/i.test(d.label) &&
          !/virtual|obs|snap|droid|ivcam|epoccam/i.test(d.label)
        )
        const chosen = backCamera || physicalCamera || list[0]
        setSelectedDevice(chosen.deviceId)
        startReader(chosen.deviceId)
      })
      .catch(err => {
        if (err?.name === 'NotAllowedError') {
          setError('Izin kamera ditolak. Aktifkan kamera di pengaturan browser.')
        } else if (err?.name === 'NotFoundError') {
          setError('Tidak ada kamera ditemukan.')
        } else {
          setError('Gagal akses kamera: ' + (err?.message || err))
        }
      })
    return () => { try { readerRef.current?.reset() } catch {} }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChangeDevice(e) {
    const deviceId = e.target.value
    setSelectedDevice(deviceId)
    startReader(deviceId)
  }

  function handleClose() {
    try { readerRef.current?.reset() } catch {}
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
    >
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

        <div className="bg-black relative min-h-[200px]">
          <video ref={videoRef} className="w-full" />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <p className="text-white text-xs text-center">{error}</p>
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