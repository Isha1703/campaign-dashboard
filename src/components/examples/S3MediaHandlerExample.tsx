import React, { useState } from 'react';
import S3MediaHandler, { S3MediaCache } from '../S3MediaHandler';
import { S3MediaService } from '../../services/s3MediaService';
import { RefreshCw, Trash2, Info } from 'lucide-react';

/**
 * Example component demonstrating S3MediaHandler usage
 * This shows how to integrate the S3MediaHandler in a real application
 */
const S3MediaHandlerExample: React.FC = () => {
  const [exampleMedia] = useState([
    {
      id: 'ad-1',
      s3Uri: 's3://campaign-assets/ads/instagram-story-video.mp4',
      mediaType: 'video' as const,
      platform: 'Instagram',
      adType: 'Story Video'
    },
    {
      id: 'ad-2', 
      s3Uri: 's3://campaign-assets/ads/facebook-carousel-image-1.jpg',
      mediaType: 'image' as const,
      platform: 'Facebook',
      adType: 'Carousel Image'
    },
    {
      id: 'ad-3',
      s3Uri: 's3://campaign-assets/ads/linkedin-sponsored-video.mp4', 
      mediaType: 'video' as const,
      platform: 'LinkedIn',
      adType: 'Sponsored Video'
    },
    {
      id: 'ad-4',
      s3Uri: 's3://campaign-assets/ads/tiktok-native-image.png',
      mediaType: 'image' as const,
      platform: 'TikTok', 
      adType: 'Native Image'
    }
  ]);

  const [downloadStatus, setDownloadStatus] = useState<Record<string, string>>({});
  const [cacheStats, setCacheStats] = useState(S3MediaCache.getInstance().getStats());
  const [batchDownloadProgress, setBatchDownloadProgress] = useState<{
    isRunning: boolean;
    completed: number;
    total: number;
    currentItem: string;
  }>({
    isRunning: false,
    completed: 0,
    total: 0,
    currentItem: ''
  });

  // Handle individual download completion
  const handleDownloadComplete = (adId: string, localUrl: string) => {
    setDownloadStatus(prev => ({
      ...prev,
      [adId]: `✅ Downloaded: ${localUrl}`
    }));
    setCacheStats(S3MediaCache.getInstance().getStats());
  };

  // Handle individual download error
  const handleDownloadError = (adId: string, error: string) => {
    setDownloadStatus(prev => ({
      ...prev,
      [adId]: `❌ Error: ${error}`
    }));
  };

  // Batch download all media
  const handleBatchDownload = async () => {
    setBatchDownloadProgress({
      isRunning: true,
      completed: 0,
      total: exampleMedia.length,
      currentItem: ''
    });

    try {
      await S3MediaService.batchDownload(
        exampleMedia.map(media => ({
          s3Uri: media.s3Uri,
          mediaType: media.mediaType,
          adId: media.id
        })),
        (completed, total, currentItem) => {
          setBatchDownloadProgress({
            isRunning: completed < total,
            completed,
            total,
            currentItem
          });
        },
        (adId, localUrl) => {
          handleDownloadComplete(adId, localUrl);
        },
        (adId, error) => {
          handleDownloadError(adId, error);
        }
      );
    } catch (error) {
      console.error('Batch download failed:', error);
    }
  };

  // Clear cache
  const handleClearCache = () => {
    S3MediaCache.getInstance().clear();
    setCacheStats(S3MediaCache.getInstance().getStats());
    setDownloadStatus({});
  };

  // Preload media
  const handlePreloadMedia = async () => {
    try {
      await S3MediaService.preloadMedia(
        exampleMedia.map(media => ({
          s3Uri: media.s3Uri,
          mediaType: media.mediaType
        })),
        2 // Max 2 concurrent downloads
      );
      setCacheStats(S3MediaCache.getInstance().getStats());
    } catch (error) {
      console.error('Preload failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          S3MediaHandler Example
        </h1>
        <p className="text-gray-600 mb-6">
          This example demonstrates the S3MediaHandler component with various media types,
          caching, batch operations, and error handling.
        </p>

        {/* Control Panel */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Control Panel</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleBatchDownload}
              disabled={batchDownloadProgress.isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${batchDownloadProgress.isRunning ? 'animate-spin' : ''}`} />
              {batchDownloadProgress.isRunning ? 'Downloading...' : 'Batch Download All'}
            </button>
            
            <button
              onClick={handlePreloadMedia}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Preload Media
            </button>
            
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cache
            </button>
          </div>

          {/* Batch Progress */}
          {batchDownloadProgress.isRunning && (
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  Batch Download Progress
                </span>
                <span className="text-sm text-blue-600">
                  {batchDownloadProgress.completed}/{batchDownloadProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(batchDownloadProgress.completed / batchDownloadProgress.total) * 100}%` 
                  }}
                />
              </div>
              {batchDownloadProgress.currentItem && (
                <p className="text-xs text-blue-600">
                  Current: {batchDownloadProgress.currentItem}
                </p>
              )}
            </div>
          )}

          {/* Cache Stats */}
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Cache Statistics</span>
            </div>
            <p className="text-sm text-green-600">
              Cached items: {cacheStats.size} | 
              Supported formats: Images ({S3MediaService.getSupportedFormats().images.join(', ')}), 
              Videos ({S3MediaService.getSupportedFormats().videos.join(', ')})
            </p>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exampleMedia.map((media) => (
          <div key={media.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Media Header */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{media.platform} - {media.adType}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  media.mediaType === 'video' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {media.mediaType.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-mono break-all">
                {media.s3Uri}
              </p>
              
              {/* URI Validation Info */}
              <div className="mt-2">
                {(() => {
                  const validation = S3MediaService.validateS3Uri(media.s3Uri);
                  const parsedUri = S3MediaService.parseS3Uri(media.s3Uri);
                  const detectedType = S3MediaService.getMediaTypeFromUri(media.s3Uri);
                  
                  return (
                    <div className="text-xs space-y-1">
                      <div className={`flex items-center gap-1 ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{validation.isValid ? '✅' : '❌'}</span>
                        <span>URI Validation: {validation.isValid ? 'Valid' : validation.error}</span>
                      </div>
                      {parsedUri && (
                        <div className="text-gray-500">
                          📁 Bucket: {parsedUri.bucket} | 📄 File: {parsedUri.filename}
                        </div>
                      )}
                      <div className="text-gray-500">
                        🔍 Detected Type: {detectedType} | 
                        ✅ Supported: {S3MediaService.isSupportedMediaType(media.mediaType, parsedUri?.extension) ? 'Yes' : 'No'}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* S3MediaHandler Component */}
            <div className="p-4">
              <S3MediaHandler
                s3Uri={media.s3Uri}
                mediaType={media.mediaType}
                adId={media.id}
                onDownloadComplete={(localUrl) => handleDownloadComplete(media.id, localUrl)}
                onDownloadError={(error) => handleDownloadError(media.id, error)}
                enableCaching={true}
                className="w-full"
              />
            </div>

            {/* Status Display */}
            {downloadStatus[media.id] && (
              <div className="px-4 pb-4">
                <div className={`p-2 rounded text-sm ${
                  downloadStatus[media.id].startsWith('✅') 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {downloadStatus[media.id]}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Instructions</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Individual Downloads:</strong> Click the download button on each media item to download and view the content.
          </p>
          <p>
            <strong>Batch Download:</strong> Use the "Batch Download All" button to download all media items simultaneously.
          </p>
          <p>
            <strong>Caching:</strong> Downloaded media is automatically cached. Use "Clear Cache" to reset.
          </p>
          <p>
            <strong>Preloading:</strong> Use "Preload Media" to download all media in the background for faster access.
          </p>
          <p>
            <strong>Error Handling:</strong> Invalid URIs and download failures are handled gracefully with retry options.
          </p>
          <p>
            <strong>Video Controls:</strong> Video content includes play/pause and mute controls.
          </p>
        </div>
      </div>
    </div>
  );
};

export default S3MediaHandlerExample;