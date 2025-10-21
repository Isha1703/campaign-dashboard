/**
 * Media Display Component
 * Handles display of images, videos, and text content with S3 download
 */

import React, { useState, useEffect } from 'react';
import { Download, Play, Image as ImageIcon, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import s3MediaService, { MediaItem } from '../services/s3MediaService';
import awsS3Service from '../services/awsS3Service';

interface MediaDisplayProps {
  adId: string;
  content: string;
  adType: string;
  className?: string;
  onDownloadComplete?: (localPath: string) => void;
  onDownloadError?: (error: string) => void;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  adId,
  content,
  adType,
  className = '',
  onDownloadComplete,
  onDownloadError
}) => {
  const [mediaItem, setMediaItem] = useState<MediaItem>(() => 
    s3MediaService.createMediaItem(adId, content, adType)
  );
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Check if content is already a local path
    if (mediaItem.originalUrl.startsWith('/downloads/') || mediaItem.originalUrl.startsWith('/public/downloads/')) {
      // Transform /public/downloads/ paths to /downloads/ for Vite serving
      const localPath = mediaItem.originalUrl.startsWith('/public/downloads/') 
        ? mediaItem.originalUrl.replace('/public/', '/')
        : mediaItem.originalUrl;
        
      setMediaItem(prev => ({
        ...prev,
        downloadStatus: 'completed',
        localPath: localPath
      }));
      // Using local file (removed excessive logging)
      return;
    }

    // For both images and videos, try to display directly from S3 first
    if ((mediaItem.type === 'image' || mediaItem.type === 'video') && mediaItem.downloadStatus === 'pending') {
      // Mark as completed since they can display directly from S3
      setMediaItem(prev => ({
        ...prev,
        downloadStatus: 'completed'
      }));
      // Marked as ready for direct S3 display (removed excessive logging)
    }
  }, [mediaItem.type, mediaItem.originalUrl]);

  const handleDownload = async () => {
    if (mediaItem.type === 'text' || isDownloading) return;

    setIsDownloading(true);
    
    try {
      // Starting download (removed excessive logging)
      
      // Use the enhanced AWS S3 service
      const result = await awsS3Service.downloadFromS3({
        s3Uri: mediaItem.normalizedUrl,
        mediaType: mediaItem.type as 'image' | 'video'
      });
      
      if (result.success && result.localPath) {
        setMediaItem(prev => ({
          ...prev,
          localPath: result.localPath,
          downloadStatus: 'completed'
        }));
        
        onDownloadComplete?.(result.localPath);
        // Download completed (removed excessive logging)
      } else {
        throw new Error(result.error || 'Download failed');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      
      setMediaItem(prev => ({
        ...prev,
        downloadStatus: 'error',
        error: errorMessage
      }));
      
      onDownloadError?.(errorMessage);
      // Download failed (removed excessive logging)
    } finally {
      setIsDownloading(false);
    }
  };

  const renderTextContent = () => {
    // Check if content is actually a file path (video/image) that was misclassified
    if (content.includes('.mp4') || content.includes('.mov') || content.includes('.webm')) {
      // This is actually a video path, render as video
      const videoPath = content.startsWith('/public/') ? content.replace('/public/', '/') : content;
      return (
        <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`} style={{ width: '100%', height: '100%' }}>
          <video
            controls
            className="w-full h-full"
            style={{ minHeight: '400px', maxHeight: '70vh', objectFit: 'contain' }}
          >
            <source src={videoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    if (content.includes('.png') || content.includes('.jpg') || content.includes('.jpeg') || content.includes('.webp')) {
      // This is actually an image path, render as image
      const imagePath = content.startsWith('/public/') ? content.replace('/public/', '/') : content;
      return (
        <div className={`relative bg-gray-50 rounded-lg overflow-hidden ${className}`} style={{ width: '100%', height: '100%' }}>
          <img
            src={imagePath}
            alt="Ad content"
            className="w-full h-full"
            style={{ minHeight: '400px', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>
      );
    }
    
    // Regular text content
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700 mb-2">Text Ad Content</div>
            <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">{content}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderImageContent = () => {
    const displayUrl = s3MediaService.getDisplayUrl(mediaItem);
    
    return (
      <div className={`relative bg-gray-50 rounded-lg border overflow-hidden ${className}`} style={{ width: '100%', height: '100%' }}>
        <div className="relative" style={{ width: '100%', height: '100%' }}>
          <img
            src={displayUrl}
            alt={`Ad content for ${adId}`}
            className="w-full h-full"
            style={{ minHeight: '400px', maxHeight: '70vh', objectFit: 'contain' }}
            onLoad={() => {
              // Image loaded successfully (removed excessive logging)
            }}
            onError={(e) => {
              // Image load error (removed excessive logging)
              setMediaItem(prev => ({
                ...prev,
                downloadStatus: 'error',
                error: 'Image failed to load'
              }));
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Image+Error';
            }}
          />
          
          {/* Download status overlay */}
          <div className="absolute top-2 right-2">
            {mediaItem.downloadStatus === 'pending' && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <Download className="w-3 h-3" />
                <span>Pending</span>
              </div>
            )}
            {isDownloading && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <Download className="w-3 h-3 animate-bounce" />
                <span>Downloading...</span>
              </div>
            )}
            {mediaItem.downloadStatus === 'completed' && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Ready</span>
              </div>
            )}
            {mediaItem.downloadStatus === 'error' && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Error</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Image info */}
        <div className="p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Image Ad</span>
            </div>
            <div className="text-xs text-gray-500">
              {mediaItem.originalUrl.split('/').pop()}
            </div>
          </div>
          
          {mediaItem.downloadStatus === 'error' && (
            <div className="mt-2 text-xs text-red-600">
              Error: {mediaItem.error}
              <button
                onClick={handleDownload}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVideoContent = () => {
    const displayUrl = s3MediaService.getDisplayUrl(mediaItem);
    // Rendering video (removed excessive logging)
    
    return (
      <div className={`relative bg-gray-50 rounded-lg border overflow-hidden ${className}`}>
        <div className="relative" style={{ width: '100%', maxWidth: '400px', height: '225px' }}>
          {mediaItem.downloadStatus === 'completed' || mediaItem.downloadStatus === 'pending' ? (
            <video
              controls
              className="w-full h-full object-cover"
              poster="https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Video+Ready"
              onError={(e) => {
                // Video load error (removed excessive logging)
                const videoElement = e.target as HTMLVideoElement;
                setMediaItem(prev => ({
                  ...prev,
                  downloadStatus: 'error',
                  error: `Video failed to load: ${videoElement.error?.message || 'Unknown error'}`
                }));
              }}
              onLoadStart={() => {
                // Video loading started (removed excessive logging)
              }}
              onCanPlay={() => {
                // Video ready to play (removed excessive logging)
              }}
            >
              <source src={displayUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600">
                  {isDownloading ? 'Downloading video...' : 
                   mediaItem.downloadStatus === 'error' ? 'Video error' : 'Video preview'}
                </div>
                {mediaItem.downloadStatus === 'error' && (
                  <div className="text-xs text-red-600 mt-1">
                    {mediaItem.error}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Download status overlay */}
          <div className="absolute top-2 right-2">
            {mediaItem.downloadStatus === 'pending' && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <Download className="w-3 h-3" />
                <span>Pending</span>
              </div>
            )}
            {isDownloading && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <Download className="w-3 h-3 animate-bounce" />
                <span>Downloading...</span>
              </div>
            )}
            {mediaItem.downloadStatus === 'completed' && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Ready</span>
              </div>
            )}
            {mediaItem.downloadStatus === 'error' && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Error</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Video info */}
        <div className="p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Video Ad</span>
            </div>
            <div className="text-xs text-gray-500">
              {mediaItem.originalUrl.split('/').pop()}
            </div>
          </div>
          
          {mediaItem.downloadStatus === 'error' && (
            <div className="mt-2 text-xs text-red-600">
              Error: {mediaItem.error}
              <button
                onClick={handleDownload}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render based on media type (removed excessive logging)
  
  switch (mediaItem.type) {
    case 'text':
      // Rendering text content (removed excessive logging)
      return renderTextContent();
    case 'image':
      // Rendering image content (removed excessive logging)
      return renderImageContent();
    case 'video':
      // Rendering video content (removed excessive logging)
      return renderVideoContent();
    default:
      // Unknown type, rendering as text (removed excessive logging)
      return renderTextContent();
  }
};

export default MediaDisplay;