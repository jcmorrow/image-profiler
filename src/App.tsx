import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
  const [loadTimestamp, setLoadTimestamp] = useState(0)

  const handleLoadImages = () => {
    const urls = urlInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    // Add cache-busting timestamp to each URL
    const timestamp = Date.now()
    setLoadTimestamp(timestamp)

    const cacheBustedUrls = urls.map(url => {
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}_t=${timestamp}`
    })

    setImages(cacheBustedUrls.map(url => ({ url, loadTime: null, error: false })))
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

  // Calculate histogram data
  const getHistogramData = () => {
    const loadedImages = images.filter(img => img.loadTime !== null)
    if (loadedImages.length === 0) return []

    const times = loadedImages.map(img => img.loadTime!)
    const min = Math.min(...times)
    const max = Math.max(...times)

    // Handle case where all images have the same load time
    if (min === max) {
      return [{
        range: `${min.toFixed(0)}`,
        count: times.length
      }]
    }

    const bucketCount = Math.min(10, loadedImages.length)
    const bucketSize = (max - min) / bucketCount

    const buckets = Array(bucketCount).fill(0).map((_, i) => ({
      range: `${(min + i * bucketSize).toFixed(0)}-${(min + (i + 1) * bucketSize).toFixed(0)}`,
      count: 0
    }))

    times.forEach(time => {
      const bucketIndex = Math.min(
        Math.floor((time - min) / bucketSize),
        bucketCount - 1
      )
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].count++
      }
    })

    return buckets
  }

  const histogramData = getHistogramData()

  return (
    <div className="app">
      <header>
        <h1>Image Load Time Profiler</h1>
        <p>Measure how long it takes to load images from different sources</p>
      </header>

      <div className="instructions">
        <h3>Setup Instructions</h3>
        <ol>
          <li>Open browser DevTools (F12 or Cmd/Ctrl+Shift+I)</li>
          <li>Go to the <strong>Network</strong> tab</li>
          <li>Check <strong>"Disable cache"</strong> to ensure fresh loads</li>
          <li>Optional: Use <strong>throttling</strong> dropdown to simulate different connection speeds (Fast 3G, Slow 3G, etc.)</li>
        </ol>
      </div>

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

          {histogramData.length > 0 && (
            <div className="histogram-section">
              <h3>Load Time Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={histogramData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="range"
                    stroke="#888"
                    tick={{ fill: '#888', fontSize: 12 }}
                    label={{ value: 'Load Time (ms)', position: 'insideBottom', offset: -5, fill: '#888' }}
                  />
                  <YAxis
                    stroke="#888"
                    tick={{ fill: '#888', fontSize: 12 }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#888' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px' }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#8b9299" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="image-grid">
            {images.map((image, index) => (
              <ImageCard
                key={`${image.url}-${index}-${loadTimestamp}`}
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
