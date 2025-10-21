import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, AlertCircle, CheckCircle, Loader2, Play, Pause, Volume2, VolumeX, Clock, HardDrive } from 'lucide-react';
import s3MediaService from '../services/s3MediaService';

export interface S3MediaHandlerProps {
  s3Uri: string;
  mediaType: 'image' | 'video';
  adId: string;
  className?: string;
  onDownloadComplete?: (localUrl: string) => void;
  onDownloadError?: (error: string) => void;
  enableCaching?: boolean;
}

interface DownloadProgress {
  isDownloading: boolean;
  progress: number;
  error: string | null;
  localUrl: string | null;
  cached: boolean;
  estimatedTimeRemaining?: number;
  downloadSpeed?: number;
  fileSize?: number;
}

interface CacheEntry {
  localUrl: string;
  timestamp: number;
  s3Uri: string;
  mediaType: 'image' | 'video';
}

// Local cache management
class S3MediaCache {
  private static instance: S3MediaCache;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): S3MediaCache {
    if (!S3MediaCache.instance) {
      S3MediaCache.instance = new S3MediaCache();
    }
    return S3MediaCache.instance;
  }

  getCacheKey(s3Uri: string): string {
    return btoa(s3Uri).replace(/[^a-zA-Z0-9]/g, '');
  }

  get(s3Uri: string): string | null {
    const key = this.getCacheKey(s3Uri);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(key);
      return null;
    }

    return entry.localUrl;
  }

  set(s3Uri: string, localUrl: string, mediaType: 'image' | 'video'): void {
    const key = this.getCacheKey(s3Uri);
    this.cache.set(key, {
      localUrl,
      timestamp: Date.now(),
      s3Uri,
      mediaType
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; entries: CacheEntry[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values())
    };
  }
}

const S3MediaHandler: React.FC<S3MediaHandlerProps> = ({
  s3Uri,
  mediaType,
  adId,
  className = '',
  onDownloadComplete,
  onDownloadError,
  enableCaching = true
}) => {
  const [downloadState, setDownloadState] = useState<DownloadProgress>({
    isDownloading: false,
    progress: 0,
    error: null,
    localUrl: null,
    cached: false
  });

  const [videoState, setVideoState] = useState({
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    duration: 0
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const cache = S3MediaCache.getInstance();
  const downloadAbortController = useRef<AbortController | null>(null);

  // Get estimated file size for progress calculation
  const getEstimatedFileSize = useCallback(() => {
    // Return estimated file sizes based on media type
    return mediaType === 'video' ? 5 * 1024 * 1024 : 500 * 1024; // 5MB for video, 500KB for image
  }, [mediaType]);

  // Normalize S3 URI to correct format based on media type
  const normalizeS3Uri = useCallback((uri: string): string => {
    return s3MediaService.normalizeS3Url(uri);
  }, []);

  // Check cache for existing download
  const checkCache = useCallback(() => {
    if (!enableCaching) return null;

    // Use normalized URI for cache lookup
    const normalizedUri = normalizeS3Uri(s3Uri);
    const cachedUrl = cache.get(normalizedUri);
    if (cachedUrl) {
      setDownloadState(prev => ({
        ...prev,
        localUrl: cachedUrl,
        cached: true
      }));
      return cachedUrl;
    }
    return null;
  }, [s3Uri, mediaType, enableCaching, cache, normalizeS3Uri]);

  // Enhanced download media from S3 with better progress tracking
  const downloadMedia = useCallback(async () => {
    // Basic validation for S3 URI
    if (!s3Uri || (!s3Uri.startsWith('s3://') && !s3Uri.startsWith('https://'))) {
      const error = 'Invalid S3 URI format';
      setDownloadState(prev => ({ ...prev, error }));
      onDownloadError?.(error);
      return;
    }

    // Check cache first
    const cachedUrl = checkCache();
    if (cachedUrl) {
      onDownloadComplete?.(cachedUrl);
      return;
    }

    // Get file size estimate for better progress tracking
    const estimatedSize = getEstimatedFileSize();
    const estimatedTime = Math.ceil(estimatedSize / (1024 * 1024)); // Rough estimate in seconds

    // Use S3MediaService for download
    const downloadStartTime = Date.now();

    setDownloadState(prev => ({
      ...prev,
      isDownloading: true,
      progress: 0,
      error: null,
      fileSize: estimatedSize,
      estimatedTimeRemaining: estimatedTime
    }));

    // Create abort controller for cancellation
    downloadAbortController.current = new AbortController();

    try {
      // Enhanced progress simulation with time estimation
      const progressInterval = setInterval(() => {
        setDownloadState(prev => {
          if (prev.progress < 90) {
            const elapsed = (Date.now() - downloadStartTime) / 1000;
            const newProgress = Math.min(prev.progress + 8, 90);
            const remainingProgress = 100 - newProgress;
            const estimatedRemaining = Math.max(0, (remainingProgress / newProgress) * elapsed);

            return {
              ...prev,
              progress: newProgress,
              estimatedTimeRemaining: Math.ceil(estimatedRemaining),
              downloadSpeed: estimatedSize / elapsed // bytes per second
            };
          }
          return prev;
        });
      }, 300);

      // Use s3MediaService for download
      const localUrl = await s3MediaService.downloadS3Media(s3Uri, mediaType);

      clearInterval(progressInterval);

      if (localUrl) {
        // Cache the result using normalized URI
        if (enableCaching) {
          const normalizedUri = s3MediaService.normalizeS3Url(s3Uri);
          cache.set(normalizedUri, localUrl, mediaType);
        }

        setDownloadState(prev => ({
          ...prev,
          isDownloading: false,
          progress: 100,
          localUrl,
          cached: false,
          estimatedTimeRemaining: 0
        }));

        onDownloadComplete?.(localUrl);
      } else {
        throw new Error('Failed to download media');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Download failed';
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: errorMessage,
        estimatedTimeRemaining: 0
      }));
      onDownloadError?.(errorMessage);
    }
  }, [s3Uri, mediaType, checkCache, enableCaching, cache, onDownloadComplete, onDownloadError, getEstimatedFileSize]);

  // Cancel download
  const cancelDownload = useCallback(() => {
    if (downloadAbortController.current) {
      downloadAbortController.current.abort();
      downloadAbortController.current = null;
    }

    setDownloadState(prev => ({
      ...prev,
      isDownloading: false,
      progress: 0,
      error: null
    }));
  }, []);

  // Retry download
  const retryDownload = useCallback(() => {
    setDownloadState(prev => ({
      ...prev,
      error: null
    }));
    downloadMedia();
  }, [downloadMedia]);

  // Video controls
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [videoState.isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setVideoState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, []);

  // Video event handlers
  const handleVideoPlay = useCallback(() => {
    setVideoState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handleVideoPause = useCallback(() => {
    setVideoState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setVideoState(prev => ({
        ...prev,
        currentTime: videoRef.current!.currentTime,
        duration: videoRef.current!.duration || 0
      }));
    }
  }, []);

  // Initialize component
  useEffect(() => {
    checkCache();
  }, [checkCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (downloadAbortController.current) {
        downloadAbortController.current.abort();
      }
    };
  }, []);

  // Enhanced loading state with better progress information
  const renderLoadingState = () => {
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-300">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <div className="text-center w-full max-w-xs">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {mediaType === 'video' ? '🎥 Retrieving the video...' : '🖼️ Retrieving the image...'}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${downloadState.progress}%` }}
            />
          </div>

          {/* Progress Information */}
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Progress:</span>
              <span className="font-medium">{Math.round(downloadState.progress)}%</span>
            </div>

            {downloadState.fileSize && (
              <div className="flex justify-between">
                <span className="flex items-center">
                  <HardDrive className="w-3 h-3 mr-1" />
                  Size:
                </span>
                <span>{formatFileSize(downloadState.fileSize)}</span>
              </div>
            )}

            {downloadState.estimatedTimeRemaining && downloadState.estimatedTimeRemaining > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Remaining:
                </span>
                <span>{formatTime(downloadState.estimatedTimeRemaining)}</span>
              </div>
            )}

            {downloadState.downloadSpeed && (
              <div className="flex justify-between">
                <span>Speed:</span>
                <span>{formatFileSize(downloadState.downloadSpeed)}/s</span>
              </div>
            )}
          </div>

          <button
            onClick={cancelDownload}
            className="mt-4 px-4 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
          >
            Cancel Download
          </button>
        </div>
      </div>
    );
  };

  // Render error state
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
      <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
      <div className="text-center">
        <p className="text-sm font-medium text-red-700 mb-2">Download Failed</p>
        <p className="text-xs text-red-600 mb-4">{downloadState.error}</p>
        <button
          onClick={retryDownload}
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
        >
          Retry Download
        </button>
      </div>
    </div>
  );

  // Render download button
  const renderDownloadButton = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-lg border border-blue-200">
      <Download className="w-8 h-8 text-blue-500 mb-4" />
      <div className="text-center">
        <p className="text-sm font-medium text-blue-700 mb-2">
          {mediaType === 'video' ? 'Video Content Available' : 'Image Content Available'}
        </p>
        <p className="text-xs text-blue-600 mb-4">Click to download and view</p>
        <button
          onClick={downloadMedia}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Download {mediaType === 'video' ? 'Video' : 'Image'}
        </button>
      </div>
    </div>
  );

  // Render image content
  const renderImage = () => (
    <div className="relative">
      <img
        src={downloadState.localUrl!}
        alt={`Generated ad content for ${adId}`}
        className="w-full h-auto rounded-lg shadow-lg"
        onError={() => {
          setDownloadState(prev => ({
            ...prev,
            error: 'Failed to load image'
          }));
        }}
      />
      {downloadState.cached && (
        <div className="absolute top-2 right-2 flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Cached
        </div>
      )}
    </div>
  );

  // Render video content
  const renderVideo = () => (
    <div className="relative">
      <video
        ref={videoRef}
        src={downloadState.localUrl!}
        className="w-full h-auto rounded-lg shadow-lg"
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onTimeUpdate={handleVideoTimeUpdate}
        onError={() => {
          setDownloadState(prev => ({
            ...prev,
            error: 'Failed to load video'
          }));
        }}
      />

      {/* Video Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-50 rounded-lg p-2">
        <button
          onClick={togglePlayPause}
          className="text-white hover:text-blue-300 transition-colors"
        >
          {videoState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <div className="flex-1 mx-3">
          <div className="w-full bg-gray-600 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full"
              style={{
                width: `${videoState.duration > 0 ? (videoState.currentTime / videoState.duration) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        <button
          onClick={toggleMute}
          className="text-white hover:text-blue-300 transition-colors"
        >
          {videoState.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {downloadState.cached && (
        <div className="absolute top-2 right-2 flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Cached
        </div>
      )}
    </div>
  );

  return (
    <div className={`s3-media-handler ${className}`}>
      {downloadState.error && renderErrorState()}
      {!downloadState.error && downloadState.isDownloading && renderLoadingState()}
      {!downloadState.error && !downloadState.isDownloading && !downloadState.localUrl && renderDownloadButton()}
      {!downloadState.error && !downloadState.isDownloading && downloadState.localUrl && (
        mediaType === 'image' ? renderImage() : renderVideo()
      )}
    </div>
  );
};

export default S3MediaHandler;
export { S3MediaCache };