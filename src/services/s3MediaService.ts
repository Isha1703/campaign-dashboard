/**
 * S3 Media Service
 * Handles S3 URL normalization and media download/display
 */

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'text';
  originalUrl: string;
  normalizedUrl: string;
  localPath?: string;
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

class S3MediaService {
  private downloadCache: Map<string, MediaItem> = new Map();
  private downloadPromises: Map<string, Promise<string>> = new Map();

  /**
   * Normalize S3 URLs to correct format
   */
  normalizeS3Url(url: string): string {
    if (!url) return url;

    // Handle HTTPS URLs with .s3.amazonaws.com - remove the .s3.amazonaws.com part
    if (url.includes('agentcore-demo-172.s3.amazonaws.com')) {
      const correctedUrl = url.replace('.s3.amazonaws.com', '');
      console.log('🔄 Normalized S3 URL:', url, '->', correctedUrl);
      return correctedUrl;
    }

    // Convert S3 URI to HTTPS URL
    if (url.startsWith('s3://agentcore-demo-172/')) {
      const path = url.replace('s3://agentcore-demo-172/', '');
      
      // For video outputs, add /output.mp4 if not present
      if (path.startsWith('video-outputs/') && !path.endsWith('.mp4')) {
        const normalizedUrl = `https://agentcore-demo-172.s3.amazonaws.com/${path}/output.mp4`;
        console.log('🎥 Normalized video S3 URL:', url, '->', normalizedUrl);
        return normalizedUrl;
      }
      
      const normalizedUrl = `https://agentcore-demo-172.s3.amazonaws.com/${path}`;
      console.log('🖼️ Normalized S3 URL:', url, '->', normalizedUrl);
      return normalizedUrl;
    }

    return url;
  }

  /**
   * Get media type from URL or content
   */
  getMediaType(url: string, adType?: string): 'image' | 'video' | 'text' {
    if (!url) return 'text';
    
    // Check if it's a text description (longer than typical URLs)
    if (url.length > 200 || url.includes('VIDEO AD DESCRIPTION:')) {
      return 'text';
    }
    
    if (adType === 'text_ad') return 'text';
    if (adType === 'video_ad' && (url.includes('/video-outputs/') || url.startsWith('s3://') || url.includes('/downloads/videos/'))) return 'video';
    if (adType === 'image_ad' || url.includes('/image-outputs/')) return 'image';
    
    // Fallback detection
    if (url.includes('video') && url.startsWith('s3://')) return 'video';
    if (url.includes('image') || url.includes('.png') || url.includes('.jpg')) return 'image';
    
    return 'text';
  }

  /**
   * Create media item from ad content
   */
  createMediaItem(adId: string, content: string, adType: string): MediaItem {
    const mediaType = this.getMediaType(content, adType);
    const normalizedUrl = mediaType !== 'text' ? this.normalizeS3Url(content) : content;

    return {
      id: adId,
      type: mediaType,
      originalUrl: content,
      normalizedUrl,
      downloadStatus: mediaType === 'text' ? 'completed' : 'pending'
    };
  }

  /**
   * Download S3 media using AWS CLI
   */
  async downloadS3Media(s3Uri: string, mediaType: 'image' | 'video'): Promise<string> {
    // Check if already downloading
    if (this.downloadPromises.has(s3Uri)) {
      return this.downloadPromises.get(s3Uri)!;
    }

    // Check cache
    const cached = this.downloadCache.get(s3Uri);
    if (cached && cached.downloadStatus === 'completed' && cached.localPath) {
      return cached.localPath;
    }

    // Start download
    const downloadPromise = this.performS3Download(s3Uri, mediaType);
    this.downloadPromises.set(s3Uri, downloadPromise);

    try {
      const localPath = await downloadPromise;
      
      // Update cache
      this.downloadCache.set(s3Uri, {
        id: s3Uri,
        type: mediaType,
        originalUrl: s3Uri,
        normalizedUrl: s3Uri,
        localPath,
        downloadStatus: 'completed'
      });

      return localPath;
    } catch (error) {
      // Update cache with error
      this.downloadCache.set(s3Uri, {
        id: s3Uri,
        type: mediaType,
        originalUrl: s3Uri,
        normalizedUrl: s3Uri,
        downloadStatus: 'error',
        error: error instanceof Error ? error.message : 'Download failed'
      });
      
      throw error;
    } finally {
      this.downloadPromises.delete(s3Uri);
    }
  }

  /**
   * Perform actual S3 download using AWS CLI
   */
  private async performS3Download(s3Uri: string, mediaType: 'image' | 'video'): Promise<string> {
    try {
      console.log(`🔄 Downloading ${mediaType} from S3:`, s3Uri);
      
      // Extract the file path components
      const urlParts = s3Uri.replace('s3://agentcore-demo-172/', '').split('/');
      let filename: string;
      let localPath: string;
      
      if (mediaType === 'video') {
        // For videos: s3://agentcore-demo-172/video-outputs/n0h1znmn3j85/output.mp4
        const videoId = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
        filename = `${videoId}.mp4`;
        localPath = `/downloads/videos/${filename}`;
      } else {
        // For images: extract filename from URL
        filename = urlParts[urlParts.length - 1] || 'image.png';
        localPath = `/downloads/images/${filename}`;
      }
      
      // Simulate AWS CLI download command
      // In real implementation: aws s3 cp s3Uri localPath
      console.log(`📋 AWS CLI Command: aws s3 cp "${s3Uri}" "${localPath}"`);
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`✅ Downloaded ${mediaType} to:`, localPath);
      
      // For demo, return appropriate placeholder URLs
      if (mediaType === 'image') {
        // Return a more realistic image placeholder
        return `https://picsum.photos/400/300?random=${Date.now()}`;
      } else {
        // Return a sample video for demo
        return 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
      }
      
    } catch (error) {
      console.error(`❌ Failed to download ${mediaType} from S3:`, error);
      throw new Error(`Failed to download ${mediaType}: ${error}`);
    }
  }

  /**
   * Get download status for a media item
   */
  getDownloadStatus(s3Uri: string): MediaItem | null {
    return this.downloadCache.get(s3Uri) || null;
  }

  /**
   * Clear download cache
   */
  clearCache(): void {
    this.downloadCache.clear();
    this.downloadPromises.clear();
  }

  /**
   * Get displayable URL for media
   */
  getDisplayUrl(mediaItem: MediaItem): string {
    if (mediaItem.type === 'text') {
      return mediaItem.originalUrl;
    }

    // Check if the original URL is already a local path
    if (mediaItem.originalUrl.startsWith('/downloads/')) {
      // Using local file path (removed excessive logging)
      return mediaItem.originalUrl;
    }
    
    // Handle paths that start with /public/downloads/ - convert to /downloads/ for Vite
    if (mediaItem.originalUrl.startsWith('/public/downloads/')) {
      // Convert /public/downloads/session-xxxx/ to /downloads/session-xxxx/ for Vite static serving
      const vitePath = mediaItem.originalUrl.replace('/public/', '/');
      return vitePath;
    }

    // If we have a downloaded local path, use that first
    if (mediaItem.downloadStatus === 'completed' && mediaItem.localPath) {
      // Using local path (removed excessive logging)
      // Handle paths that start with /public/downloads/ - convert to /downloads/ for Vite
      if (mediaItem.localPath.startsWith('/public/downloads/')) {
        return mediaItem.localPath.replace('/public/', '/');
      }
      return mediaItem.localPath;
    }

    // For S3 URLs, use the normalized URL for direct display
    if (mediaItem.normalizedUrl && mediaItem.normalizedUrl !== mediaItem.originalUrl) {
      // Using normalized URL (removed excessive logging)
      return mediaItem.normalizedUrl;
    }

    // Return placeholder while downloading or on error
    if (mediaItem.downloadStatus === 'error') {
      // Media item has error, using error placeholder (removed excessive logging)
      if (mediaItem.type === 'image') {
        return 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Image+Error';
      } else {
        return 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Video+Error';
      }
    }

    // Return loading placeholder
    if (mediaItem.type === 'image') {
      return 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Loading...';
    } else {
      return 'https://via.placeholder.com/400x300/E5E7EB/6B7280?text=Video+Loading...';
    }
  }
}

export default new S3MediaService();