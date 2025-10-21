import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    Edit3,
    ThumbsUp,
    ThumbsDown,
    History,
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    RotateCcw,
    CheckSquare,
    Square,
    AlertTriangle,
    Info,
    Users,
    Calendar,
    MessageSquare,
    Zap,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import type {
    GeneratedAd,
    ApprovalStatus,
    RevisionEntry,
    CampaignData
} from '../types';

interface ApprovalWorkflowProps {
    campaignData: CampaignData | null;
    sessionId: string | null;
    approvalStatus: ApprovalStatus;
    onApprovalAction: (adId: string, action: 'approve' | 'revise', feedback?: string) => Promise<void>;
    onBulkApproval: (adIds: string[], action: 'approve' | 'revise') => Promise<void>;
    onWorkflowProgression: (canProceed: boolean) => void;
    onViewRevision?: (adId: string) => void;
    className?: string;
}

interface FilterOptions {
    status: 'all' | 'pending' | 'approved' | 'revision_requested' | 'revising' | 'revision_ready';
    platform: 'all' | string;
    adType: 'all' | 'text_ad' | 'image_ad' | 'video_ad';
    audience: 'all' | string;
}

interface SortOptions {
    field: 'created' | 'platform' | 'status' | 'audience';
    direction: 'asc' | 'desc';
}

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
    campaignData,
    sessionId,
    approvalStatus,
    onApprovalAction,
    onBulkApproval,
    onWorkflowProgression,
    onViewRevision,
    className = ''
}) => {
    const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<FilterOptions>({
        status: 'all',
        platform: 'all',
        adType: 'all',
        audience: 'all'
    });
    const [sort, setSort] = useState<SortOptions>({
        field: 'created',
        direction: 'desc'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set());
    const [showRevisionHistory, setShowRevisionHistory] = useState<Set<string>>(new Set());

    const generatedAds = campaignData?.generatedAds || [];

    // Calculate approval statistics
    const approvalStats = useMemo(() => {
        const stats = {
            total: generatedAds.length,
            approved: 0,
            pending: 0,
            revising: 0,
            revision_requested: 0,
            revision_ready: 0
        };

        generatedAds.forEach(ad => {
            const status = approvalStatus[ad.id]?.status || 'pending';
            if (stats.hasOwnProperty(status)) {
                stats[status as keyof typeof stats]++;
            }
        });

        return {
            ...stats,
            approvalRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
            canProceedToAnalytics: stats.approved === stats.total && stats.total > 0
        };
    }, [generatedAds, approvalStatus]);

    // Filter and sort ads
    const filteredAndSortedAds = useMemo(() => {
        let filtered = generatedAds.filter(ad => {
            const status = approvalStatus[ad.id]?.status || 'pending';
            const matchesStatus = filters.status === 'all' || status === filters.status;
            const matchesPlatform = filters.platform === 'all' || ad.platform === filters.platform;
            const matchesAdType = filters.adType === 'all' || ad.ad_type === filters.adType;
            const matchesAudience = filters.audience === 'all' || ad.audience === filters.audience;
            const matchesSearch = searchQuery === '' ||
                ad.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ad.ad_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (ad.audience && ad.audience.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (ad.content && ad.content.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesStatus && matchesPlatform && matchesAdType && matchesAudience && matchesSearch;
        });

        // Sort filtered results
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sort.field) {
                case 'platform':
                    aValue = a.platform;
                    bValue = b.platform;
                    break;
                case 'status':
                    aValue = approvalStatus[a.id]?.status || 'pending';
                    bValue = approvalStatus[b.id]?.status || 'pending';
                    break;
                case 'audience':
                    aValue = a.audience || '';
                    bValue = b.audience || '';
                    break;
                case 'created':
                default:
                    aValue = a.id;
                    bValue = b.id;
                    break;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sort.direction === 'asc' ? comparison : -comparison;
            }

            return 0;
        });

        return filtered;
    }, [generatedAds, approvalStatus, filters, sort, searchQuery]);

    // Get unique values for filter options
    const filterOptions = useMemo(() => {
        const platforms = [...new Set(generatedAds.map(ad => ad.platform))];
        const adTypes = [...new Set(generatedAds.map(ad => ad.ad_type))];
        const audiences = [...new Set(generatedAds.map(ad => ad.audience).filter(Boolean))];

        return { platforms, adTypes, audiences };
    }, [generatedAds]);

    // Update workflow progression when approval stats change
    useEffect(() => {
        onWorkflowProgression(approvalStats.canProceedToAnalytics);
    }, [approvalStats.canProceedToAnalytics, onWorkflowProgression]);

    // Handle individual ad selection
    const handleAdSelection = (adId: string, selected: boolean) => {
        const newSelection = new Set(selectedAds);
        if (selected) {
            newSelection.add(adId);
        } else {
            newSelection.delete(adId);
        }
        setSelectedAds(newSelection);
    };

    // Handle select all/none
    const handleSelectAll = (selectAll: boolean) => {
        if (selectAll) {
            setSelectedAds(new Set(filteredAndSortedAds.map(ad => ad.id)));
        } else {
            setSelectedAds(new Set());
        }
    };

    // Handle bulk approval actions
    const handleBulkAction = async (action: 'approve' | 'revise') => {
        if (selectedAds.size === 0) return;

        try {
            await onBulkApproval(Array.from(selectedAds), action);
            setSelectedAds(new Set());
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
        }
    };

    // Toggle revision history visibility
    const toggleRevisionHistory = (adId: string) => {
        const newSet = new Set(showRevisionHistory);
        if (newSet.has(adId)) {
            newSet.delete(adId);
        } else {
            newSet.add(adId);
        }
        setShowRevisionHistory(newSet);
    };

    // Get status text
    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved':
                return 'APPROVED';
            case 'revision_requested':
                return 'NEEDS REVISION';
            case 'revising':
                return 'REVISING';
            case 'revision_ready':
                return 'REVISION READY';
            case 'pending':
            default:
                return 'PENDING';
        }
    };

    // Get status styling
    const getStatusStyling = (status: string) => {
        switch (status) {
            case 'approved':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-700',
                    icon: CheckCircle
                };
            case 'revision_requested':
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    text: 'text-orange-700',
                    icon: Edit3
                };
            case 'revising':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-700',
                    icon: Clock
                };
            case 'revision_ready':
                return {
                    bg: 'bg-purple-50',
                    border: 'border-purple-200',
                    text: 'text-purple-700',
                    icon: Eye
                };
            case 'pending':
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-700',
                    icon: Clock
                };
        }
    };

    const allSelected = selectedAds.size === filteredAndSortedAds.length && filteredAndSortedAds.length > 0;
    const someSelected = selectedAds.size > 0 && selectedAds.size < filteredAndSortedAds.length;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header with Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Approval Workflow</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage content approval and track revision history
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                                {approvalStats.approved}/{approvalStats.total}
                            </div>
                            <div className="text-sm text-gray-600">Approved</div>
                        </div>
                        <div className="w-16 h-16">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                    strokeDasharray={`${approvalStats.approvalRate}, 100`}
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{approvalStats.pending}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-semibold text-green-700">{approvalStats.approved}</div>
                        <div className="text-sm text-green-600">Approved</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-semibold text-orange-700">{approvalStats.revision_requested}</div>
                        <div className="text-sm text-orange-600">Needs Revision</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-semibold text-blue-700">{approvalStats.revising}</div>
                        <div className="text-sm text-blue-600">Revising</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-semibold text-purple-700">{approvalStats.revision_ready}</div>
                        <div className="text-sm text-purple-600">Ready to Review</div>
                    </div>
                </div>

                {/* Workflow Progression Status */}
                {approvalStats.canProceedToAnalytics ? (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                            <div className="font-medium text-green-900">Ready to Proceed</div>
                            <div className="text-sm text-green-700">All ads have been approved. You can now proceed to Analytics.</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-green-600" />
                    </div>
                ) : (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <div className="flex-1">
                            <div className="font-medium text-orange-900">Approval Required</div>
                            <div className="text-sm text-orange-700">
                                {approvalStats.total - approvalStats.approved} ads still need approval before proceeding to Analytics.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search ads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter Toggle and Bulk Actions */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {selectedAds.size > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{selectedAds.size} selected</span>
                                <button
                                    onClick={() => handleBulkAction('approve')}
                                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>Approve All</span>
                                </button>
                                <button
                                    onClick={() => handleBulkAction('revise')}
                                    className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    <span>Request Revision</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="revision_requested">Needs Revision</option>
                                    <option value="revising">Revising</option>
                                    <option value="revision_ready">Ready to Review</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                                <select
                                    value={filters.platform}
                                    onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Platforms</option>
                                    {filterOptions.platforms.map(platform => (
                                        <option key={platform} value={platform}>{platform}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
                                <select
                                    value={filters.adType}
                                    onChange={(e) => setFilters(prev => ({ ...prev, adType: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="text_ad">Text Ads</option>
                                    <option value="image_ad">Image Ads</option>
                                    <option value="video_ad">Video Ads</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                                <select
                                    value={filters.audience}
                                    onChange={(e) => setFilters(prev => ({ ...prev, audience: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Audiences</option>
                                    {filterOptions.audiences.map(audience => (
                                        <option key={audience} value={audience}>{audience}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>      {/*
 Ads List */}
            <div className="bg-white rounded-lg border border-gray-200">
                {/* List Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                        if (input) input.indeterminate = someSelected;
                                    }}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label className="ml-2 text-sm font-medium text-gray-700">
                                    Select All ({filteredAndSortedAds.length})
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Sort by:</span>
                            <select
                                value={`${sort.field}-${sort.direction}`}
                                onChange={(e) => {
                                    const [field, direction] = e.target.value.split('-');
                                    setSort({ field: field as any, direction: direction as any });
                                }}
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="created-desc">Created (Newest)</option>
                                <option value="created-asc">Created (Oldest)</option>
                                <option value="platform-asc">Platform (A-Z)</option>
                                <option value="platform-desc">Platform (Z-A)</option>
                                <option value="status-asc">Status (A-Z)</option>
                                <option value="status-desc">Status (Z-A)</option>
                                <option value="audience-asc">Audience (A-Z)</option>
                                <option value="audience-desc">Audience (Z-A)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Ads List Content */}
                <div className="divide-y divide-gray-200">
                    {filteredAndSortedAds.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="text-gray-400 mb-2">
                                <Search className="w-12 h-12 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No ads found</h3>
                            <p className="text-gray-600">
                                {searchQuery || Object.values(filters).some(f => f !== 'all')
                                    ? 'Try adjusting your search or filters'
                                    : 'No ads available for approval'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredAndSortedAds.map((ad) => {
                            const status = approvalStatus[ad.id]?.status || 'pending';
                            const revisionHistory = approvalStatus[ad.id]?.revisionHistory || [];
                            const styling = getStatusStyling(status);
                            const StatusIcon = styling.icon;
                            const isSelected = selectedAds.has(ad.id);
                            const showHistory = showRevisionHistory.has(ad.id);

                            return (
                                <div key={ad.id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-start space-x-4">
                                        {/* Selection Checkbox */}
                                        <div className="flex items-center pt-1">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleAdSelection(ad.id, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Ad Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${styling.bg} ${styling.border} ${styling.text}`}>
                                                            <StatusIcon className="w-3 h-3 inline mr-1" />
                                                            {getStatusText(status)}
                                                        </div>
                                                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                            {ad.platform}
                                                        </div>
                                                        <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                            {ad.ad_type.replace('_', ' ').toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    {revisionHistory.length > 0 && (
                                                        <button
                                                            onClick={() => toggleRevisionHistory(ad.id)}
                                                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                                        >
                                                            <History className="w-3 h-3" />
                                                            <span>{revisionHistory.length} revision{revisionHistory.length !== 1 ? 's' : ''}</span>
                                                            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Ad Details */}
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <div className="flex items-center space-x-1">
                                                        <Users className="w-4 h-4" />
                                                        <span>Audience: {ad.audience || 'General'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Zap className="w-4 h-4" />
                                                        <span>ID: {ad.id}</span>
                                                    </div>
                                                </div>

                                                {/* Content Preview */}
                                                {ad.content && ad.ad_type === 'text_ad' && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-sm text-gray-900 line-clamp-3">
                                                            {ad.content}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Current Feedback */}
                                                {approvalStatus[ad.id]?.feedback && (
                                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                        <div className="flex items-start space-x-2">
                                                            <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5" />
                                                            <div>
                                                                <div className="text-sm font-medium text-orange-900">Current Feedback:</div>
                                                                <div className="text-sm text-orange-800 mt-1">
                                                                    {approvalStatus[ad.id].feedback}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Revision History */}
                                                {showHistory && revisionHistory.length > 0 && (
                                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                        <div className="flex items-center space-x-2">
                                                            <History className="w-4 h-4 text-gray-600" />
                                                            <span className="text-sm font-medium text-gray-900">Revision History</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {revisionHistory.map((revision, index) => (
                                                                <div key={index} className="border-l-2 border-gray-300 pl-4">
                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                        <Calendar className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-xs text-gray-500">
                                                                            {new Date(revision.timestamp).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-700 mb-2">
                                                                        <strong>Feedback:</strong> {revision.feedback}
                                                                    </div>
                                                                    {revision.revisedContent && (
                                                                        <div className="text-xs text-gray-600">
                                                                            <strong>Revised Content:</strong> Available
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-3 mt-4">
                                                <button
                                                    onClick={() => onApprovalAction(ad.id, 'approve')}
                                                    disabled={status === 'approved' || status === 'revising'}
                                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${status === 'approved'
                                                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                            : status === 'revising'
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                        }`}
                                                >
                                                    <ThumbsUp className="w-4 h-4" />
                                                    <span>{status === 'approved' ? 'Approved' : 'Approve'}</span>
                                                </button>

                                                {status === 'revision_ready' && onViewRevision ? (
                                                    <button
                                                        onClick={() => onViewRevision(ad.id)}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>View Revision</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onApprovalAction(ad.id, 'revise')}
                                                        disabled={status === 'revising' || status === 'revision_ready'}
                                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${status === 'revising' || status === 'revision_ready'
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                                                            }`}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                        <span>
                                                            {status === 'revising' ? 'Revising...' :
                                                                status === 'revision_ready' ? 'Revision Ready' :
                                                                    'Request Revision'}
                                                        </span>
                                                    </button>
                                                )}

                                                {revisionHistory.length > 0 && (
                                                    <button
                                                        onClick={() => toggleRevisionHistory(ad.id)}
                                                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                                    >
                                                        {showHistory ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        <span>{showHistory ? 'Hide' : 'Show'} History</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredAndSortedAds.length} of {generatedAds.length} ads
                        {selectedAds.size > 0 && ` • ${selectedAds.size} selected`}
                    </div>
                    <div className="flex items-center space-x-4">
                        {approvalStats.canProceedToAnalytics ? (
                            <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Ready for Analytics</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-orange-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {approvalStats.total - approvalStats.approved} pending approval
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalWorkflow;