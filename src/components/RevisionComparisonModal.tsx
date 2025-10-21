import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  Download,
  RefreshCw,
  Clock,
  Zap,
  FileText,
  Image,
  Video
} from 'lucide-react';
import type { GeneratedAd } from '../types';
import S3MediaHandler from './S3MediaHandler';

interface RevisionComparisonModalProps {
  isOpen: boolean;
  originalAd: GeneratedAd;
  revisedAd: GeneratedAd;
  changes: string[];
  revisionSummary?: {
    revision_approach: string;
    key_improvements: string[];
    expected_impact: string;
  };
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const RevisionComparisonModal: React.FC<RevisionComparisonModalProps> = ({
  isOpen,
  originalAd,
  revisedAd,
  changes,
  revisionSummary,
  onApprove,
  onReject,
  onClose,
  isProcessing = false
}) => {
  const [showOriginal, setShowOriginal] = useState(true);
  const [showRevised, setShowRevised] = useState(true);

  if (!isOpen) return null;

  const getAdTypeIcon = (adType: string) => {
    switch (adType) {
      case 'text_ad':
        return <FileText className="w-4 h-4" />;
      case 'image_ad':
        return <Image className="w-4 h-4" />;
      case 'video_ad':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderAdContent = (ad: GeneratedAd, isRevised: boolean = false) => {
    return (
      <div className={`border rounded-lg p-4 ${isRevised ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
        {/* Ad Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getAdTypeIcon(ad.ad_type)}
            <span className="font-medium text-gray-900">
              {ad.platform} - {ad.ad_type.replace('_', ' ').toUpperCase()}
            </span>
            {isRevised && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Revised
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            ID: {ad.id}
          </div>
        </div>

        {/* Text Content */}
        {ad.content && ad.ad_type === 'text_ad' && (
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Content:</div>
            <div className="bg-white border rounded p-3 text-sm text-gray-900">
              {ad.content}
            </div>
          </div>
        )}

        {/* Media Content */}
        {ad.s3_uri && (ad.ad_type === 'image_ad' || ad.ad_type === 'video_ad') && (
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {ad.ad_type === 'image_ad' ? 'Image:' : 'Video:'}
            </div>
            <S3MediaHandler
              s3Uri={ad.s3_uri}
              mediaType={ad.ad_type === 'image_ad' ? 'image' : 'video'}
              onDownloadComplete={() => {}}
              className="max-w-full h-48 object-cover rounded"
            />
          </div>
        )}

        {/* Tools Used */}
        {ad.tools_used && ad.tools_used.length > 0 && (
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Tools Used:</div>
            <div className="flex flex-wrap gap-1">
              {ad.tools_used.map((tool, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Revision Metadata */}
        {isRevised && ad.revision_metadata && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="text-sm font-medium text-green-700 mb-2">Revision Details:</div>
            <div className="space-y-1 text-xs text-green-600">
              <div>Type: {ad.revision_metadata.revision_type}</div>
              <div>Timestamp: {new Date(ad.revision_metadata.revision_timestamp).toLocaleString()}</div>
              {ad.revision_metadata.improvements && ad.revision_metadata.improvements.length > 0 && (
                <div>
                  Improvements: {ad.revision_metadata.improvements.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Content Revision Comparison</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review the changes made to your ad content
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Revision Summary */}
          {revisionSummary && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Revision Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Approach:</span>
                  <span className="text-blue-700 ml-2">{revisionSummary.revision_approach}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Expected Impact:</span>
                  <span className="text-blue-700 ml-2">{revisionSummary.expected_impact}</span>
                </div>
                {revisionSummary.key_improvements && revisionSummary.key_improvements.length > 0 && (
                  <div>
                    <span className="font-medium text-blue-800">Key Improvements:</span>
                    <ul className="list-disc list-inside text-blue-700 ml-2 mt-1">
                      {revisionSummary.key_improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changes Summary */}
          {changes && changes.length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                <h3 className="font-medium text-orange-900">Changes Made</h3>
              </div>
              <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                {changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          )}

          {/* View Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showOriginal 
                  ? 'bg-gray-100 border-gray-300 text-gray-700' 
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Original</span>
            </button>
            
            <ArrowRight className="w-5 h-5 text-gray-400" />
            
            <button
              onClick={() => setShowRevised(!showRevised)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showRevised 
                  ? 'bg-green-100 border-green-300 text-green-700' 
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {showRevised ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Revised</span>
            </button>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Content */}
            {showOriginal && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Original Content</h3>
                </div>
                {renderAdContent(originalAd, false)}
              </div>
            )}

            {/* Revised Content */}
            {showRevised && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-green-600" />
                  <h3 className="font-medium text-gray-900">Revised Content</h3>
                </div>
                {renderAdContent(revisedAd, true)}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Review the changes and decide whether to approve or reject the revision
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onReject}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Revision</span>
            </button>
            
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Approve Revision'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionComparisonModal;