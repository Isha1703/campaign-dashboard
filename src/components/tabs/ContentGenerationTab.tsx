/**
 * Content Generation Tab - Shows generated ads with approval/revision workflow
 * Integrates with S3 for media download and ContentRevisionAgent for revisions
 */

import React, { useState, useEffect } from 'react';
import { 
  Image, Video, FileText, Download, Check, Edit, 
  ExternalLink, Loader2, AlertCircle, CheckCircle,
  MessageSquare, RefreshCw
} from 'lucide-react';
import campaignWorkflowService, { CampaignState } from '../../services/campaignWorkflowService';

interface ContentGenerationTabProps {
  sessionId: string | null;
  onError: (error: string | null) => void;
}

interface GeneratedAd {
  asset_id: string;
  audience: string;
  platform: string;
  ad_type: 'image_ad' | 'video_ad' | 'text_ad';
  content: string;
  status: string;
  approval_status?: 'pending' | 'approved' | 'revising';
}

interface MediaDownloadState {
  [assetId: string]: {
    status: 'idle' | 'downloading' | 'completed' | 'error';
    progress: number;
    localUrl?: string;
    error?: string;
  };
}

const ContentGenerationTab: React.FC<ContentGenerationTabProps> = ({
  sessionId,
  onError
}) => {
  const [workflowState, setWorkflowState] = useState<CampaignState>(campaignWorkflowService.getCurrentState());
  const [mediaDownloads, setMediaDownloads] = useState<MediaDownloadState>({});
  const [revisionFeedback, setRevisionFeedback] = useState<Record<string, string>>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');

  useEffect(() => {
    // Subscribe to workflow updates
    const handleWorkflowUpdate = (state: CampaignState) => {
      setWorkflowState(state);
      if (state.content) {
        setLastUpdated(new Date().toLocaleTimeString());
        // Auto-download media for new ads
        autoDownloadMedia(state.content.ads || []);
      }
    };

    campaignWorkflowService.addCallback(handleWorkflowUpdate);

    return () => {
      campaignWorkflowService.removeCallback(handleWorkflowUpdate);
    };
  }, []);

  const autoDownloadMedia = async (ads: GeneratedAd[]) => {
    for (const ad of ads) {
      if ((ad.ad_type === 'image_ad' || ad.ad_type === 'video_ad') && 
          !mediaDownloads[ad.asset_id] && 
          (ad.content.startsWith('http') || ad.content.startsWith('s3://'))) {
        await downloadMedia(ad.asset_id, ad.content, ad.ad_type);
      }
    }
  };

  const downloadMedia = async (assetId: string, s3Uri: string, adType: string) => {
    console.log(`📥 Downloading ${adType} for ${assetId}:`, s3Uri);
    
    setMediaDownloads(prev => ({
      ...prev,
      [assetId]: { status: 'downloading', progress: 0 }
    }));

    try {
      // Simulate S3 download with progress
      // In real implementation, you would use AWS SDK or your backend API
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);
        }
        
        setMediaDownloads(prev => ({
          ...prev,
          [assetId]: { ...prev[assetId], progress }
        }));
      }, 200);

      // Simulate download completion
      setTimeout(() => {
        clearInterval(progressInterval);
        
        // For demo purposes, use the original URL
        // In real implementation, this would be the downloaded local file
        setMediaDownloads(prev => ({
          ...prev,
          [assetId]: {
            status: 'completed',
            progress: 100,
            localUrl: s3Uri.startsWith('http') ? s3Uri : `https://agentcore-demo-172.s3.amazonaws.com/placeholder-${adType}.png`
          }
        }));
      }, 2000 + Math.random() * 3000);

    } catch (error) {
      console.error(`Error downloading media for ${assetId}:`, error);
      setMediaDownloads(prev => ({
        ...prev,
        [assetId]: {
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Download failed'
        }
      }));
    }
  };

  const handleApprove = (assetId: string) => {
    console.log(`✅ Approving ad: ${assetId}`);
    campaignWorkflowService.approveAd(assetId);
  };

  const handleRevise = (assetId: string) => {
    setShowFeedbackModal(assetId);
  };

  const submitRevision = (assetId: string) => {
    const feedback = revisionFeedback[assetId];
    if (!feedback?.trim()) {
      onError('Please provide feedback for the revision');
      return;
    }

    console.log(`🔄 Requesting revision for ${assetId}:`, feedback);
    campaignWorkflowService.requestRevision(assetId, feedback);
    
    setShowFeedbackModal(null);
    setRevisionFeedback(prev => ({ ...prev, [assetId]: '' }));
  };

  const getAdTypeIcon = (adType: string) => {
    switch (adType) {
      case 'image_ad':
        return <Image className="w-5 h-5" />;
      case 'video_ad':
        return <Video className="w-5 h-5" />;
      case 'text_ad':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'revising':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderMediaContent = (ad: GeneratedAd) => {
    const downloadState = mediaDownloads[ad.asset_id];

    if (ad.ad_type === 'text_ad') {
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Ad Copy:</h4>
          <p className="text-gray-700 leading-relaxed">{ad.content}</p>
        </div>
      );
    }

    if (!downloadState || downloadState.status === 'idle') {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Preparing media...</p>
          </div>
        </div>
      );
    }

    if (downloadState.status === 'downloading') {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
          <div className="text-center">
            <Download className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Retrieving {ad.ad_type === 'image_ad' ? 'image' : 'video'}...</p>
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">{Math.round(downloadState.progress)}%</p>
          </div>
        </div>
      );
    }

    if (downloadState.status === 'error') {
      return (
        <div className="flex items-center justify-center h-48 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">Failed to load media</p>
            <p className="text-sm text-red-500 mt-1">{downloadState.error}</p>
          </div>
        </div>
      );
    }

    if (downloadState.status === 'completed' && downloadState.localUrl) {
      if (ad.ad_type === 'image_ad') {
        return (
          <div className="relative">
            <img 
              src={downloadState.localUrl} 
              alt={`Generated ad for ${ad.audience}`}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                console.error('Image load error:', e);
                setMediaDownloads(prev => ({
                  ...prev,
                  [ad.asset_id]: { ...prev[ad.asset_id], status: 'error', error: 'Failed to load image' }
                }));
              }}
            />
            <a 
              href={downloadState.localUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </a>
          </div>
        );
      } else if (ad.ad_type === 'video_ad') {
        return (
          <div className="relative">
            <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Video Content</p>
                <p className="text-xs text-gray-300 mt-1">S3: {ad.content}</p>
              </div>
            </div>
            <a 
              href={downloadState.localUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </a>
          </div>
        );
      }
    }

    return null;
  };

  const ads = workflowState.content?.ads || [];
  const approvals = workflowState.approvals || {};
  const allApproved = ads.length > 0 && ads.every((ad: GeneratedAd) => approvals[ad.asset_id] === 'approved');

  if (!workflowState.content) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Content Generated Yet</h3>
          <p className="text-gray-500">Generated ads will appear here once the content generation agent completes.</p>
          <p className="text-sm text-gray-400 mt-2">Last updated: {lastUpdated}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Generated Content</h2>
            <p className="text-gray-600">{ads.length} ads generated • Last updated: {lastUpdated}</p>
          </div>
          {allApproved && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All ads approved!</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad: GeneratedAd) => {
          const approvalStatus = approvals[ad.asset_id] || 'pending';
          
          return (
            <div key={ad.asset_id} className="border rounded-lg p-4 bg-white shadow-sm">
              {/* Ad Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getAdTypeIcon(ad.ad_type)}
                  <span className="font-medium text-gray-800">{ad.asset_id}</span>
                </div>
                {getApprovalStatusIcon(approvalStatus)}
              </div>

              {/* Ad Details */}
              <div className="mb-3">
                <p className="text-sm text-gray-600">{ad.audience}</p>
                <p className="text-sm text-gray-500">{ad.platform} • {ad.ad_type.replace('_', ' ')}</p>
              </div>

              {/* Media Content */}
              <div className="mb-4">
                {renderMediaContent(ad)}
              </div>

              {/* Approval Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(ad.asset_id)}
                  disabled={approvalStatus === 'approved'}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    approvalStatus === 'approved'
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {approvalStatus === 'approved' ? 'Approved' : 'Approve'}
                </button>
                
                <button
                  onClick={() => handleRevise(ad.asset_id)}
                  disabled={approvalStatus === 'revising'}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    approvalStatus === 'revising'
                      ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  {approvalStatus === 'revising' ? 'Revising...' : 'Revise'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Revision Feedback for {showFeedbackModal}
            </h3>
            
            <textarea
              value={revisionFeedback[showFeedbackModal] || ''}
              onChange={(e) => setRevisionFeedback(prev => ({
                ...prev,
                [showFeedbackModal]: e.target.value
              }))}
              placeholder="Please provide specific feedback for how this ad should be revised..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => submitRevision(showFeedbackModal)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Revision
              </button>
              <button
                onClick={() => setShowFeedbackModal(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress to Next Stage */}
      {allApproved && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Ready for Analytics</h4>
              <p className="text-blue-600 text-sm">All ads have been approved. Proceeding to performance analytics...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerationTab;