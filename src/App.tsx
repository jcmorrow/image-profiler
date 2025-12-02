import { useState } from 'react'
import './App.css'

interface ImageData {
  url: string
  loadTime: number | null
  error: boolean
}

function ImageCard({ url, index, onLoadComplete }: {
  url: string
  index: number
  onLoadComplete: (index: number, loadTime: number) => void
}) {
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const [error, setError] = useState(false)

  const handleImageLoad = (startTime: number) => {
    const endTime = performance.now()
    const duration = endTime - startTime
    setLoadTime(duration)
    onLoadComplete(index, duration)
  }

  const handleImageError = () => {
    setError(true)
  }

  const startTime = performance.now()

  return (
    <div className="image-card">
      {error ? (
        <div className="image-error">Failed to load</div>
      ) : (
        <>
          <img
            src={url}
            alt={`Image ${index + 1}`}
            onLoad={() => handleImageLoad(startTime)}
            onError={handleImageError}
          />
          {loadTime !== null && (
            <div className="load-time">
              {loadTime.toFixed(0)}ms
            </div>
          )}
        </>
      )}
    </div>
  )
}

function App() {
  const [urlInput, setUrlInput] = useState('')
  const [images, setImages] = useState<ImageData[]>([])

  const handleLoadImages = () => {
    const urls = urlInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    setImages(urls.map(url => ({ url, loadTime: null, error: false })))
  }

  const handleLoadComplete = (index: number, loadTime: number) => {
    setImages(prev => {
      const newImages = [...prev]
      newImages[index] = { ...newImages[index], loadTime }
      return newImages
    })
  }

  const avgLoadTime = images.length > 0
    ? images
        .filter(img => img.loadTime !== null)
        .reduce((sum, img) => sum + (img.loadTime || 0), 0) /
      images.filter(img => img.loadTime !== null).length
    : 0

  return (
    <div className="app">
      <header>
        <h1>Image Load Time Profiler</h1>
        <p>Measure how long it takes to load images from different sources</p>
      </header>

      <div className="input-section">
        <textarea
          placeholder="Paste image URLs here (one per line)..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          rows={8}
        />
        <button onClick={handleLoadImages}>Load Images</button>
      </div>

      {images.length > 0 && (
        <>
          <div className="stats">
            <span>Total: {images.length} images</span>
            <span>Loaded: {images.filter(img => img.loadTime !== null).length}</span>
            {avgLoadTime > 0 && <span>Average: {avgLoadTime.toFixed(0)}ms</span>}
          </div>

          <div className="image-grid">
            {images.map((image, index) => (
              <ImageCard
                key={`${image.url}-${index}`}
                url={image.url}
                index={index}
                onLoadComplete={handleLoadComplete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default App
