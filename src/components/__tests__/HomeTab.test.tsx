import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HomeTab from '../tabs/HomeTab';
import type { CampaignStartRequest } from '../../types';

describe('HomeTab Component', () => {
  const mockProps = {
    campaignData: null,
    sessionId: null,
    isLoading: false,
    error: null,
    onError: vi.fn(),
    onCampaignStart: vi.fn()
  };

  it('renders the campaign setup form', () => {
    render(<HomeTab {...mockProps} />);
    
    expect(screen.getByText('Launch Your Marketing Campaign')).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Cost/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Campaign Budget/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Campaign/i })).toBeInTheDocument();
  });

  it('validates form fields correctly', async () => {
    render(<HomeTab {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /Start Campaign/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Product description is required')).toBeInTheDocument();
      expect(screen.getByText('Valid product cost is required')).toBeInTheDocument();
      expect(screen.getByText('Valid campaign budget is required')).toBeInTheDocument();
    });
  });

  it('shows loading state when campaign is starting', () => {
    render(<HomeTab {...mockProps} isLoading={true} />);
    
    expect(screen.getByText('Starting Campaign...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onCampaignStart with correct data when form is valid', async () => {
    const mockOnCampaignStart = vi.fn();
    render(<HomeTab {...mockProps} onCampaignStart={mockOnCampaignStart} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Product Description/i), {
      target: { value: 'Test product description' }
    });
    fireEvent.change(screen.getByLabelText(/Product Cost/i), {
      target: { value: '29.99' }
    });
    fireEvent.change(screen.getByLabelText(/Campaign Budget/i), {
      target: { value: '1000' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Start Campaign/i }));

    await waitFor(() => {
      expect(mockOnCampaignStart).toHaveBeenCalledWith({
        product: 'Test product description',
        product_cost: 29.99,
        budget: 1000
      });
    });
  });

  it('shows campaign preview when all fields are filled', () => {
    render(<HomeTab {...mockProps} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Product Description/i), {
      target: { value: 'Test product' }
    });
    fireEvent.change(screen.getByLabelText(/Product Cost/i), {
      target: { value: '50' }
    });
    fireEvent.change(screen.getByLabelText(/Campaign Budget/i), {
      target: { value: '1000' }
    });

    expect(screen.getByText('Campaign Preview')).toBeInTheDocument();
    expect(screen.getByText('Product: Test product')).toBeInTheDocument();
    expect(screen.getByText('Cost: $50')).toBeInTheDocument();
    expect(screen.getByText('Budget: $1000')).toBeInTheDocument();
  });

  it('validates budget is at least 2x product cost', async () => {
    render(<HomeTab {...mockProps} />);
    
    // Fill out form with budget less than 2x cost
    fireEvent.change(screen.getByLabelText(/Product Description/i), {
      target: { value: 'Test product' }
    });
    fireEvent.change(screen.getByLabelText(/Product Cost/i), {
      target: { value: '100' }
    });
    fireEvent.change(screen.getByLabelText(/Campaign Budget/i), {
      target: { value: '150' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Campaign/i }));

    await waitFor(() => {
      expect(screen.getByText('Budget should be at least 2x the product cost for effective marketing')).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog when form is submitted with valid data', async () => {
    render(<HomeTab {...mockProps} />);
    
    // Fill out valid form
    fireEvent.change(screen.getByLabelText(/Product Description/i), {
      target: { value: 'Smart water bottle with UV-C cleaning technology' }
    });
    fireEvent.change(screen.getByLabelText(/Product Cost/i), {
      target: { value: '49.99' }
    });
    fireEvent.change(screen.getByLabelText(/Campaign Budget/i), {
      target: { value: '2000' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Start Campaign/i }));

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Campaign Launch')).toBeInTheDocument();
      expect(screen.getByText('Smart water bottle with UV-C cleaning technology')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
      expect(screen.getByText('$2000.00')).toBeInTheDocument();
    });
  });

  it('calls onCampaignStart when confirmation dialog is confirmed', async () => {
    const mockOnCampaignStart = vi.fn();
    render(<HomeTab {...mockProps} onCampaignStart={mockOnCampaignStart} />);
    
    // Fill out valid form
    fireEvent.change(screen.getByLabelText(/Product Description/i), {
      target: { value: 'Test product' }
    });
    fireEvent.change(screen.getByLabelText(/Product Cost/i), {
      target: { value: '29.99' }
    });
    fireEvent.change(screen.getByLabelText(/Campaign Budget/i), {
      target: { value: '1000' }
    });

    // Submit form to show confirmation
    fireEvent.click(screen.getByRole('button', { name: /Start Campaign/i }));

    // Wait for confirmation dialog and confirm
    await waitFor(() => {
      expect(screen.getByText('Confirm Campaign Launch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Launch Campaign/i }));

    await waitFor(() => {
      expect(mockOnCampaignStart).toHaveBeenCalledWith({
        product: 'Test product',
        product_cost: 29.99,
        budget: 1000
      });
    });
  });

  it('handles campaign start errors gracefully', async () => {
    const mockOnCampaignStart = vi.fn().mockRejectedValue(new Error('Backend connection failed'));
    render(<HomeTab {...mockProps} onCampaignStart={mockOnCampaignStart} />);
    
    // Fill out valid form
    fireEvent.change(screen.getByLabelText(/Product Description/i), {
      target: { value: 'Test product' }
    });
    fireEvent.change(screen.getByLabelText(/Product Cost/i), {
      target: { value: '29.99' }
    });
    fireEvent.change(screen.getByLabelText(/Campaign Budget/i), {
      target: { value: '1000' }
    });

    // Submit and confirm
    fireEvent.click(screen.getByRole('button', { name: /Start Campaign/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Campaign Launch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Launch Campaign/i }));

    // Should handle error and close dialog
    await waitFor(() => {
      expect(mockOnCampaignStart).toHaveBeenCalled();
      expect(screen.queryByText('Confirm Campaign Launch')).not.toBeInTheDocument();
    });
  });
});