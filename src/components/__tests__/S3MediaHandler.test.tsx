import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import S3MediaHandler from '../S3MediaHandler';
import { ApiService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  ApiService: {
    downloadS3Media: vi.fn()
  }
}));

describe('S3MediaHandler Component', () => {
  const mockProps = {
    s3Uri: 's3://agentcore-demo-172/image-outputs/nova/nova_image_20251019_195214_44895a91.png',
    mediaType: 'image' as const,
    adId: 'test-ad-001',
    onDownloadComplete: vi.fn(),
    onDownloadError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders download button initially', () => {
    render(<S3MediaHandler {...mockProps} />);
    
    expect(screen.getByText('Image Content Available')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Image/i })).toBeInTheDocument();
  });

  it('normalizes image S3 URI correctly', async () => {
    const mockApiResponse = {
      success: true,
      local_url: '/downloads/test-image.png'
    };
    
    (ApiService.downloadS3Media as any).mockResolvedValue(mockApiResponse);

    render(<S3MediaHandler {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Download Image/i }));

    await waitFor(() => {
      expect(ApiService.downloadS3Media).toHaveBeenCalledWith({
        s3_path: 's3://agentcore-demo-172/image-outputs/nova/nova_image_20251019_195214_44895a91.png',
        content_type: 'image'
      });
    });
  });

  it('normalizes video S3 URI correctly', async () => {
    const videoProps = {
      ...mockProps,
      s3Uri: 's3://agentcore-demo-172/video-outputs/z62sbdb8vs5i/output.mp4',
      mediaType: 'video' as const
    };

    const mockApiResponse = {
      success: true,
      local_url: '/downloads/test-video.mp4'
    };
    
    (ApiService.downloadS3Media as any).mockResolvedValue(mockApiResponse);

    render(<S3MediaHandler {...videoProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Download Video/i }));

    await waitFor(() => {
      expect(ApiService.downloadS3Media).toHaveBeenCalledWith({
        s3_path: 's3://agentcore-demo-172/video-outputs/z62sbdb8vs5i/output.mp4',
        content_type: 'video'
      });
    });
  });

  it('handles malformed image URI by normalizing to standard format', async () => {
    const malformedProps = {
      ...mockProps,
      s3Uri: 's3://some-other-bucket/random/path/nova_image_20251019_195214_44895a91.png'
    };

    const mockApiResponse = {
      success: true,
      local_url: '/downloads/test-image.png'
    };
    
    (ApiService.downloadS3Media as any).mockResolvedValue(mockApiResponse);

    render(<S3MediaHandler {...malformedProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Download Image/i }));

    await waitFor(() => {
      expect(ApiService.downloadS3Media).toHaveBeenCalledWith({
        s3_path: 's3://agentcore-demo-172/image-outputs/nova/nova_image_20251019_195214_44895a91.png',
        content_type: 'image'
      });
    });
  });

  it('handles malformed video URI by normalizing to standard format', async () => {
    const malformedProps = {
      ...mockProps,
      s3Uri: 's3://some-other-bucket/random/path/video123.mp4',
      mediaType: 'video' as const
    };

    const mockApiResponse = {
      success: true,
      local_url: '/downloads/test-video.mp4'
    };
    
    (ApiService.downloadS3Media as any).mockResolvedValue(mockApiResponse);

    render(<S3MediaHandler {...malformedProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Download Video/i }));

    await waitFor(() => {
      expect(ApiService.downloadS3Media).toHaveBeenCalledWith({
        s3_path: 's3://agentcore-demo-172/video-outputs/video123/output.mp4',
        content_type: 'video'
      });
    });
  });

  it('shows loading state during download', async () => {
    const mockApiResponse = new Promise(resolve => 
      setTimeout(() => resolve({
        success: true,
        local_url: '/downloads/test-image.png'
      }), 100)
    );
    
    (ApiService.downloadS3Media as any).mockReturnValue(mockApiResponse);

    render(<S3MediaHandler {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Download Image/i }));

    expect(screen.getByText('Retrieving the image...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Retrieving the image...')).not.toBeInTheDocument();
    });
  });

  it('handles download errors gracefully', async () => {
    const mockApiResponse = {
      success: false,
      error: 'S3 bucket not accessible'
    };
    
    (ApiService.downloadS3Media as any).mockResolvedValue(mockApiResponse);

    render(<S3MediaHandler {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Download Image/i }));

    await waitFor(() => {
      expect(screen.getByText('Download Failed')).toBeInTheDocument();
      expect(screen.getByText('S3 bucket not accessible')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Download/i })).toBeInTheDocument();
    });
  });

  it('displays image after successful download', async () => {
    const mockApiResponse = {
      success: true,
      local_url: '/downloads/test-image.png'
    };
    
    (ApiService.downloadS3Media as any).mockResolvedValue(mockApiResponse);

    render(<S3MediaHandler {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Download Image/i }));

    await waitFor(() => {
      const image = screen.getByAltText('Generated ad content for test-ad-001');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/downloads/test-image.png');
    });
  });
});