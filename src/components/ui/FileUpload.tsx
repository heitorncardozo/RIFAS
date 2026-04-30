'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  preview?: string | null
  accept?: string
  maxSizeMB?: number
}

export default function FileUpload({
  onFileSelect,
  preview,
  accept = 'image/*',
  maxSizeMB = 5,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida.')
      return false
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo deve ter no máximo ${maxSizeMB}MB.`)
      return false
    }
    return true
  }

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-card-border hover:border-primary/50 hover:bg-surface/50'
          }
          ${preview ? 'p-2' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview do comprovante"
              className="w-full max-h-64 object-contain rounded-xl"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                📷 Trocar imagem
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
              📸
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Arraste o comprovante aqui
              </p>
              <p className="text-sm text-muted mt-1">
                ou clique para selecionar • PNG, JPG até {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger font-medium flex items-center gap-1.5">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}
