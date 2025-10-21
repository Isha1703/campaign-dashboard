# S3MediaHandler Component

The S3MediaHandler component provides a comprehensive solution for downloading, caching, and displaying media content from AWS S3 storage with progress tracking, error handling, and security validation.

## Features

### Core Functionality
- **S3 Media Download**: Downloads images and videos from S3 URIs using AWS S3 cp command via backend API
- **Progress Tracking**: Real-time download progress with visual indicators
- **Local Caching**: Intelligent caching system to avoid repeated downloads
- **Security Validation**: S3 URI validation and sanitization to prevent injection attacks
- **Error Handling**: Comprehensive error handling with retry mechanisms

### Media Support
- **Images**: JPG, JPEG, PNG, GIF, WebP, SVG
- **Videos**: MP4, WebM, OGG, AVI, MOV
- **Video Controls**: Play/pause, mute/unmute, progress bar
- **Responsive Design**: Adapts to different screen sizes

### User Experience
- **Loading States**: "Retrieving the video/image" messages during download
- **Cache Indicators**: Visual indicators for cached content
- **Download Cancellation**: Ability to cancel ongoing downloads
- **Retry Mechanism**: One-click retry for failed downloads

## Usage

### Basic Usage

```tsx
import S3MediaHandler from './components/S3MediaHandler';

function MyComponent() {
  return (
    <S3MediaHandler
      s3Uri="s3://my-bucket/path/to/image.jpg"
      mediaType="image"
      adId="ad-123"
      onDownloadComplete={(localUrl) => console.log('Downloaded:', localUrl)}
      onDownloadError={(error) => console.error('Error:', error)}
    />
  );
}
```

### Advanced Usage with All Props

```tsx
<S3MediaHandler
  s3Uri="s3://campaign-assets/video.mp4"
  mediaType="video"
  adId="campaign-video-1"
  className="custom-media-handler"
  onDownloadComplete={(localUrl) => {
    console.log('Video downloaded to:', localUrl);
    // Update UI state, analytics, etc.
  }}
  onDownloadError={(error) => {
    console.error('Download failed:', error);
    // Show user-friendly error message
  }}
  enableCaching={true}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `s3Uri` | `string` | ✅ | - | S3 URI in format `s3://bucket-name/path/to/file` |
| `mediaType` | `'image' \| 'video'` | ✅ | - | Type of media content |
| `adId` | `string` | ✅ | - | Unique identifier for the ad/content |
| `className` | `string` | ❌ | `''` | Additional CSS classes |
| `onDownloadComplete` | `(localUrl: string) => void` | ❌ | - | Callback when download succeeds |
| `onDownloadError` | `(error: string) => void` | ❌ | - | Callback when download fails |
| `enableCaching` | `boolean` | ❌ | `true` | Enable/disable local caching |

## S3MediaService Utility

The component is complemented by the `S3MediaService` utility class that provides additional functionality:

### URI Validation
```tsx
import { S3MediaService } from '../services/s3MediaService';

const validation = S3MediaService.validateS3Uri('s3://bucket/file.jpg');
if (validation.isValid) {
  // URI is valid and safe
} else {
  console.error(validation.error);
}
```

### Batch Downloads
```tsx
const mediaItems = [
  { s3Uri: 's3://bucket/image1.jpg', mediaType: 'image', adId: 'ad1' },
  { s3Uri: 's3://bucket/video1.mp4', mediaType: 'video', adId: 'ad2' }
];

const result = await S3MediaService.batchDownload(
  mediaItems,
  (completed, total, currentItem) => {
    console.log(`Progress: ${completed}/${total}, Current: ${currentItem}`);
  },
  (adId, localUrl) => {
    console.log(`${adId} downloaded: ${localUrl}`);
  },
  (adId, error) => {
    console.error(`${adId} failed: ${error}`);
  }
);
```

### Media Type Detection
```tsx
const mediaType = S3MediaService.getMediaTypeFromUri('s3://bucket/video.mp4');
// Returns: 'video'

const isSupported = S3MediaService.isSupportedMediaType('image', 'jpg');
// Returns: true
```

### URI Parsing
```tsx
const parsed = S3MediaService.parseS3Uri('s3://my-bucket/folder/image.jpg');
// Returns: { bucket: 'my-bucket', key: 'folder/image.jpg', filename: 'image.jpg', extension: 'jpg' }
```

## Caching System

The component includes an intelligent caching system via the `S3MediaCache` class:

### Cache Management
```tsx
import { S3MediaCache } from './components/S3MediaHandler';

const cache = S3MediaCache.getInstance();

// Get cache statistics
const stats = cache.getStats();
console.log(`Cached items: ${stats.size}`);

// Clear cache
cache.clear();

// Manual cache operations
cache.set('s3://bucket/file.jpg', 'http://localhost/media/file.jpg', 'image');
const cachedUrl = cache.get('s3://bucket/file.jpg');
```

### Cache Features
- **Automatic Expiry**: Cache entries expire after 24 hours
- **Memory Efficient**: Uses Map-based storage with automatic cleanup
- **Singleton Pattern**: Single cache instance across the application
- **Statistics**: Provides cache size and entry information

## Security Features

### URI Validation
- Validates S3 URI format (`s3://bucket-name/path`)
- Checks bucket name length (3-63 characters)
- Prevents dangerous characters (`<>:"\\|?*` and control characters)
- Sanitizes URIs before processing

### Safe File Handling
- Generates safe local filenames using hash-based approach
- Validates downloaded media files
- Prevents path traversal attacks
- Secure error message handling

## Error Handling

The component provides comprehensive error handling:

### Network Errors
- Connection timeouts
- Network unavailability
- Server errors (5xx)

### S3-Specific Errors
- Invalid S3 URIs
- Access denied
- File not found
- Unsupported file formats

### User Experience
- User-friendly error messages
- Retry buttons for failed downloads
- Progress cancellation
- Graceful degradation

## Integration with Backend

The component integrates with the backend API through the `ApiService`:

### API Endpoint
```
POST /api/download-s3-content
{
  "s3_path": "s3://bucket/file.jpg",
  "content_type": "image"
}
```

### Expected Response
```json
{
  "success": true,
  "local_url": "http://localhost/media/downloaded-file.jpg"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to download file from S3"
}
```

## Styling and Customization

The component uses Tailwind CSS classes and can be customized:

### CSS Classes
- `.s3-media-handler`: Root container class
- Custom classes can be added via the `className` prop
- Responsive design with mobile-first approach

### Visual States
- **Download Button**: Blue theme with download icon
- **Loading State**: Animated spinner with progress bar
- **Error State**: Red theme with retry button
- **Success State**: Media display with cache indicator

## Performance Considerations

### Optimization Features
- **Lazy Loading**: Media is only downloaded when requested
- **Caching**: Prevents repeated downloads of the same content
- **Progress Tracking**: Provides user feedback during long downloads
- **Cancellation**: Allows users to cancel unwanted downloads

### Best Practices
- Use `enableCaching={true}` for frequently accessed media
- Implement `onDownloadComplete` for UI state updates
- Handle `onDownloadError` for user feedback
- Consider batch downloads for multiple media items

## Testing

The component includes comprehensive test coverage:

### Unit Tests
- Component rendering and interaction
- Cache functionality
- Error handling scenarios
- Video controls
- URI validation

### Test Files
- `src/components/__tests__/S3MediaHandler.test.tsx`
- `src/services/__tests__/s3MediaService.test.ts`

### Running Tests
```bash
npm run test
# or
npm run test:run
```

## Example Implementation

See `src/components/examples/S3MediaHandlerExample.tsx` for a complete example showing:
- Multiple media types
- Batch operations
- Cache management
- Error handling
- Progress tracking

## Requirements Fulfilled

This implementation fulfills the following requirements from the specification:

- **4.4**: S3 URI access and AWS S3 cp command execution
- **4.5**: Loading indicators with "retrieving the video/image" messages
- **11.1**: AWS S3 cp command with proper syntax and progress indicators
- **11.2**: Visual feedback and error handling for downloads

## Browser Compatibility

- Modern browsers with ES2017+ support
- Video playback requires HTML5 video support
- Image display works with standard image formats
- WebSocket support for real-time features (if used)

## Dependencies

- React 18+
- Axios for HTTP requests
- Lucide React for icons
- Tailwind CSS for styling
- TypeScript for type safety