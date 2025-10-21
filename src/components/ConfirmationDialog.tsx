import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import type { CampaignStartRequest } from '../types';

interface ConfirmationDialogProps {
  isOpen: boolean;
  campaignData: CampaignStartRequest;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  campaignData,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const roiTarget = campaignData.budget && campaignData.product_cost 
    ? ((campaignData.budget / campaignData.product_cost) * 100).toFixed(0)
    : 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Campaign Launch
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Please review your campaign parameters before launching the AI agents.
          </p>

          {/* Campaign Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Product Description</h4>
              <p className="text-sm text-gray-900 line-clamp-3">
                {campaignData.product}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Product Cost</h4>
                <p className="text-lg font-semibold text-gray-900">
                  ${campaignData.product_cost.toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Campaign Budget</h4>
                <p className="text-lg font-semibold text-gray-900">
                  ${campaignData.budget.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <h4 className="text-sm font-medium text-primary-700 mb-1">Expected ROI Target</h4>
              <p className="text-lg font-semibold text-primary-900">
                {roiTarget}%
              </p>
              <p className="text-xs text-primary-600 mt-1">
                Based on budget-to-cost ratio
              </p>
            </div>
          </div>

          {/* Agent Process Preview */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-700">
                AI Agent Process
              </h4>
            </div>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• AudienceAgent will analyze target demographics</p>
              <p>• BudgetAgent will optimize budget allocation</p>
              <p>• PromptAgent will generate ad strategies</p>
              <p>• ContentGenerationAgent will create ads using MCP tools</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 rounded-lg p-3 mb-6 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              <strong>Note:</strong> This process may take 2-3 minutes as agents generate 
              content using Nova Canvas and Nova Reel through the MCP gateway.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <span>Launch Campaign</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;