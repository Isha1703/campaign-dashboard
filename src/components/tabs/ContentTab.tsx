import React, { useState, useEffect } from 'react';
import { FileText, Image, Video, ThumbsUp, Edit3, Camera, Monitor, Smartphone, CheckCircle, Type, BarChart3 } from 'lucide-react';
import type { CampaignData, GeneratedAd, ApprovalStatus } from '../../types';
import MediaDisplay from '../MediaDisplay';
import FeedbackModal from '../FeedbackModal';
import { useCampaignData } from '../../contexts/CampaignDataContext';
import s3MediaService from '../../services/s3MediaService';

interface ContentTabProps {
  campaignData: CampaignData | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  onError: (error: string | null) => void;
  onContentApproval?: (adId: string, action: 'approve' | 'revise', feedback?: string) => Promise<void>;
  onBulkApproval?: (adIds: string[], action: 'approve' | 'revise') => Promise<void>;
  onS3MediaDownload?: (s3Uri: string, mediaType: 'image' | 'video') => Promise<string>;
  onProceedToAnalytics?: () => void;
}

const ContentTab: React.FC<ContentTabProps> = ({
  campaignData,
  sessionId,
  isLoading,
  error,
  onError,
  onContentApproval,
  onBulkApproval,
  onS3MediaDownload,
  onProceedToAnalytics
}) => {
  const { sessionData, refreshData } = useCampaignData();
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Get generated ads from session data or campaign data
  const generatedAds: GeneratedAd[] = sessionData?.content?.result?.ads?.map((ad: any) => ({
    id: ad.asset_id,
    audience: ad.audience,
    platform: ad.platform,
    ad_type: ad.ad_type,
    content: ad.content,
    status: ad.status,
    timestamp: sessionData.content?.timestamp
  })) || campaignData?.generatedAds || [];

  // Auto-load content when tab is opened with a session
  useEffect(() => {
    if (sessionId && !sessionData?.content && !isLoading) {
      console.log('🔄 Content tab opened, loading session data for:', sessionId);
      setIsGenerating(true);
      refreshData();
    }
  }, [sessionId]);

  // Poll for content generation progress
  useEffect(() => {
    if (!sessionId) return;

    // If we have content, stop polling
    if (sessionData?.content?.result?.ads?.length > 0) {
      console.log('✅ Content loaded, stopping polling');
      setIsGenerating(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    // If no content yet, start polling
    if (!pollingInterval && !sessionData?.content) {
      console.log('🔄 Starting content generation polling for session:', sessionId);
      setIsGenerating(true);
      
      const interval = setInterval(async () => {
        console.log('🔄 Polling for content updates...');
        await refreshData();
      }, 3000); // Poll every 3 seconds
      
      setPollingInterval(interval);
    }

    // Cleanup on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [sessionId, sessionData?.content, pollingInterval]);

  // Log when content data changes
  useEffect(() => {
    if (sessionData?.content?.result?.ads) {
      console.log('✅ Content data received:', sessionData.content.result.ads.length, 'ads');
      setIsGenerating(false);
    }
  }, [sessionData?.content, sessionId]);

  // Initialize approval status for all ads
  useEffect(() => {
    if (generatedAds.length > 0) {
      const initialStatus: ApprovalStatus = {};
      generatedAds.forEach(ad => {
        if (!approvalStatus[ad.id]) {
          initialStatus[ad.id] = {
            status: 'pending',
            revisionHistory: []
          };
        }
      });
      setApprovalStatus(prev => ({ ...prev, ...initialStatus }));
    }
  }, [generatedAds]);

  // Check if all ads are approved (but don't auto-trigger analytics)
  useEffect(() => {
    if (generatedAds.length > 0) {
      const allApproved = generatedAds.every(ad => 
        approvalStatus[ad.id]?.status === 'approved'
      );
      
      if (allApproved) {
        console.log('✅ All ads approved! Analytics button is now available.');
        // Don't auto-trigger analytics - let user click the button manually
      }
    }
  }, [approvalStatus, generatedAds]);

  const getAdTypeIcon = (adType: string) => {
    switch (adType) {
      case 'text_ad':
        return <Type className="w-5 h-5 text-blue-600" />;
      case 'image_ad':
        return <Image className="w-5 h-5 text-green-600" />;
      case 'video_ad':
        return <Video className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };





  const handleApproval = async (adId: string, action: 'approve' | 'revise') => {
    try {
      if (action === 'revise') {
        // Show feedback modal for revisions
        setShowFeedbackModal(adId);
      } else {
        // Update local status immediately for better UX
        setApprovalStatus(prev => ({
          ...prev,
          [adId]: {
            ...prev[adId],
            status: 'approved'
          }
        }));

        // Call the approval handler if provided
        if (onContentApproval) {
          await onContentApproval(adId, action);
        }
        
        console.log(`✅ Ad ${adId} approved`);
        
        // Check if all ads are now approved
        const allAds = generatedAds;
        const approvedCount = Object.values(approvalStatus).filter(s => s.status === 'approved').length + 1; // +1 for current approval
        
        console.log(`📊 Approval progress: ${approvedCount}/${allAds.length} ads approved`);
        
        if (approvedCount === allAds.length) {
          // All ads approved! Ready to proceed to analytics (removed excessive logging)
        }
      }
    } catch (error) {
      // Revert status on error
      setApprovalStatus(prev => ({
        ...prev,
        [adId]: {
          ...prev[adId],
          status: 'pending'
        }
      }));
      onError(`Failed to ${action} ad: ${error}`);
    }
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    if (!showFeedbackModal || !feedback.trim()) return;

    setIsSubmittingFeedback(true);

    try {
      // Update local status to show revision in progress
      setApprovalStatus(prev => ({
        ...prev,
        [showFeedbackModal]: {
          ...prev[showFeedbackModal],
          status: 'revising',
          feedback: feedback
        }
      }));

      console.log(`📝 Submitting revision feedback for ad ${showFeedbackModal}:`, feedback);

      // Call the content revision agent via API
      if (sessionId) {
        try {
          // Call the content revision endpoint (not feedback)
          const revisionResponse = await fetch('/api/campaign/revision', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
              ad_id: showFeedbackModal,
              feedback: feedback
            })
          });

          if (revisionResponse.ok) {
            const revisionData = await revisionResponse.json();
            console.log('✅ Content revision completed:', revisionData);
            
            if (revisionData.success) {
              // Update status to show revision is complete
              setApprovalStatus(prev => ({
                ...prev,
                [showFeedbackModal]: {
                  ...prev[showFeedbackModal],
                  status: 'pending', // Reset to pending so user can review and approve
                  feedback: feedback,
                  revisionHistory: [
                    ...(prev[showFeedbackModal]?.revisionHistory || []),
                    {
                      timestamp: new Date().toISOString(),
                      feedback: feedback,
                      result: 'Revised'
                    }
                  ]
                }
              }));

              // Refresh session data to load the revised content
              console.log('🔄 Refreshing session data to load revised content...');
              await refreshData();
              
              // Show success message
              alert('✅ Content revision completed! The ad has been updated with your feedback.');
              
            } else {
              throw new Error(revisionData.error || 'Revision failed');
            }
            
          } else {
            const errorData = await revisionResponse.json();
            throw new Error(errorData.error || 'Failed to trigger content revision agent');
          }
        } catch (apiError) {
          console.error('❌ Content revision API call failed:', apiError);
          
          // Show error to user
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
          alert(`❌ Content revision failed: ${errorMessage}\n\nPlease try again or contact support.`);
          
          // Revert status on error
          setApprovalStatus(prev => ({
            ...prev,
            [showFeedbackModal]: {
              ...prev[showFeedbackModal],
              status: 'pending'
            }
          }));
          
          throw apiError; // Re-throw to be caught by outer catch
        }
      }

      // Close feedback modal on success
      setShowFeedbackModal(null);
      
    } catch (error) {
      console.error('❌ Failed to submit revision feedback:', error);
      
      // Revert status on error
      setApprovalStatus(prev => ({
        ...prev,
        [showFeedbackModal!]: {
          ...prev[showFeedbackModal!],
          status: 'pending'
        }
      }));
      
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError(`Failed to submit revision feedback: ${errorMessage}`);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleFeedbackModalClose = () => {
    if (!isSubmittingFeedback) {
      setShowFeedbackModal(null);
      // Revert status if modal is closed without submitting
      if (showFeedbackModal) {
        setApprovalStatus(prev => ({
          ...prev,
          [showFeedbackModal]: {
            ...prev[showFeedbackModal],
            status: 'pending'
          }
        }));
      }
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const iconProps = { className: "w-6 h-6" };
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Camera {...iconProps} className="w-6 h-6 text-pink-600" />;
      case 'linkedin':
        return <Monitor {...iconProps} className="w-6 h-6 text-blue-600" />;
      case 'facebook':
        return <Smartphone {...iconProps} className="w-6 h-6 text-blue-700" />;
      case 'pinterest':
        return <Image {...iconProps} className="w-6 h-6 text-red-600" />;
      case 'google search':
        return <FileText {...iconProps} className="w-6 h-6 text-green-600" />;
      case 'tiktok':
        return <Video {...iconProps} className="w-6 h-6 text-black" />;
      default:
        return <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
          {platform.charAt(0).toUpperCase()}
        </div>;
    }
  };

  // Get ad prompt from prompt agent data
  const getAdPrompt = (ad: any, promptData: any) => {
    // If the ad already has a prompt field, use that
    if (ad.prompt) {
      console.log('✅ Using ad-specific prompt for', ad.asset_id, ':', ad.prompt);
      return ad.prompt;
    }

    if (!promptData || !promptData.audience_prompts) {
      console.log('❌ No prompt data available:', { promptData, hasAudiencePrompts: !!promptData?.audience_prompts });
      return 'No prompt available';
    }
    
    // Find the matching audience and platform
    const audiencePrompt = promptData.audience_prompts.find((ap: any) => 
      ap.audience === ad.audience
    );
    
    if (!audiencePrompt) {
      console.log('❌ No audience prompt found for:', ad.audience, 'Available audiences:', promptData.audience_prompts.map((ap: any) => ap.audience));
      return 'No prompt available';
    }
    
    const platformData = audiencePrompt.platforms?.find((p: any) => 
      p.platform.toLowerCase() === ad.platform.toLowerCase()
    );
    
    if (!platformData) {
      console.log('❌ No platform data found for:', ad.platform, 'Available platforms:', audiencePrompt.platforms?.map((p: any) => p.platform));
      return 'No prompt available';
    }
    
    const prompt = platformData.prompts?.find((p: any) => 
      p.ad_type === ad.ad_type
    );
    
    if (!prompt) {
      console.log('❌ No prompt found for ad type:', ad.ad_type, 'Available ad types:', platformData.prompts?.map((p: any) => p.ad_type));
      return 'No prompt available';
    }
    
    console.log('✅ Found prompt for', ad.audience, ad.platform, ad.ad_type, ':', prompt.prompt);
    return prompt.prompt;
  };

  // Handle bulk approval actions
  const handleBulkApproval = async (adIds: string[], action: 'approve' | 'revise') => {
    if (!onBulkApproval) {
      // Fallback to individual approvals if bulk handler not provided
      for (const adId of adIds) {
        try {
          await onContentApproval(adId, action);
          setApprovalStatus(prev => ({
            ...prev,
            [adId]: {
              ...prev[adId],
              status: action === 'approve' ? 'approved' : 'revision_requested'
            }
          }));
        } catch (error) {
          onError(`Failed to ${action} ad ${adId}: ${error}`);
        }
      }
      return;
    }

    try {
      // Update local status for all selected ads
      const statusUpdate: ApprovalStatus = {};
      adIds.forEach(adId => {
        statusUpdate[adId] = {
          ...approvalStatus[adId],
          status: action === 'approve' ? 'approved' : 'revision_requested'
        };
      });
      
      setApprovalStatus(prev => ({ ...prev, ...statusUpdate }));
      
      // Call bulk approval handler
      await onBulkApproval(adIds, action);
    } catch (error) {
      // Revert status on error
      const revertUpdate: ApprovalStatus = {};
      adIds.forEach(adId => {
        revertUpdate[adId] = {
          ...approvalStatus[adId],
          status: 'pending'
        };
      });
      setApprovalStatus(prev => ({ ...prev, ...revertUpdate }));
      onError(`Bulk ${action} failed: ${error}`);
    }
  };

  // Handle workflow progression callback
  const handleWorkflowProgression = (canProceed: boolean) => {
    if (canProceed && onProceedToAnalytics) {
      // Optionally auto-proceed or just enable the button
      // For now, we'll just enable the button in the workflow manager
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'revision_requested':
      case 'revising':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'pending':
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'revision_requested':
        return 'Revision Requested';
      case 'revising':
        return 'Revising...';
      case 'pending':
      default:
        return 'Awaiting Review';
    }
  };

  // Calculate approval statistics
  const approvalStats = {
    total: generatedAds.length,
    approved: Object.values(approvalStatus).filter(s => s.status === 'approved').length,
    pending: Object.values(approvalStatus).filter(s => s.status === 'pending').length,
    revising: Object.values(approvalStatus).filter(s => s.status === 'revision_requested' || s.status === 'revising').length
  };

  const allApproved = approvalStats.approved === approvalStats.total && approvalStats.total > 0;

  if (isLoading || isGenerating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isGenerating ? 'Generating Content...' : 'Loading Content...'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isGenerating 
              ? 'AI agents are creating personalized ads, images, and videos for your campaign. This may take a few moments.'
              : 'Loading your generated content...'}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
              <div className="text-left text-sm text-blue-800">
                <p className="font-medium mb-1">What's happening:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Analyzing audience preferences</li>
                  <li>• Crafting platform-optimized content</li>
                  <li>• Generating images and videos</li>
                  <li>• Preparing ads for review</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => onError(null)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (generatedAds.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Generated Yet</h3>
        <p className="text-gray-600">
          Generated ads will appear here once the content generation agent completes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generated Content Review
        </h2>
        <p className="text-gray-600">
          Review and approve AI-generated ads, images, and videos for your campaign
        </p>
      </div>

      {/* Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{approvalStats.total}</div>
          <div className="text-sm text-gray-600">Total Ads</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{approvalStats.approved}</div>
          <div className="text-sm text-green-700">Approved</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{approvalStats.pending}</div>
          <div className="text-sm text-yellow-700">Pending Review</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{approvalStats.revising}</div>
          <div className="text-sm text-orange-700">Needs Revision</div>
        </div>
      </div>



      {/* Unified Approval Section */}
      <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          ✅ Content Approval
          <span className="ml-2 text-sm text-gray-600">
            ({approvalStats.approved}/{approvalStats.total} approved)
          </span>
        </h3>
        
        <p className="text-gray-600 mb-4">
          Review all generated ads above, then choose an action for the entire campaign:
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              // Approve all ads at once
              generatedAds.forEach(ad => {
                if (approvalStatus[ad.id]?.status !== 'approved') {
                  handleApproval(ad.id, 'approve');
                }
              });
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>Approve All Ads</span>
          </button>
          
          <button
            onClick={() => {
              const feedback = prompt('Specify which ads need revision and what changes are needed:');
              if (feedback && feedback.trim()) {
                // Handle bulk revision request
                console.log('📝 Bulk revision request:', feedback);
                // You can implement bulk revision logic here
                alert('Revision request submitted for review.');
              }
            }}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center space-x-2"
          >
            <Edit3 className="w-5 h-5" />
            <span>Request Revisions</span>
          </button>
          
          {allApproved && (
            <button
              onClick={() => {
                console.log('🎯 Proceeding to analytics...');
                
                // Only call the callback - don't make duplicate API calls
                if (onProceedToAnalytics) {
                  onProceedToAnalytics();
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>🚀 Proceed to Analytics</span>
            </button>
          )}
        </div>
        
        {allApproved && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">All ads approved! Ready to proceed to analytics.</span>
            </div>
          </div>
        )}
      </div>

      {/* Generated Ads Grid - 2 columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {generatedAds.map((ad) => {
          const status = approvalStatus[ad.id] || { status: 'pending' };
          
          return (
            <div
              key={ad.id}
              className={`bg-white rounded-lg border-2 transition-all ${
                status.status === 'approved' ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}
            >
              {/* Enhanced Ad Header with Platform Icon */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getPlatformIcon(ad.platform)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{ad.id}</h3>
                      <div className="text-sm text-gray-600">{ad.platform} • {ad.ad_type.replace('_', ' ').toUpperCase()}</div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                    {getStatusText(status.status)}
                  </div>
                </div>

                {/* Audience & Prompt Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Target Audience:</div>
                  <div className="text-sm text-gray-900 mb-2">{ad.audience}</div>
                  
                  {/* Get prompt from session data */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Ad Prompt:</div>
                    <div className="text-sm text-gray-600 italic">
                      {sessionData?.prompts?.result ? 
                        getAdPrompt(ad, sessionData.prompts.result) : 
                        'Loading prompt data...'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Ad Content */}
              <div className="p-4">
                <MediaDisplay
                  adId={ad.id}
                  content={ad.content}
                  adType={ad.ad_type}
                  className="mb-4"
                  onDownloadComplete={(localPath) => {
                    console.log(`✅ Media downloaded for ${ad.id}:`, localPath);
                  }}
                  onDownloadError={(error) => {
                    console.error(`❌ Media download failed for ${ad.id}:`, error);
                  }}
                />

                {/* Feedback Display */}
                {status.feedback && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm font-medium text-orange-800 mb-1">Revision Feedback:</div>
                    <div className="text-sm text-orange-700">{status.feedback}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                {status.status === 'approved' ? (
                  <div className="flex justify-center">
                    <div className="flex items-center text-green-600 bg-green-100 px-4 py-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Approved</span>
                    </div>
                  </div>
                ) : status.status === 'revising' ? (
                  <div className="flex justify-center">
                    <div className="flex items-center text-orange-600 bg-orange-100 px-4 py-2 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                      <span className="font-medium">Revising...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleApproval(ad.id, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApproval(ad.id, 'revise')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center space-x-2 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Feedback Modal */}
      <FeedbackModal
        isOpen={!!showFeedbackModal}
        adId={showFeedbackModal || ''}
        adDetails={{
          platform: showFeedbackModal ? generatedAds.find(ad => ad.id === showFeedbackModal)?.platform || '' : '',
          ad_type: showFeedbackModal ? generatedAds.find(ad => ad.id === showFeedbackModal)?.ad_type || '' : '',
          audience: showFeedbackModal ? generatedAds.find(ad => ad.id === showFeedbackModal)?.audience : undefined
        }}
        onSubmit={handleFeedbackSubmit}
        onClose={handleFeedbackModalClose}
        isSubmitting={isSubmittingFeedback}
      />


    </div>
  );
};

export default ContentTab;