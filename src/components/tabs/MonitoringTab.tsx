import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Clock, CheckCircle, AlertCircle, Play, Pause, RefreshCw, 
  Terminal, Zap, Users, DollarSign, FileText, Image, Video, 
  BarChart3, TrendingUp, Eye, Loader2, ChevronRight, ChevronDown
} from 'lucide-react';
import type { CampaignData, SessionProgress, WebSocketMessage } from '../../types';
import { ApiService } from '../../services/api';

interface MonitoringTabProps {
  campaignData: CampaignData | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  onError: (error: string | null) => void;
  onWorkflowUpdate: () => void;
}

interface AgentStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  description: string;
  startTime: string;
  duration: string;
  outputs: string[];
  lastOutput?: string;
  errorMessage?: string;
  icon: React.ComponentType<any>;
  color: string;
  stage: string;
}

interface ExecutionTimelineEvent {
  id: string;
  agent: string;
  timestamp: string;
  event: string;
  status: 'started' | 'completed' | 'failed' | 'progress';
  details?: string;
  progress?: number;
}

const MonitoringTab: React.FC<MonitoringTabProps> = ({
  campaignData,
  sessionId,
  onError,
  onWorkflowUpdate
}) => {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { 
      name: 'AudienceAgent', 
      status: 'pending', 
      progress: 0, 
      description: 'Analyzing target demographics and platform preferences',
      startTime: '-',
      duration: '-',
      outputs: [],
      icon: Users,
      color: 'blue',
      stage: 'audience_analysis'
    },
    { 
      name: 'BudgetAgent', 
      status: 'pending', 
      progress: 0, 
      description: 'Calculating optimal budget allocation across platforms',
      startTime: '-',
      duration: '-',
      outputs: [],
      icon: DollarSign,
      color: 'green',
      stage: 'budget_allocation'
    },
    { 
      name: 'PromptAgent', 
      status: 'pending', 
      progress: 0, 
      description: 'Generating creative prompts for content generation',
      startTime: '-',
      duration: '-',
      outputs: [],
      icon: FileText,
      color: 'purple',
      stage: 'prompt_strategy'
    },
    { 
      name: 'ContentGenerationAgent', 
      status: 'pending', 
      progress: 0, 
      description: 'Creating ads, images, and videos using MCP tools',
      startTime: '-',
      duration: '-',
      outputs: [],
      icon: Image,
      color: 'orange',
      stage: 'content_generation'
    }
  ]);

  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [executionTimeline, setExecutionTimeline] = useState<ExecutionTimelineEvent[]>([]);
  const [expandedOutputs, setExpandedOutputs] = useState<{[key: string]: boolean}>({});
  const [liveOutputs, setLiveOutputs] = useState<{[key: string]: string[]}>({});
  const [currentStage, setCurrentStage] = useState<string>('initializing');

  const eventSourceRef = useRef<EventSource | null>(null);
  const outputsEndRef = useRef<HTMLDivElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const loadedSessionsRef = useRef<Set<string>>(new Set());

  // Real-time monitoring effects
  useEffect(() => {
    if (!sessionId) return;

    // Check if we've already loaded data for this session
    if (loadedSessionsRef.current.has(sessionId)) {
      console.log('Data already loaded for session:', sessionId, '- skipping');
      return;
    }

    // Load data once only - no real-time monitoring
    // MonitoringTab loading session (removed excessive logging)
    
    // Mark this session as loaded
    loadedSessionsRef.current.add(sessionId);
    
    loadInitialData();

    // No cleanup needed since we're not starting any intervals or connections
  }, [sessionId]);

  // Auto-scroll to bottom of outputs and timeline
  useEffect(() => {
    if (outputsEndRef.current) {
      outputsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentOutputs]);

  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionTimeline]);

  const startRealTimeMonitoring = () => {
    // Real-time monitoring completely disabled
    console.log('Real-time monitoring disabled - using one-time data loading only');
    setIsStreaming(false);
    
    // Just add a simple timeline entry
    addToTimeline('System', 'started', 'Monitoring tab loaded - real-time disabled');
  };

  const startPolling = () => {
    // Polling disabled - load data once only
    console.log('Polling disabled - loading initial data only');
    loadInitialData();
  };

  const loadInitialData = async () => {
    if (!sessionId) return;

    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('Already loading data, skipping duplicate call');
      return;
    }

    try {
      console.log('Loading initial data for session:', sessionId);
      
      // Load session progress once
      const progress = await ApiService.getSessionProgress(sessionId);
      if (progress) {
        setSessionProgress(progress);
        updateAgentStatusFromProgress(progress);
        
        // Calculate overall campaign progress
        const overallProgress = calculateOverallProgress(progress);
        updateCampaignProgress(overallProgress);
      }

      // Load agent outputs once
      const outputs = await ApiService.getAgentOutputs(sessionId);
      if (outputs && outputs.length > 0) {
        setAgentOutputs(outputs);
        updateAgentStatusFromOutputs(outputs);
      }

      // Load individual agent results once
      await loadIndividualAgentResults();

    } catch (error) {
      console.error('Error loading initial data:', error);
      addToTimeline('System', 'failed', 'Failed to load campaign data');
      onError('Failed to load campaign data. Please check your connection.');
    }
  };

  const stopRealTimeMonitoring = () => {
    setIsStreaming(false);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // No more polling intervals to clear
    console.log('Stopped real-time monitoring');
  };

  const handleRealTimeMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'agent_output':
        setAgentOutputs(prev => [...prev, message.data.output]);
        updateAgentFromOutput(message.data);
        addLiveOutput(message.data.agent, message.data.output);
        break;
      case 'progress_update':
        setSessionProgress(message.data);
        updateAgentStatusFromProgress(message.data);
        break;
      case 'status_change':
        updateAgentStatus(message.data.agent, message.data.status, message.data.progress);
        addToTimeline(message.data.agent, message.data.status, message.data.details);
        break;
      case 'error':
        onError(message.data.error);
        updateAgentStatus(message.data.agent, 'failed', 0, message.data.error);
        addToTimeline(message.data.agent, 'failed', message.data.error);
        break;
    }
  };

  const addLiveOutput = (agentName: string, output: string) => {
    setLiveOutputs(prev => ({
      ...prev,
      [agentName]: [...(prev[agentName] || []), output].slice(-10) // Keep last 10 outputs
    }));
  };

  const updateAgentStatusFromProgress = (progress: SessionProgress) => {
    console.log('Updating agent status from progress:', progress); // Debug log
    setCurrentStage(progress.current_stage || 'initializing');
    
    setAgents(prev => prev.map(agent => {
      const isCompleted = progress.agents_completed.includes(agent.name);
      const isCurrent = progress.current_stage?.includes(agent.name.toLowerCase()) || 
                       progress.current_stage?.includes(agent.stage);
      
      console.log(`Agent ${agent.name}: completed=${isCompleted}, current=${isCurrent}`); // Debug log
      
      let status: AgentStatus['status'] = 'pending';
      let agentProgress = 0;

      if (isCompleted) {
        status = 'completed';
        agentProgress = 100;
        // Add completion event to timeline
        addToTimeline(agent.name, 'completed', `${agent.name} completed successfully`);
      } else if (isCurrent) {
        status = 'running';
        agentProgress = Math.min(progress.progress_percentage || 0, 95);
        // Add start event to timeline if not already started
        if (agent.status === 'pending') {
          addToTimeline(agent.name, 'started', `${agent.name} execution started`);
        }
      }

      return {
        ...agent,
        status,
        progress: agentProgress,
        startTime: status === 'running' && agent.startTime === '-' ? 
          new Date().toLocaleTimeString() : agent.startTime,
        duration: status === 'completed' && agent.duration === '-' ?
          calculateDuration(agent.startTime) : agent.duration
      };
    }));
  };

  const updateAgentStatusFromOutputs = (outputs: string[]) => {
    const latestOutputs = outputs.slice(-20); // Get last 20 outputs
    
    setAgents(prev => prev.map(agent => {
      const agentOutputs = latestOutputs.filter(output => 
        output.toLowerCase().includes(agent.name.toLowerCase()) ||
        output.toLowerCase().includes(agent.stage.toLowerCase())
      );

      if (agentOutputs.length > 0) {
        const lastOutput = agentOutputs[agentOutputs.length - 1];
        
        // Add outputs to live outputs
        agentOutputs.forEach(output => {
          addLiveOutput(agent.name, output);
        });

        // Detect status changes from outputs
        let newStatus = agent.status;
        let newProgress = agent.progress;

        if (lastOutput.includes('Starting') || lastOutput.includes('starting')) {
          newStatus = 'running';
          newProgress = Math.max(newProgress, 10);
          addToTimeline(agent.name, 'started', lastOutput);
        } else if (lastOutput.includes('complete') || lastOutput.includes('✅')) {
          newStatus = 'completed';
          newProgress = 100;
          addToTimeline(agent.name, 'completed', lastOutput);
        } else if (lastOutput.includes('error') || lastOutput.includes('❌')) {
          newStatus = 'failed';
          addToTimeline(agent.name, 'failed', lastOutput);
        } else if (newStatus === 'running') {
          // Increment progress for running agents
          newProgress = Math.min(newProgress + 5, 95);
          addToTimeline(agent.name, 'progress', lastOutput, newProgress);
        }

        return {
          ...agent,
          outputs: [...agent.outputs, ...agentOutputs].slice(-10), // Keep last 10 outputs
          lastOutput,
          status: newStatus,
          progress: newProgress,
          startTime: newStatus === 'running' && agent.startTime === '-' ? 
            new Date().toLocaleTimeString() : agent.startTime
        };
      }

      return agent;
    }));
  };

  const updateAgentFromOutput = (data: any) => {
    if (!data.agent) return;

    setAgents(prev => prev.map(agent => {
      if (agent.name === data.agent) {
        return {
          ...agent,
          outputs: [...agent.outputs, data.output].slice(-5),
          lastOutput: data.output,
          status: data.status || agent.status,
          progress: data.progress || agent.progress
        };
      }
      return agent;
    }));
  };

  const updateAgentStatus = (
    agentName: string, 
    status: AgentStatus['status'], 
    progress: number, 
    errorMessage?: string
  ) => {
    setAgents(prev => prev.map(agent => {
      if (agent.name === agentName) {
        return {
          ...agent,
          status,
          progress,
          errorMessage,
          startTime: status === 'running' && agent.startTime === '-' ? 
            new Date().toLocaleTimeString() : agent.startTime,
          duration: status === 'completed' ? 
            calculateDuration(agent.startTime) : agent.duration
        };
      }
      return agent;
    }));
  };

  const addToTimeline = (agentName: string, status: string, details?: string, progress?: number) => {
    const event: ExecutionTimelineEvent = {
      id: `${agentName}-${Date.now()}`,
      agent: agentName,
      timestamp: new Date().toLocaleTimeString(),
      event: status === 'running' || status === 'started' ? 'Started execution' : 
             status === 'completed' ? 'Completed successfully' : 
             status === 'failed' ? 'Failed with error' : 
             status === 'progress' ? 'Progress update' : status,
      status: status as 'started' | 'completed' | 'failed' | 'progress',
      details,
      progress
    };

    setExecutionTimeline(prev => {
      // Avoid duplicate events
      const exists = prev.some(e => 
        e.agent === agentName && 
        e.status === event.status && 
        Math.abs(new Date(`1970-01-01 ${e.timestamp}`).getTime() - new Date(`1970-01-01 ${event.timestamp}`).getTime()) < 5000
      );
      
      if (!exists) {
        return [...prev, event].slice(-20); // Keep last 20 events
      }
      return prev;
    });
  };

  const calculateDuration = (startTime: string): string => {
    if (startTime === '-') return '-';
    
    try {
      const start = new Date(`1970-01-01 ${startTime}`);
      const now = new Date(`1970-01-01 ${new Date().toLocaleTimeString()}`);
      const diff = now.getTime() - start.getTime();
      
      if (diff < 60000) {
        return `${Math.floor(diff / 1000)}s`;
      } else {
        return `${Math.floor(diff / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
      }
    } catch {
      return '-';
    }
  };

  const calculateOverallProgress = (progress: SessionProgress): number => {
    const totalAgents = agents.length;
    const completedAgents = progress.agents_completed.length;
    const currentAgentProgress = progress.progress_percentage || 0;
    
    // Calculate weighted progress
    const baseProgress = (completedAgents / totalAgents) * 100;
    const currentProgress = currentAgentProgress / totalAgents;
    
    return Math.min(baseProgress + currentProgress, 100);
  };

  const updateCampaignProgress = (progress: number) => {
    // Trigger workflow update if significant progress made
    if (progress >= 100) {
      onWorkflowUpdate();
    }
  };

  const loadIndividualAgentResults = async () => {
    if (!sessionId) return;

    const agentNames = ['AudienceAgent', 'BudgetAgent', 'PromptAgent', 'ContentGenerationAgent'];
    
    console.log('Loading individual agent results once for session:', sessionId);
    
    for (const agentName of agentNames) {
      try {
        const result = await ApiService.getAgentResult(sessionId, agentName);
        if (result) {
          updateAgentWithResult(agentName, result);
          console.log(`Loaded ${agentName} result:`, result.status);
        }
      } catch (error) {
        console.debug(`Failed to load ${agentName} result:`, error);
      }
    }
  };

  const updateAgentWithResult = (agentName: string, result: any) => {
    setAgents(prev => prev.map(agent => {
      if (agent.name === agentName && result) {
        const hasResult = result.status === 'completed' || result.result;
        return {
          ...agent,
          status: hasResult ? 'completed' : agent.status,
          progress: hasResult ? 100 : agent.progress,
          duration: hasResult && agent.duration === '-' ? 
            calculateDuration(agent.startTime) : agent.duration
        };
      }
      return agent;
    }));
  };

  const retryFailedAgent = async (agentName: string) => {
    if (!sessionId) return;

    try {
      addToTimeline(agentName, 'started', `Retrying ${agentName} execution`);
      updateAgentStatus(agentName, 'running', 0);
      
      // Clear previous error
      setAgents(prev => prev.map(agent => 
        agent.name === agentName 
          ? { ...agent, errorMessage: undefined }
          : agent
      ));
      
      // This would trigger a retry in the backend
      // For now, we'll simulate the retry
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success rate for demo
        if (success) {
          updateAgentStatus(agentName, 'completed', 100);
          addToTimeline(agentName, 'completed', `${agentName} retry successful`);
        } else {
          updateAgentStatus(agentName, 'failed', 0, 'Retry failed - please check configuration');
          addToTimeline(agentName, 'failed', `${agentName} retry failed`);
        }
      }, 3000);
    } catch (error) {
      onError(`Failed to retry ${agentName}: ${error}`);
      addToTimeline(agentName, 'failed', `Retry attempt failed: ${error}`);
    }
  };

  const handleAgentStatusManagement = (agentName: string, newStatus: 'pending' | 'running' | 'completed' | 'failed') => {
    setAgents(prev => prev.map(agent => {
      if (agent.name === agentName) {
        const updatedAgent = { ...agent, status: newStatus };
        
        // Update timestamps and progress based on status
        switch (newStatus) {
          case 'running':
            updatedAgent.startTime = agent.startTime === '-' ? new Date().toLocaleTimeString() : agent.startTime;
            updatedAgent.progress = Math.max(agent.progress, 5);
            break;
          case 'completed':
            updatedAgent.progress = 100;
            updatedAgent.duration = calculateDuration(agent.startTime);
            break;
          case 'failed':
            updatedAgent.duration = calculateDuration(agent.startTime);
            break;
          case 'pending':
            updatedAgent.progress = 0;
            updatedAgent.startTime = '-';
            updatedAgent.duration = '-';
            break;
        }
        
        return updatedAgent;
      }
      return agent;
    }));
  };

  const getStatusIcon = (status: string, agentIcon?: React.ComponentType<any>) => {
    const IconComponent = agentIcon || Activity;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'running':
        return <IconComponent className="w-5 h-5 text-primary-600 animate-pulse" />;
      case 'pending':
        return <IconComponent className="w-5 h-5 text-gray-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-error-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'running':
        return 'text-primary-600 bg-primary-50 border-primary-200 animate-pulse';
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'failed':
        return 'text-error-600 bg-error-50 border-error-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-500';
      case 'running':
        return 'bg-primary-500 animate-pulse';
      case 'failed':
        return 'bg-error-500';
      default:
        return 'bg-gray-400';
    }
  };

  const toggleOutputExpansion = (agentName: string) => {
    setExpandedOutputs(prev => ({
      ...prev,
      [agentName]: !prev[agentName]
    }));
  };

  const overallProgress = sessionProgress?.progress_percentage || 
    (agents.reduce((acc, agent) => acc + agent.progress, 0) / agents.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Real-Time Agent Monitoring
        </h2>
        <p className="text-gray-600">
          Track your AI agents as they analyze, create, and optimize your marketing campaign
        </p>
        
        {/* System Status Indicators */}
        <div className="flex items-center justify-center mt-4 space-x-6">
          <div className="flex items-center text-sm">
            {isStreaming ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                <span className="text-green-600">Live monitoring active</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                <span className="text-yellow-600">Polling mode</span>
              </>
            )}
          </div>
          
          {sessionId && (
            <div className="flex items-center text-sm text-gray-500">
              <Terminal className="w-4 h-4 mr-1" />
              Session: {sessionId.split('-').pop()}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500">
            <Eye className="w-4 h-4 mr-1" />
            {agents.filter(a => a.status === 'running').length} active
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Progress</h3>
            {sessionProgress?.status && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                sessionProgress.status === 'completed' ? 'bg-success-100 text-success-800' :
                sessionProgress.status === 'running' ? 'bg-primary-100 text-primary-800' :
                sessionProgress.status === 'error' ? 'bg-error-100 text-error-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {sessionProgress.status.charAt(0).toUpperCase() + sessionProgress.status.slice(1)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary-600">{Math.round(overallProgress)}%</span>
            {sessionProgress?.current_stage && (
              <div className="text-sm text-gray-500">{sessionProgress.current_stage}</div>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          {sessionId && (
            <div>
              <strong>Session ID:</strong> {sessionId}
            </div>
          )}
          {sessionProgress?.started_at && (
            <div>
              <strong>Started:</strong> {new Date(sessionProgress.started_at).toLocaleTimeString()}
            </div>
          )}
          {sessionProgress?.agents_completed && (
            <div>
              <strong>Completed Agents:</strong> {sessionProgress.agents_completed.length}/{agents.length}
            </div>
          )}
          {sessionProgress?.last_updated && (
            <div>
              <strong>Last Update:</strong> {new Date(sessionProgress.last_updated).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Agent Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-600">
              {agents.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center p-3 bg-primary-50 rounded-lg">
            <div className="text-lg font-bold text-primary-600">
              {agents.filter(a => a.status === 'running').length}
            </div>
            <div className="text-xs text-primary-700">Running</div>
          </div>
          <div className="text-center p-3 bg-success-50 rounded-lg">
            <div className="text-lg font-bold text-success-600">
              {agents.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-xs text-success-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-error-50 rounded-lg">
            <div className="text-lg font-bold text-error-600">
              {agents.filter(a => a.status === 'failed').length}
            </div>
            <div className="text-xs text-error-700">Failed</div>
          </div>
        </div>

        {sessionProgress?.error_message && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-error-800">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="font-medium">Campaign Error:</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-error-600 text-white text-xs rounded hover:bg-error-700 transition-colors"
              >
                Restart
              </button>
            </div>
            <div className="text-error-700 text-sm mt-1">{sessionProgress.error_message}</div>
          </div>
        )}
      </div>

      {/* Agent Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent, index) => (
          <div key={agent.name} className={`card border-l-4 transition-all duration-300 ${
            agent.status === 'completed' ? 'border-l-success-500 bg-success-50/30' :
            agent.status === 'running' ? 'border-l-primary-500 bg-primary-50/30 shadow-lg' :
            agent.status === 'failed' ? 'border-l-error-500 bg-error-50/30' :
            'border-l-gray-300'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(agent.status, agent.icon)}
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    {agent.name}
                    {agent.status === 'running' && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin text-primary-600" />
                    )}
                  </h4>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Started: {agent.startTime}</div>
                <div>Duration: {agent.duration}</div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{agent.description}</p>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{agent.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(agent.status)}`}
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
            </div>

            {/* Live Output Section */}
            {(agent.status === 'running' || liveOutputs[agent.name]?.length > 0) && (
              <div className="mt-4">
                <button
                  onClick={() => toggleOutputExpansion(agent.name)}
                  className="flex items-center text-xs font-medium text-gray-700 mb-2 hover:text-primary-600 transition-colors"
                >
                  {expandedOutputs[agent.name] ? (
                    <ChevronDown className="w-3 h-3 mr-1" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1" />
                  )}
                  Live Output ({liveOutputs[agent.name]?.length || 0})
                  {agent.status === 'running' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse" />
                  )}
                </button>
                
                {expandedOutputs[agent.name] && (
                  <div className="p-3 bg-gray-900 rounded-lg text-green-400 font-mono text-xs max-h-32 overflow-y-auto">
                    {liveOutputs[agent.name]?.length > 0 ? (
                      liveOutputs[agent.name].map((output, idx) => (
                        <div key={idx} className="mb-1">
                          <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {output}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">
                        {agent.status === 'running' ? 
                          `${agent.name} is processing...` :
                          'No output available'
                        }
                        {agent.status === 'running' && <span className="animate-pulse">|</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message and Retry */}
            {agent.errorMessage && (
              <div className="mt-3 p-3 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center text-error-800 mb-1">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="font-medium text-sm">Execution Failed</span>
                    </div>
                    <div className="text-error-700 text-xs">{agent.errorMessage}</div>
                  </div>
                  <button
                    onClick={() => retryFailedAgent(agent.name)}
                    className="ml-3 px-3 py-1 bg-error-600 text-white text-xs rounded hover:bg-error-700 transition-colors flex items-center"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Agent Status Actions */}
            {agent.status === 'completed' && (
              <div className="mt-3 flex items-center text-xs text-success-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Execution completed successfully
              </div>
            )}
            
            {agent.status === 'running' && (
              <div className="mt-3 flex items-center text-xs text-primary-600">
                <Activity className="w-3 h-3 mr-1 animate-pulse" />
                Currently executing... ({agent.progress}% complete)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Execution Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
            Execution Timeline
          </h3>
          <div className="text-sm text-gray-500">
            {executionTimeline.length} events
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {executionTimeline.length > 0 ? (
            executionTimeline.map((event) => (
              <div key={event.id} className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${
                event.status === 'completed' ? 'border-l-success-500 bg-success-50' :
                event.status === 'started' ? 'border-l-primary-500 bg-primary-50' :
                event.status === 'failed' ? 'border-l-error-500 bg-error-50' :
                'border-l-gray-300 bg-gray-50'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {event.status === 'completed' && <CheckCircle className="w-4 h-4 text-success-600" />}
                  {event.status === 'started' && <Play className="w-4 h-4 text-primary-600" />}
                  {event.status === 'failed' && <AlertCircle className="w-4 h-4 text-error-600" />}
                  {event.status === 'progress' && <Activity className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {event.agent} - {event.event}
                    </p>
                    <span className="text-xs text-gray-500">{event.timestamp}</span>
                  </div>
                  {event.details && (
                    <p className="text-xs text-gray-600 mt-1">{event.details}</p>
                  )}
                  {event.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${event.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No execution events yet</p>
              <p className="text-xs">Timeline will appear when agents start running</p>
            </div>
          )}
          <div ref={timelineEndRef} />
        </div>
      </div>

      {/* Campaign Data Preview */}
      {campaignData && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">${campaignData.budget}</div>
              <div className="text-sm text-primary-700">Total Budget</div>
            </div>
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-2xl font-bold text-success-600">${campaignData.product_cost}</div>
              <div className="text-sm text-success-700">Product Cost</div>
            </div>
            <div className="text-center p-4 bg-warning-50 rounded-lg">
              <div className="text-2xl font-bold text-warning-600">
                {Math.round((campaignData.budget / campaignData.product_cost) * 100)}%
              </div>
              <div className="text-sm text-warning-700">ROI Target</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Product Description:</div>
            <div className="text-sm text-gray-600">{campaignData.product}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringTab;