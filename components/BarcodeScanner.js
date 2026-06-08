'use client'
import { useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { X } from 'lucide-react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.listVideoInputDevices().then(devices => {
      if (!devices || devices.length === 0) {
        alert('Tidak ada kamera ditemukan')
        return
      }
      const deviceId = devices[devices.length - 1].deviceId
      reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          onDetected(result.getText())
          reader.reset()
          onClose()
        }
      })
    }).catch(err => {
      alert('Gagal akses kamera: ' + err)
    })

    return () => { readerRef.current?.reset() }
  }, [])

  function handleClose() {
    try {
      readerRef.current?.reset()
      onClose()
    } catch {
      onClose()
    }
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