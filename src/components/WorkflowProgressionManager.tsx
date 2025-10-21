import React from 'react';
import { CheckCircle, Clock, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import type { ApprovalStatus } from '../types';

interface WorkflowProgressionManagerProps {
  approvalStatus: ApprovalStatus;
  totalAds: number;
  onProceedToAnalytics?: () => void;
  canProceedToAnalytics: boolean;
  className?: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'locked';
}

const WorkflowProgressionManager: React.FC<WorkflowProgressionManagerProps> = ({
  approvalStatus,
  totalAds,
  onProceedToAnalytics,
  canProceedToAnalytics,
  className = ''
}) => {
  // Calculate approval statistics
  const approvalStats = {
    total: totalAds,
    approved: Object.values(approvalStatus).filter(s => s.status === 'approved').length,
    pending: Object.values(approvalStatus).filter(s => s.status === 'pending').length,
    revising: Object.values(approvalStatus).filter(s => s.status === 'revision_requested' || s.status === 'revising').length
  };

  const allApproved = approvalStats.approved === approvalStats.total && approvalStats.total > 0;
  const approvalProgress = approvalStats.total > 0 ? (approvalStats.approved / approvalStats.total) * 100 : 0;

  // Define workflow stages
  const workflowStages: WorkflowStage[] = [
    {
      id: 'content_review',
      name: 'Content Review',
      description: 'Review and approve all generated content',
      icon: <CheckCircle className="w-5 h-5" />,
      status: allApproved ? 'completed' : 'current'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'View performance metrics and insights',
      icon: <ArrowRight className="w-5 h-5" />,
      status: allApproved ? 'current' : 'locked'
    },
    {
      id: 'optimization',
      name: 'Optimization',
      description: 'Budget reallocation and recommendations',
      icon: <ArrowRight className="w-5 h-5" />,
      status: 'locked'
    }
  ];

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'locked':
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const getProgressMessage = () => {
    if (allApproved) {
      return {
        type: 'success',
        title: '🎉 All Content Approved!',
        message: 'Great work! All ads have been approved and you can now proceed to view analytics and performance insights.',
        action: 'Proceed to Analytics'
      };
    } else if (approvalStats.revising > 0) {
      return {
        type: 'warning',
        title: '⏳ Revisions in Progress',
        message: `${approvalStats.revising} ad${approvalStats.revising > 1 ? 's' : ''} ${approvalStats.revising > 1 ? 'are' : 'is'} being revised. Please wait for the ContentRevisionAgent to complete.`,
        action: null
      };
    } else {
      return {
        type: 'info',
        title: '📝 Review Required',
        message: `${approvalStats.pending} ad${approvalStats.pending > 1 ? 's' : ''} still need${approvalStats.pending === 1 ? 's' : ''} your review and approval.`,
        action: null
      };
    }
  };

  const progressMessage = getProgressMessage();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Workflow Stages */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Workflow</h3>
        
        <div className="flex items-center justify-between">
          {workflowStages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 ${getStageColor(stage.status)}`}>
                  {stage.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : stage.status === 'locked' ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    stage.icon
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                <div className="text-xs text-gray-500 max-w-24">{stage.description}</div>
              </div>
              
              {index < workflowStages.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 ${
                    workflowStages[index + 1].status === 'completed' || workflowStages[index + 1].status === 'current'
                      ? 'bg-blue-300'
                      : 'bg-gray-200'
                  }`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Approval Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Approval Progress</h3>
          <div className="text-sm text-gray-600">
            {approvalStats.approved} of {approvalStats.total} approved
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${approvalProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">{Math.round(approvalProgress)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-900">{approvalStats.total}</div>
            <div className="text-xs text-gray-600">Total Ads</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{approvalStats.approved}</div>
            <div className="text-xs text-green-700">Approved</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">{approvalStats.revising}</div>
            <div className="text-xs text-orange-700">Revising</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{approvalStats.pending}</div>
            <div className="text-xs text-blue-700">Pending</div>
          </div>
        </div>
      </div>

      {/* Progress Message and Action */}
      <div className={`rounded-lg border p-4 ${
        progressMessage.type === 'success' 
          ? 'bg-green-50 border-green-200' 
          : progressMessage.type === 'warning'
          ? 'bg-orange-50 border-orange-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`font-medium mb-1 ${
              progressMessage.type === 'success' 
                ? 'text-green-800' 
                : progressMessage.type === 'warning'
                ? 'text-orange-800'
                : 'text-blue-800'
            }`}>
              {progressMessage.title}
            </h4>
            <p className={`text-sm ${
              progressMessage.type === 'success' 
                ? 'text-green-700' 
                : progressMessage.type === 'warning'
                ? 'text-orange-700'
                : 'text-blue-700'
            }`}>
              {progressMessage.message}
            </p>
          </div>
          
          {progressMessage.action && canProceedToAnalytics && onProceedToAnalytics && (
            <button
              onClick={onProceedToAnalytics}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              {progressMessage.action}
            </button>
          )}
        </div>
      </div>

      {/* Workflow Rules */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Workflow Rules:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• All ads must be approved before proceeding to Analytics</li>
          <li>• Revisions are processed by the ContentRevisionAgent</li>
          <li>• You can provide detailed feedback for each revision request</li>
          <li>• Analytics and Optimization tabs unlock after content approval</li>
          <li>• Use the feedback templates for common revision types</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkflowProgressionManager;