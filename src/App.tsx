import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./App.css";

type Mode = "single" | "comparison";

interface ImageData {
  url: string;
  loadTime: number | null;
  error: boolean;
  loading: boolean;
  // For comparison mode
  url2?: string;
  loadTime2?: number | null;
  error2?: boolean;
  loading2?: boolean;
}

function ImageCard({
  url,
  url2,
  index,
  onLoadComplete,
  mode,
}: {
  url: string;
  url2?: string;
  index: number;
  onLoadComplete: (
    index: number,
    loadTime: number,
    isSecondImage?: boolean
  ) => void;
  mode: Mode;
}) {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [loadTime2, setLoadTime2] = useState<number | null>(null);
  const [error2, setError2] = useState(false);
  const [loading2, setLoading2] = useState(true);

  const handleImageLoad = (startTime: number, isSecondImage = false) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    if (isSecondImage) {
      setLoadTime2(duration);
      setLoading2(false);
    } else {
      setLoadTime(duration);
      setLoading(false);
    }
    onLoadComplete(index, duration, isSecondImage);
  };

  const handleImageError = (isSecondImage = false) => {
    if (isSecondImage) {
      setError2(true);
      setLoading2(false);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const startTime = performance.now();
  const startTime2 = performance.now();

  if (mode === "comparison" && url2) {
    const domain1 = new URL(url).hostname;
    const domain2 = new URL(url2).hostname;

    return (
      <div className="image-card comparison-card">
        <div className="comparison-side">
          <div className="comparison-label">{domain1}</div>
          {error ? (
            <div className="image-error">Failed to load</div>
          ) : (
            <>
              {loading && <div className="image-loading">Loading...</div>}
              <img
                src={url}
                alt={`Image ${index + 1} - ${domain1}`}
                onLoad={() => handleImageLoad(startTime, false)}
                onError={() => handleImageError(false)}
              />
              {loadTime !== null && (
                <div className="load-time">{loadTime.toFixed(0)}ms</div>
              )}
            </>
          )}
        </div>
        <div className="comparison-side">
          <div className="comparison-label">{domain2}</div>
          {error2 ? (
            <div className="image-error">Failed to load</div>
          ) : (
            <>
              {loading2 && <div className="image-loading">Loading...</div>}
              <img
                src={url2}
                alt={`Image ${index + 1} - ${domain2}`}
                onLoad={() => handleImageLoad(startTime2, true)}
                onError={() => handleImageError(true)}
              />
              {loadTime2 !== null && (
                <div className="load-time">{loadTime2.toFixed(0)}ms</div>
              )}
            </>
          )}
        </div>
        {loadTime !== null && loadTime2 !== null && (
          <div className="comparison-diff">
            {loadTime < loadTime2 ? (
              <span className="faster">
                {domain1} {((loadTime2 - loadTime) / loadTime2 * 100).toFixed(0)}% faster
              </span>
            ) : loadTime > loadTime2 ? (
              <span className="slower">
                {domain2} {((loadTime - loadTime2) / loadTime * 100).toFixed(0)}% faster
              </span>
            ) : (
              <span className="equal">Same load time</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="image-card">
      {error ? (
        <div className="image-error">Failed to load</div>
      ) : (
        <>
          {loading && <div className="image-loading">Loading...</div>}
          <img
            src={url}
            alt={`Image ${index + 1}`}
            onLoad={() => handleImageLoad(startTime)}
            onError={handleImageError}
          />
          {loadTime !== null && (
            <div className="load-time">{loadTime.toFixed(0)}ms</div>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem("imageProfiler_mode");
    return (saved as Mode) || "single";
  });
  const [urlInput, setUrlInput] = useState(() => {
    return localStorage.getItem("imageProfiler_urlInput") || "";
  });
  const [baseUrl2, setBaseUrl2] = useState(() => {
    return localStorage.getItem("imageProfiler_baseUrl2") || "";
  });
  const [images, setImages] = useState<ImageData[]>([]);
  const [loadTimestamp, setLoadTimestamp] = useState(0);
  const [bustCache, setBustCache] = useState(() => {
    const saved = localStorage.getItem("imageProfiler_bustCache");
    return saved !== null ? saved === "true" : false;
  });

  // Persist mode to localStorage
  useEffect(() => {
    localStorage.setItem("imageProfiler_mode", mode);
  }, [mode]);

  // Persist urlInput to localStorage
  useEffect(() => {
    localStorage.setItem("imageProfiler_urlInput", urlInput);
  }, [urlInput]);

  // Persist baseUrl2 to localStorage
  useEffect(() => {
    localStorage.setItem("imageProfiler_baseUrl2", baseUrl2);
  }, [baseUrl2]);

  // Persist bustCache to localStorage
  useEffect(() => {
    localStorage.setItem("imageProfiler_bustCache", String(bustCache));
  }, [bustCache]);

  const handleLoadImages = () => {
    const urls = urlInput
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const timestamp = Date.now();
    setLoadTimestamp(timestamp);

    // Optionally add cache-busting timestamp to each URL
    const processedUrls = bustCache
      ? urls.map((url) => {
          const separator = url.includes("?") ? "&" : "?";
          return `${url}${separator}_t=${timestamp}`;
        })
      : urls;

    if (mode === "comparison" && baseUrl2) {
      // For comparison mode, replace the base URL with the second base URL
      const processedUrls2 = processedUrls.map((url) => {
        // Extract the first base URL from the input
        const firstUrl = new URL(url);
        const firstBase = `${firstUrl.protocol}//${firstUrl.host}`;

        // Replace with second base URL
        return url.replace(firstBase, baseUrl2.replace(/\/$/, ""));
      });

      setImages(
        processedUrls.map((url, index) => ({
          url,
          url2: processedUrls2[index],
          loadTime: null,
          loadTime2: null,
          error: false,
          error2: false,
          loading: true,
          loading2: true,
        })),
      );
    } else {
      setImages(
        processedUrls.map((url) => ({
          url,
          loadTime: null,
          error: false,
          loading: true,
        })),
      );
    }
  };

  const handleLoadComplete = (
    index: number,
    loadTime: number,
    isSecondImage = false
  ) => {
    setImages((prev) => {
      const newImages = [...prev];
      if (isSecondImage) {
        newImages[index] = {
          ...newImages[index],
          loadTime2: loadTime,
          loading2: false,
        };
      } else {
        newImages[index] = { ...newImages[index], loadTime, loading: false };
      }
      return newImages;
    });
  };

  const loadedImages = images.filter((img) => img.loadTime !== null);
  const loadedImages2 =
    mode === "comparison"
      ? images.filter((img) => img.loadTime2 !== null)
      : [];

  const avgLoadTime =
    loadedImages.length > 0
      ? loadedImages.reduce((sum, img) => sum + (img.loadTime || 0), 0) /
        loadedImages.length
      : 0;

  const avgLoadTime2 =
    loadedImages2.length > 0
      ? loadedImages2.reduce((sum, img) => sum + (img.loadTime2 || 0), 0) /
        loadedImages2.length
      : 0;

  // Calculate percentiles
  const getPercentile = (values: number[], percentile: number) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  };

  const loadTimes = loadedImages.map((img) => img.loadTime!);
  const p95 = loadedImages.length >= 10 ? getPercentile(loadTimes, 95) : null;
  const p99 = loadedImages.length >= 20 ? getPercentile(loadTimes, 99) : null;

  const loadTimes2 =
    mode === "comparison" ? loadedImages2.map((img) => img.loadTime2!) : [];
  const p95_2 =
    mode === "comparison" && loadedImages2.length >= 10
      ? getPercentile(loadTimes2, 95)
      : null;
  const p99_2 =
    mode === "comparison" && loadedImages2.length >= 20
      ? getPercentile(loadTimes2, 99)
      : null;

  // Calculate histogram data
  const getHistogramData = () => {
    const loadedImages = images.filter((img) => img.loadTime !== null);
    if (loadedImages.length === 0) return [];

    const times = loadedImages.map((img) => img.loadTime!);
    const times2 =
      mode === "comparison"
        ? images
            .filter((img) => img.loadTime2 !== null)
            .map((img) => img.loadTime2!)
        : [];

    const allTimes =
      mode === "comparison" ? [...times, ...times2] : times;
    const min = Math.min(...allTimes);
    const max = Math.max(...allTimes);

    // Handle case where all images have the same load time
    if (min === max) {
      if (mode === "comparison") {
        return [
          {
            range: `${min.toFixed(0)}`,
            base: times.length,
            compare: times2.length,
          },
        ];
      }
      return [
        {
          range: `${min.toFixed(0)}`,
          count: times.length,
        },
      ];
    }

    const bucketCount = Math.min(10, loadedImages.length);
    const bucketSize = (max - min) / bucketCount;

    if (mode === "comparison") {
      const buckets = Array(bucketCount)
        .fill(0)
        .map((_, i) => ({
          range: `${(min + i * bucketSize).toFixed(0)}-${(min + (i + 1) * bucketSize).toFixed(0)}`,
          base: 0,
          compare: 0,
        }));

      times.forEach((time) => {
        const bucketIndex = Math.min(
          Math.floor((time - min) / bucketSize),
          bucketCount - 1,
        );
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].base++;
        }
      });

      times2.forEach((time) => {
        const bucketIndex = Math.min(
          Math.floor((time - min) / bucketSize),
          bucketCount - 1,
        );
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].compare++;
        }
      });

      return buckets;
    } else {
      const buckets = Array(bucketCount)
        .fill(0)
        .map((_, i) => ({
          range: `${(min + i * bucketSize).toFixed(0)}-${(min + (i + 1) * bucketSize).toFixed(0)}`,
          count: 0,
        }));

      times.forEach((time) => {
        const bucketIndex = Math.min(
          Math.floor((time - min) / bucketSize),
          bucketCount - 1,
        );
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].count++;
        }
      });

      return buckets;
    }
  };

  const histogramData = getHistogramData();

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
          <li>
            Go to the <strong>Network</strong> tab
          </li>
          <li>
            Check <strong>"Disable cache"</strong> to ensure fresh loads
          </li>
          <li>
            Optional: Use <strong>throttling</strong> dropdown to simulate
            different connection speeds (Fast 3G, Slow 3G, etc.)
          </li>
        </ol>
      </div>

      <div className="mode-section">
        <h3>Mode</h3>
        <div className="mode-toggle">
          <button
            className={mode === "single" ? "active" : ""}
            onClick={() => setMode("single")}
          >
            Single URL
          </button>
          <button
            className={mode === "comparison" ? "active" : ""}
            onClick={() => setMode("comparison")}
          >
            Comparison
          </button>
        </div>
        {mode === "comparison" && (
          <p className="mode-description">
            Compare images from two different base URLs. Paste URLs using the
            first base URL, then enter the second base URL below to compare.
          </p>
        )}
      </div>

      <div className="input-section">
        <textarea
          placeholder="Paste image URLs here (one per line)..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          rows={8}
        />
        {mode === "comparison" && (
          <input
            type="text"
            className="base-url-input"
            placeholder="Second base URL (e.g., https://cdn2.example.com)"
            value={baseUrl2}
            onChange={(e) => setBaseUrl2(e.target.value)}
          />
        )}
        <label className="cache-control">
          <input
            type="checkbox"
            checked={bustCache}
            onChange={(e) => setBustCache(e.target.checked)}
          />
          <span>Force cache miss (add timestamp to URLs)</span>
        </label>
        <button onClick={handleLoadImages}>Load Images</button>
      </div>

      {images.length > 0 && mode === "single" && (
        <div className="stats">
          <span>Total: {images.length} images</span>
          <span>Loaded: {loadedImages.length}</span>
          {avgLoadTime > 0 && <span>Average: {avgLoadTime.toFixed(0)}ms</span>}
          {p95 !== null && <span>p95: {p95.toFixed(0)}ms</span>}
          {p99 !== null && <span>p99: {p99.toFixed(0)}ms</span>}
        </div>
      )}

      {images.length > 0 && mode === "comparison" && (
        <div className="comparison-stats">
          <div className="stats-group">
            <h4>{images[0]?.url ? new URL(images[0].url).hostname : "Base URL"}</h4>
            <div className="stats">
              <span>Total: {images.length} images</span>
              <span>Loaded: {loadedImages.length}</span>
              {avgLoadTime > 0 && (
                <span>Average: {avgLoadTime.toFixed(0)}ms</span>
              )}
              {p95 !== null && <span>p95: {p95.toFixed(0)}ms</span>}
              {p99 !== null && <span>p99: {p99.toFixed(0)}ms</span>}
            </div>
          </div>
          <div className="stats-group">
            <h4>{images[0]?.url2 ? new URL(images[0].url2).hostname : "Compare URL"}</h4>
            <div className="stats">
              <span>Total: {images.length} images</span>
              <span>Loaded: {loadedImages2.length}</span>
              {avgLoadTime2 > 0 && (
                <span>Average: {avgLoadTime2.toFixed(0)}ms</span>
              )}
              {p95_2 !== null && <span>p95: {p95_2.toFixed(0)}ms</span>}
              {p99_2 !== null && <span>p99: {p99_2.toFixed(0)}ms</span>}
            </div>
          </div>
          {avgLoadTime > 0 && avgLoadTime2 > 0 && images[0]?.url && images[0]?.url2 && (
            <div className="stats-comparison">
              {avgLoadTime < avgLoadTime2 ? (
                <span className="faster">
                  {new URL(images[0].url).hostname} is {((avgLoadTime2 - avgLoadTime) / avgLoadTime2 * 100).toFixed(1)}% faster on average
                </span>
              ) : avgLoadTime > avgLoadTime2 ? (
                <span className="slower">
                  {new URL(images[0].url2).hostname} is {((avgLoadTime - avgLoadTime2) / avgLoadTime * 100).toFixed(1)}% faster on average
                </span>
              ) : (
                <span>Same average load time</span>
              )}
            </div>
          )}
        </div>
      )}

      <div
        className="histogram-section"
        style={{
          minHeight: histogramData.length > 0 ? "auto" : "0",
          padding: histogramData.length > 0 ? "1.5rem" : "0",
          marginBottom: histogramData.length > 0 ? "2rem" : "0",
          border: histogramData.length > 0 ? "1px solid #333" : "none",
        }}
      >
        {histogramData.length > 0 && mode === "single" && (
          <>
            <h3>Load Time Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={histogramData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="range"
                  stroke="#888"
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: "Load Time (ms)",
                    position: "insideBottom",
                    offset: -5,
                    fill: "#888",
                  }}
                />
                <YAxis
                  stroke="#888"
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: "Count",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#888",
                  }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "4px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#8b9299" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {histogramData.length > 0 && mode === "comparison" && images[0]?.url && images[0]?.url2 && (
          <>
            <h3>Load Time Distribution Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={histogramData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="range"
                  stroke="#888"
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: "Load Time (ms)",
                    position: "insideBottom",
                    offset: -5,
                    fill: "#888",
                  }}
                />
                <YAxis
                  stroke="#888"
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: "Count",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#888",
                  }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "4px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar
                  dataKey="base"
                  fill="#8b9299"
                  radius={[4, 4, 0, 0]}
                  name={new URL(images[0].url).hostname}
                />
                <Bar
                  dataKey="compare"
                  fill="#6b9fb0"
                  radius={[4, 4, 0, 0]}
                  name={new URL(images[0].url2).hostname}
                />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className={`image-grid ${mode === "comparison" ? "comparison-grid" : ""}`}>
        {images.map((image, index) => (
          <ImageCard
            key={`${image.url}-${index}-${loadTimestamp}`}
            url={image.url}
            url2={image.url2}
            index={index}
            onLoadComplete={handleLoadComplete}
            mode={mode}
          />
        ))}
        {images.length === 0 &&
          // Placeholder divs to maintain grid width
          Array.from({ length: 8 }).map((_, i) => (
            <div key={`placeholder-${i}`} className="image-card-placeholder" />
          ))}
      </div>
    </div>
  );
}

export default App;
