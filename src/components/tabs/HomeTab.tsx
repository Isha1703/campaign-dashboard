import React, { useState } from 'react';
import { Play, DollarSign, Package, Target } from 'lucide-react';
import ConfirmationDialog from '../ConfirmationDialog';
import type { CampaignData, CampaignStartRequest } from '../../types';

interface HomeTabProps {
  campaignData: CampaignData | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  onError: (error: string | null) => void;
  onCampaignStart: (data: CampaignStartRequest) => Promise<void>;
}

const HomeTab: React.FC<HomeTabProps> = ({
  campaignData,
  isLoading,
  onCampaignStart
}) => {
  const [formData, setFormData] = useState({
    product: '',
    product_cost: '',
    budget: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingCampaignData, setPendingCampaignData] = useState<CampaignStartRequest | null>(null);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.product.trim()) {
      errors.product = 'Product description is required';
    }

    const cost = parseFloat(formData.product_cost);
    if (!formData.product_cost || isNaN(cost) || cost <= 0) {
      errors.product_cost = 'Valid product cost is required';
    }

    const budget = parseFloat(formData.budget);
    if (!formData.budget || isNaN(budget) || budget <= 0) {
      errors.budget = 'Valid campaign budget is required';
    }

    if (budget && cost && budget < cost * 2) {
      errors.budget = 'Budget should be at least 2x the product cost for effective marketing';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const campaignRequest: CampaignStartRequest = {
      product: formData.product.trim(),
      product_cost: parseFloat(formData.product_cost),
      budget: parseFloat(formData.budget)
    };

    // Show confirmation dialog instead of immediately starting campaign
    setPendingCampaignData(campaignRequest);
    setShowConfirmation(true);
  };

  const handleConfirmCampaign = async () => {
    if (!pendingCampaignData) return;

    try {
      await onCampaignStart(pendingCampaignData);
      setShowConfirmation(false);
      setPendingCampaignData(null);
    } catch (error) {
      // Error handling is done in the parent component
      setShowConfirmation(false);
      setPendingCampaignData(null);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPendingCampaignData(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Launch Your Marketing Campaign
        </h2>
        <p className="text-lg text-gray-600">
          Set up your product details and budget to generate a comprehensive marketing strategy 
          powered by AI agents and professional content creation tools.
        </p>
      </div>

      {/* Campaign Workflow Diagram */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          🤖 AI Agent Workflow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* Phase 1: Agent Execution */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Phase 1: Agent Execution</h4>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>AudienceAgent → Target demographics</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>BudgetAgent → Budget allocation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>PromptAgent → Ad strategies</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>ContentGenerationAgent → MCP tools</span>
              </div>
            </div>
          </div>

          {/* Phase 2: Review & Approval */}
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-medium text-orange-900 mb-2">Phase 2: Review & Approval</h4>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Review generated ads</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Approve or request revisions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>ContentRevisionAgent (if needed)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Final approval for all ads</span>
              </div>
            </div>
          </div>

          {/* Phase 3: Analytics & Optimization */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Phase 3: Analytics & Optimization</h4>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>AnalyticsAgent → Performance analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sample performance metrics</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>OptimizationAgent → Budget reallocation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>ROI improvement recommendations</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            <strong>Complete Flow:</strong> Start Campaign → Agent Execution → Content Review → 
            Approve/Revise → Analytics → Optimization → Campaign Complete
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Description */}
          <div>
            <label htmlFor="product" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4" />
              <span>Product Description</span>
            </label>
            <textarea
              id="product"
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                formErrors.product ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="Describe your product or service in detail. Include key features, benefits, and target market..."
              value={formData.product}
              onChange={(e) => handleInputChange('product', e.target.value)}
              disabled={isLoading}
            />
            {formErrors.product && (
              <p className="mt-1 text-sm text-error-600">{formErrors.product}</p>
            )}
          </div>

          {/* Product Cost */}
          <div>
            <label htmlFor="product_cost" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Product Cost (USD)</span>
            </label>
            <input
              type="number"
              id="product_cost"
              step="0.01"
              min="0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                formErrors.product_cost ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="29.99"
              value={formData.product_cost}
              onChange={(e) => handleInputChange('product_cost', e.target.value)}
              disabled={isLoading}
            />
            {formErrors.product_cost && (
              <p className="mt-1 text-sm text-error-600">{formErrors.product_cost}</p>
            )}
          </div>

          {/* Campaign Budget */}
          <div>
            <label htmlFor="budget" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4" />
              <span>Campaign Budget (USD)</span>
            </label>
            <input
              type="number"
              id="budget"
              step="0.01"
              min="0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                formErrors.budget ? 'border-error-500' : 'border-gray-300'
              }`}
              placeholder="1000.00"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              disabled={isLoading}
            />
            {formErrors.budget && (
              <p className="mt-1 text-sm text-error-600">{formErrors.budget}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Recommended: At least 2x your product cost for effective reach
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'btn-primary hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting Campaign...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Campaign</span>
              </>
            )}
          </button>
        </form>

        {/* Campaign Preview */}
        {formData.product && formData.product_cost && formData.budget && (
          <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h3 className="text-sm font-medium text-primary-900 mb-2">Campaign Preview</h3>
            <div className="text-sm text-primary-700 space-y-1">
              <p><strong>Product:</strong> {formData.product.slice(0, 100)}...</p>
              <p><strong>Cost:</strong> ${formData.product_cost}</p>
              <p><strong>Budget:</strong> ${formData.budget}</p>
              <p><strong>ROI Target:</strong> {formData.budget && formData.product_cost ? 
                `${((parseFloat(formData.budget) / parseFloat(formData.product_cost)) * 100).toFixed(0)}%` : 'N/A'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {pendingCampaignData && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          campaignData={pendingCampaignData}
          onConfirm={handleConfirmCampaign}
          onCancel={handleCancelConfirmation}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default HomeTab;