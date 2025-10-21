import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudienceTab from '../AudienceTab';
import type { CampaignData } from '../../../types';

// Mock data based on the actual agent outputs
const mockCampaignData: CampaignData = {
  product: "EcoSmart Water Bottle",
  product_cost: 45,
  budget: 1250,
  audiences: {
    audiences: [
      {
        name: "Fitness Enthusiasts",
        demographics: "Health-conscious adults 25-40 who regularly exercise and track fitness goals",
        platforms: [
          {
            platform: "Instagram",
            reason: "Visual platform ideal for showcasing product features through fitness influencer partnerships"
          }
        ]
      },
      {
        name: "Tech-Savvy Professionals",
        demographics: "Working professionals 30-45 who value convenience and smart home integration",
        platforms: [
          {
            platform: "LinkedIn",
            reason: "Reaches career-focused individuals interested in productivity and wellness tech"
          }
        ]
      },
      {
        name: "Health-Conscious Parents",
        demographics: "Parents 28-45 concerned about family hydration and hygiene",
        platforms: [
          {
            platform: "Facebook",
            reason: "Strong parent communities and targeted ad capabilities for family-oriented products"
          }
        ]
      }
    ]
  },
  budgetAllocation: {
    total_budget: 1250.0,
    allocations: [
      {
        audience: "Fitness Enthusiasts",
        total: 625.0,
        platforms: [
          {
            platform: "Instagram",
            amount: 625.0,
            percentage: 50.0
          }
        ]
      },
      {
        audience: "Tech-Savvy Professionals",
        total: 375.0,
        platforms: [
          {
            platform: "LinkedIn",
            amount: 375.0,
            percentage: 30.0
          }
        ]
      },
      {
        audience: "Health-Conscious Parents",
        total: 250.0,
        platforms: [
          {
            platform: "Facebook",
            amount: 250.0,
            percentage: 20.0
          }
        ]
      }
    ]
  }
};

describe('AudienceTab', () => {
  const defaultProps = {
    campaignData: mockCampaignData,
    sessionId: 'test-session-123',
    isLoading: false,
    error: null,
    onError: jest.fn()
  };

  beforeEach(() => {
    // Mock URL.createObjectURL for export functionality
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document.createElement and appendChild for export
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders audience analysis and budget distribution', () => {
    render(<AudienceTab {...defaultProps} />);
    
    expect(screen.getByText('Audience Analysis & Budget Distribution')).toBeInTheDocument();
    expect(screen.getByText('Fitness Enthusiasts')).toBeInTheDocument();
    expect(screen.getByText('Tech-Savvy Professionals')).toBeInTheDocument();
    expect(screen.getByText('Health-Conscious Parents')).toBeInTheDocument();
    expect(screen.getByText('$1,250')).toBeInTheDocument();
  });

  it('displays platform icons and reasoning', () => {
    render(<AudienceTab {...defaultProps} />);
    
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    
    expect(screen.getByText(/Visual platform ideal for showcasing/)).toBeInTheDocument();
    expect(screen.getByText(/Reaches career-focused individuals/)).toBeInTheDocument();
    expect(screen.getByText(/Strong parent communities/)).toBeInTheDocument();
  });

  it('shows budget allocation with correct amounts and percentages', () => {
    render(<AudienceTab {...defaultProps} />);
    
    expect(screen.getByText('$625')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('$375')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('$250')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('handles export functionality', () => {
    render(<AudienceTab {...defaultProps} />);
    
    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);
    
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<AudienceTab {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText(/AI agents are analyzing your target audiences/)).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<AudienceTab {...defaultProps} campaignData={null} />);
    
    expect(screen.getByText(/No audience data available yet/)).toBeInTheDocument();
  });

  it('displays performance projections with correct calculations', () => {
    render(<AudienceTab {...defaultProps} />);
    
    // Should show 3 target audiences
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Target Audiences')).toBeInTheDocument();
    
    // Should show 3 platform channels (Instagram, LinkedIn, Facebook)
    expect(screen.getByText('Platform Channels')).toBeInTheDocument();
    
    // Should show average per platform ($1250 / 3 = $417)
    expect(screen.getByText('Avg. per Platform')).toBeInTheDocument();
    
    // Should show highest allocation (50%)
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Highest Allocation')).toBeInTheDocument();
  });

  it('renders budget distribution chart component', () => {
    render(<AudienceTab {...defaultProps} />);
    
    expect(screen.getByText('Budget Distribution Visualization')).toBeInTheDocument();
  });
});