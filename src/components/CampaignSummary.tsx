import React from 'react';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Users, DollarSign } from 'lucide-react';

interface CampaignSummaryProps {
  workflowStage: string;
  sessionData: any;
  campaignProgress: number;
}

const CampaignSummary: React.FC<CampaignSummaryProps> = ({
  workflowStage,
  sessionData,
  campaignProgress
}) => {
  const getStageStatus = (stage: string) => {
    const stageOrder = ['setup', 'executing', 'reviewing', 'approving', 'analyzing', 'optimizing'];
    const currentIndex = stageOrder.indexOf(workflowStage);
    const stageIndex = stageOrder.indexOf(stage);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const agentSteps = [
    {
      id: 'setup',
      title: 'Campaign Setup',
      description: 'Product and budget configuration',
      agent: 'User Input'
    },
    {
      id: 'executing',
      title: 'Agent Execution',
      description: 'AudienceAgent → BudgetAgent → PromptAgent → ContentGenerationAgent',
      agent: 'Multiple Agents'
    },
    {
      id: 'reviewing',
      title: 'Data Review',
      description: 'Review audience analysis and budget allocation',
      agent: 'User Review'
    },
    {
      id: 'approving',
      title: 'Content Approval',
      description: 'Approve/Revise generated ads (ContentRevisionAgent if needed)',
      agent: 'User + RevisionAgent'
    },
    {
      id: 'analyzing',
      title: 'Performance Analytics',
      description: 'AnalyticsAgent analyzes campaign performance',
      agent: 'AnalyticsAgent'
    },
    {
      id: 'optimizing',
      title: 'Budget Optimization',
      description: 'OptimizationAgent recommends budget changes for better ROI',
      agent: 'OptimizationAgent'
    }
  ];

  const getDataSummary = () => {
    if (!sessionData) return null;

    const summary = {
      audiences: sessionData.audiences?.result?.audiences?.length || 0,
      budgetAllocated: sessionData.budget?.result?.total_budget || 0,
      adsGenerated: sessionData.content?.result?.ads?.length || 0,
      analyticsComplete: !!sessionData.analytics?.result,
      optimizationComplete: !!sessionData.optimization?.result
    };

    return summary;
  };

  const dataSummary = getDataSummary();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Workflow Status</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">{campaignProgress}% Complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${campaignProgress}%` }}
          />
        </div>
      </div>

      {/* Agent Steps */}
      <div className="space-y-4">
        {agentSteps.map((step, index) => {
          const status = getStageStatus(step.id);
          return (
            <div
              key={step.id}
              className={`flex items-start space-x-4 p-3 rounded-lg transition-colors ${
                status === 'current' ? 'bg-blue-50 border border-blue-200' :
                status === 'completed' ? 'bg-green-50 border border-green-200' :
                'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${
                    status === 'current' ? 'text-blue-900' :
                    status === 'completed' ? 'text-green-900' :
                    'text-gray-700'
                  }`}>
                    {step.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status === 'current' ? 'bg-blue-100 text-blue-800' :
                    status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {step.agent}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  status === 'current' ? 'text-blue-700' :
                  status === 'completed' ? 'text-green-700' :
                  'text-gray-600'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Summary */}
      {dataSummary && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Campaign Data Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-900">{dataSummary.audiences}</div>
              <div className="text-xs text-blue-700">Target Audiences</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-900">
                ${dataSummary.budgetAllocated.toLocaleString()}
              </div>
              <div className="text-xs text-green-700">Budget Allocated</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-900">{dataSummary.adsGenerated}</div>
              <div className="text-xs text-purple-700">Ads Generated</div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            {workflowStage === 'setup' && 'Ready to start campaign with AI agents'}
            {workflowStage === 'executing' && 'Agents are processing your campaign data...'}
            {workflowStage === 'reviewing' && 'Review agent results in Audience and Content tabs'}
            {workflowStage === 'approving' && 'Content ready! Review and approve generated ads in Content tab'}
            {workflowStage === 'analyzing' && 'Analytics agent is analyzing performance data...'}
            {workflowStage === 'optimizing' && 'Review optimization recommendations to complete campaign'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CampaignSummary;