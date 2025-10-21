import React from 'react';
import { LucideIcon, CheckCircle, Clock, Lock } from 'lucide-react';
import type { TabAccessibility } from '../types';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

interface NavigationHeaderProps {
  tabs: Tab[];
  currentTab: string;
  tabAccessibility: TabAccessibility;
  onTabChange: (tabId: string) => void;
  workflowStage: string;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  tabs,
  currentTab,
  tabAccessibility,
  onTabChange,
  workflowStage
}) => {
  const getTabStatus = (tabId: string) => {
    const isAccessible = tabAccessibility[tabId as keyof TabAccessibility];
    const isActive = currentTab === tabId;
    
    if (isActive) return 'active';
    if (!isAccessible) return 'disabled';
    return 'inactive';
  };

  const getTabIcon = (tab: Tab) => {
    const status = getTabStatus(tab.id);
    const IconComponent = tab.icon;
    
    if (status === 'active') {
      return <IconComponent className="w-5 h-5" />;
    }
    
    if (status === 'disabled') {
      return <Lock className="w-5 h-5" />;
    }
    
    // Check if tab is completed based on workflow stage
    const completedTabs = getCompletedTabs(workflowStage);
    if (completedTabs.includes(tab.id)) {
      return <CheckCircle className="w-5 h-5 text-success-600" />;
    }
    
    return <IconComponent className="w-5 h-5" />;
  };

  const getCompletedTabs = (stage: string): string[] => {
    switch (stage) {
      case 'setup':
        return [];
      case 'executing':
        return ['home'];
      case 'reviewing':
        return ['home', 'monitoring'];
      case 'approving':
        return ['home', 'monitoring', 'audience'];
      case 'analyzing':
        return ['home', 'monitoring', 'audience', 'content'];
      case 'optimizing':
        return ['home', 'monitoring', 'audience', 'content', 'analytics'];
      default:
        return [];
    }
  };

  const getTabClasses = (tabId: string) => {
    const status = getTabStatus(tabId);
    const baseClasses = 'flex items-center space-x-3 px-6 py-4 rounded-lg font-medium transition-all duration-200 border';
    
    switch (status) {
      case 'active':
        return `${baseClasses} tab-active border-primary-600`;
      case 'disabled':
        return `${baseClasses} tab-disabled border-gray-200`;
      default:
        return `${baseClasses} tab-inactive border-gray-200 hover:border-gray-300`;
    }
  };

  const handleTabClick = (tabId: string) => {
    const isAccessible = tabAccessibility[tabId as keyof TabAccessibility];
    if (isAccessible) {
      onTabChange(tabId);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 py-4 overflow-x-auto">
          {tabs.map((tab) => {
            const status = getTabStatus(tab.id);
            const isClickable = status !== 'disabled';
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                disabled={!isClickable}
                className={getTabClasses(tab.id)}
                title={isClickable ? tab.description : 'Complete previous steps to unlock'}
              >
                <div className="flex items-center space-x-3">
                  {getTabIcon(tab)}
                  <div className="text-left">
                    <div className="text-sm font-medium">{tab.label}</div>
                    <div className={`text-xs ${
                      status === 'active' ? 'text-primary-100' : 
                      status === 'disabled' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                </div>
                
                {/* Progress indicator */}
                {status === 'active' && (
                  <div className="ml-2">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationHeader;