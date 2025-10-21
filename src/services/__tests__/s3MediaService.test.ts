import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3MediaService } from '../s3MediaService';
import { ApiService } from '../api';

// Mock ApiService
vi.mock('../api', () => ({
  ApiService: {
    downloadS3Media: vi.fn()
  }
}));

describe('S3MediaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateS3Uri', () => {
    it('should validate correct S3 URIs', () => {
      const validUris = [
        's3://my-bucket/path/to/file.jpg',
        's3://test-bucket-123/folder/subfolder/video.mp4',
        's3://bucket.with.dots/file.png'
      ];

      validUris.forEach(uri => {
        const result = S3MediaService.validateS3Uri(uri);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid S3 URIs', () => {
      const invalidUris = [
        '',
        'http://example.com/file.jpg',
        's3://bucket',
        's3://bucket/',
        's3://ab/file.jpg', // bucket name too short
        's3://bucket-with-very-long-name-that-exceeds-sixty-three-characters/file.jpg'
      ];

      invalidUris.forEach(uri => {
        const result = S3MediaService.validateS3Uri(uri);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject URIs with dangerous characters', () => {
      const dangerousUris = [
        's3://bucket/file<script>.jpg',
        's3://bucket/file"test".jpg',
        's3://bucket/file|pipe.jpg'
      ];

      dangerousUris.forEach(uri => {
        const result = S3MediaService.validateS3Uri(uri);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });
  });

  describe('getMediaTypeFromUri', () => {
    it('should correctly identify image types', () => {
      const imageUris = [
        's3://bucket/image.jpg',
        's3://bucket/photo.jpeg',
        's3://bucket/graphic.png',
        's3://bucket/animation.gif',
        's3://bucket/modern.webp'
      ];

      imageUris.forEach(uri => {
        expect(S3MediaService.getMediaTypeFromUri(uri)).toBe('image');
      });
    });

    it('should correctly identify video types', () => {
      const videoUris = [
        's3://bucket/video.mp4',
        's3://bucket/clip.webm',
        's3://bucket/movie.avi',
        's3://bucket/recording.mov'
      ];

      videoUris.forEach(uri => {
        expect(S3MediaService.getMediaTypeFromUri(uri)).toBe('video');
      });
    });

    it('should return unknown for unsupported types', () => {
      const unknownUris = [
        's3://bucket/document.pdf',
        's3://bucket/archive.zip',
        's3://bucket/file-without-extension'
      ];

      unknownUris.forEach(uri => {
        expect(S3MediaService.getMediaTypeFromUri(uri)).toBe('unknown');
      });
    });
  });

  describe('parseS3Uri', () => {
    it('should correctly parse valid S3 URIs', () => {
      const uri = 's3://my-bucket/folder/subfolder/image.jpg';
      const result = S3MediaService.parseS3Uri(uri);

      expect(result).toEqual({
        bucket: 'my-bucket',
        key: 'folder/subfolder/image.jpg',
        filename: 'image.jpg',
        extension: 'jpg'
      });
    });

    it('should return null for invalid URIs', () => {
      const invalidUri = 'invalid-uri';
      const result = S3MediaService.parseS3Uri(invalidUri);
      expect(result).toBeNull();
    });

    it('should handle files without extensions', () => {
      const uri = 's3://bucket/path/filename';
      const result = S3MediaService.parseS3Uri(uri);

      expect(result).toEqual({
        bucket: 'bucket',
        key: 'path/filename',
        filename: 'filename',
        extension: ''
      });
    });
  });

  describe('generateLocalFilename', () => {
    it('should generate safe filenames', () => {
      const uri = 's3://bucket/path/image.jpg';
      const filename = S3MediaService.generateLocalFilename(uri, 'test');

      expect(filename).toMatch(/^test_[a-zA-Z0-9]+\.jpg$/);
    });

    it('should use default prefix when not provided', () => {
      const uri = 's3://bucket/path/video.mp4';
      const filename = S3MediaService.generateLocalFilename(uri);

      expect(filename).toMatch(/^media_[a-zA-Z0-9]+\.mp4$/);
    });

    it('should handle invalid URIs gracefully', () => {
      const invalidUri = 'invalid-uri';
      const filename = S3MediaService.generateLocalFilename(invalidUri);

      expect(filename).toMatch(/^media_\d+\.unknown$/);
    });
  });

  describe('batchDownload', () => {
    it('should download multiple media items successfully', async () => {
      const mockResponse = { success: true, local_url: 'http://localhost/media/file.jpg' };
      vi.mocked(ApiService.downloadS3Media).mockResolvedValue(mockResponse);

      const mediaItems = [
        { s3Uri: 's3://bucket/image1.jpg', mediaType: 'image' as const, adId: 'ad1' },
        { s3Uri: 's3://bucket/image2.jpg', mediaType: 'image' as const, adId: 'ad2' }
      ];

      const onProgress = vi.fn();
      const onItemComplete = vi.fn();

      const result = await S3MediaService.batchDownload(
        mediaItems,
        onProgress,
        onItemComplete
      );

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(onProgress).toHaveBeenCalled();
      expect(onItemComplete).toHaveBeenCalledTimes(2);
    });

    it('should handle download failures gracefully', async () => {
      vi.mocked(ApiService.downloadS3Media)
        .mockResolvedValueOnce({ success: true, local_url: 'http://localhost/media/file1.jpg' })
        .mockRejectedValueOnce(new Error('Download failed'));

      const mediaItems = [
        { s3Uri: 's3://bucket/image1.jpg', mediaType: 'image' as const, adId: 'ad1' },
        { s3Uri: 's3://bucket/image2.jpg', mediaType: 'image' as const, adId: 'ad2' }
      ];

      const onItemError = vi.fn();

      const result = await S3MediaService.batchDownload(
        mediaItems,
        undefined,
        undefined,
        onItemError
      );

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(onItemError).toHaveBeenCalledWith('ad2', 'Download failed');
    });
  });

  describe('isSupportedMediaType', () => {
    it('should correctly identify supported image formats', () => {
      expect(S3MediaService.isSupportedMediaType('image', 'jpg')).toBe(true);
      expect(S3MediaService.isSupportedMediaType('image', 'png')).toBe(true);
      expect(S3MediaService.isSupportedMediaType('image', 'pdf')).toBe(false);
    });

    it('should correctly identify supported video formats', () => {
      expect(S3MediaService.isSupportedMediaType('video', 'mp4')).toBe(true);
      expect(S3MediaService.isSupportedMediaType('video', 'webm')).toBe(true);
      expect(S3MediaService.isSupportedMediaType('video', 'txt')).toBe(false);
    });

    it('should return true for supported types without extension', () => {
      expect(S3MediaService.isSupportedMediaType('image')).toBe(true);
      expect(S3MediaService.isSupportedMediaType('video')).toBe(true);
      expect(S3MediaService.isSupportedMediaType('unknown')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(S3MediaService.formatFileSize(0)).toBe('0 Bytes');
      expect(S3MediaService.formatFileSize(1024)).toBe('1 KB');
      expect(S3MediaService.formatFileSize(1048576)).toBe('1 MB');
      expect(S3MediaService.formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(S3MediaService.formatFileSize(1536)).toBe('1.5 KB');
      expect(S3MediaService.formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('formatDuration', () => {
    it('should format video durations correctly', () => {
      expect(S3MediaService.formatDuration(30)).toBe('0:30');
      expect(S3MediaService.formatDuration(90)).toBe('1:30');
      expect(S3MediaService.formatDuration(3661)).toBe('1:01:01');
    });

    it('should pad single digits with zeros', () => {
      expect(S3MediaService.formatDuration(5)).toBe('0:05');
      expect(S3MediaService.formatDuration(65)).toBe('1:05');
    });
  });

  describe('validateDownloadedMedia', () => {
    it('should validate image files', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        set src(value: string) {
          // Simulate successful load
          setTimeout(() => this.onload?.(), 0);
        }
      };

      // @ts-ignore - mocking global Image
      global.Image = vi.fn(() => mockImage);

      const result = await S3MediaService.validateDownloadedMedia('http://example.com/image.jpg', 'image');
      expect(result).toBe(true);
    });

    it('should validate video files', async () => {
      // Mock document.createElement for video
      const mockVideo = {
        onloadedmetadata: null as any,
        onerror: null as any,
        set src(value: string) {
          // Simulate successful load
          setTimeout(() => this.onloadedmetadata?.(), 0);
        }
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as any);

      const result = await S3MediaService.validateDownloadedMedia('http://example.com/video.mp4', 'video');
      expect(result).toBe(true);
    });
  });
});