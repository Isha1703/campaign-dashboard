import React from 'react';
import { ArrowRight, CheckCircle, Target, TrendingUp } from 'lucide-react';

interface WorkflowGuideProps {
  currentStage: string;
  nextRecommendedTab: string;
  completedStages: string[];
  currentStageMessage: string;
  progressPercentage: number;
}

const WorkflowGuide: React.FC<WorkflowGuideProps> = ({
  currentStage,
  nextRecommendedTab,
  completedStages,
  currentStageMessage,
  progressPercentage
}) => {
  const getStageIcon = (stage: string) => {
    if (completedStages.includes(stage)) {
      return <CheckCircle className="w-5 h-5 text-success-600" />;
    }
    if (stage === currentStage) {
      return <Target className="w-5 h-5 text-primary-600 animate-pulse" />;
    }
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  };

  const getNextActionMessage = () => {
    switch (nextRecommendedTab) {
      case 'home':
        return 'Set up your campaign parameters to get started';
      case 'monitoring':
        return 'Monitor your agents as they work';
      case 'audience':
        return 'Review your target audience analysis';
      case 'content':
        return 'Review and approve generated content';
      case 'analytics':
        return 'Analyze campaign performance';
      case 'optimization':
        return 'Review optimization recommendations';
      default:
        return 'Continue with your campaign workflow';
    }
  };

  const workflowStages = [
    { id: 'setup', label: 'Setup', description: 'Campaign Configuration' },
    { id: 'executing', label: 'Executing', description: 'Agent Processing' },
    { id: 'reviewing', label: 'Reviewing', description: 'Data Analysis' },
    { id: 'approving', label: 'Approving', description: 'Content Review' },
    { id: 'analyzing', label: 'Analyzing', description: 'Performance Metrics' },
    { id: 'optimizing', label: 'Optimizing', description: 'Budget Optimization' }
  ];

  return (
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-primary-700">Campaign Progress</span>
            <span className="text-sm font-medium text-primary-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Workflow Stages */}
        <div className="flex items-center justify-between mb-4 overflow-x-auto">
          {workflowStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className="flex flex-col items-center min-w-0">
                <div className="flex items-center justify-center mb-1">
                  {getStageIcon(stage.id)}
                </div>
                <div className="text-xs font-medium text-primary-700 text-center">
                  {stage.label}
                </div>
                <div className="text-xs text-primary-600 text-center">
                  {stage.description}
                </div>
              </div>
              {index < workflowStages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-primary-400 mx-3 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Current Stage Message */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {currentStageMessage}
                </div>
                <div className="text-xs text-gray-600">
                  Next: {getNextActionMessage()}
                </div>
              </div>
            </div>

            {nextRecommendedTab !== currentStage && (
              <div className="flex items-center space-x-2 text-primary-600">
                <span className="text-sm font-medium">Go to {nextRecommendedTab}</span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowGuide;