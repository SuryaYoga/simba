'use client'
import { useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { X } from 'lucide-react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onDetectedRef.current = onDetected }, [onDetected])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.UPC_A,
      BarcodeFormat.CODE_39,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)

    const reader = new BrowserMultiFormatReader(hints)
    readerRef.current = reader

    reader.listVideoInputDevices()
      .then(devices => {
        if (!devices || devices.length === 0) {
          alert('Tidak ada kamera ditemukan')
          return
        }
        const backCamera = devices.find(d => /back|rear|environment/i.test(d.label))
        const deviceId = (backCamera || devices[devices.length - 1]).deviceId

        return reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (result) {
            onDetectedRef.current(result.getText())
            reader.reset()
            onCloseRef.current()
          }
          if (err && err?.name !== 'NotFoundException') {
            console.error('Scan error:', err)
          }
        })
      })
      .catch(err => {
        if (err?.name === 'NotAllowedError') {
          alert('Izin kamera ditolak. Aktifkan kamera di pengaturan browser.')
        } else if (err?.name === 'NotFoundError') {
          alert('Tidak ada kamera ditemukan di perangkat ini.')
        } else {
          alert('Gagal akses kamera: ' + (err?.message || err))
        }
      })

    return () => {
      try { readerRef.current?.reset() } catch {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    try { readerRef.current?.reset() } catch {}
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
        <div className="bg-black">
          <video ref={videoRef} className="w-full" />
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 text-center">Pastikan cahaya cukup & barcode tegak lurus</p>
        </div>
      </div>
    </div>
  )
}