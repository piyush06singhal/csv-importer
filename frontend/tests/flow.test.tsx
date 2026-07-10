import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import Home from '@/app/page';
import * as api from '@/services/api';

vi.mock('@/services/api', () => ({
  uploadCSV: vi.fn(),
  ApiClientError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
}));

describe('Complete Frontend Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders drag and drop prompt on load in IDLE state', () => {
    render(<Home />);
    expect(screen.getByText(/Drag and drop your lead CSV here/i)).toBeInTheDocument();
  });

  test('successfully displays local CSV preview after selecting a file', async () => {
    render(<Home />);
    const input = document.getElementById('csv-file-picker') as HTMLInputElement;

    const file = new File(['Name,Email\nBruce,bruce@wayne.com'], 'leads.csv', {
      type: 'text/csv',
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Local CSV Preview')).toBeInTheDocument();
    });

    expect(screen.getByText('Bruce')).toBeInTheDocument();
    expect(screen.getByText('bruce@wayne.com')).toBeInTheDocument();
  });

  test('triggers api post request on confirm import and transitions to results on success', async () => {
    const mockUploadResponse = {
      success: true,
      metadata: {
        total_records: 1,
        imported_records: 1,
        skipped_records: 0,
        processing_time_ms: 150,
        batch_count: 1,
        failed_batches: 0,
        retry_count: 0,
        avg_batch_time_ms: 150,
        rows_per_second: 6.67,
      },
      records: [
        {
          name: 'Bruce Wayne',
          email: 'bruce@wayne.com',
          country_code: '1',
          mobile_without_country_code: '5550199',
          company: 'Wayne Enterprises',
          crm_status: 'GOOD_LEAD_FOLLOW_UP',
          data_source: 'eden_park',
        },
      ],
      skipped: [],
    };

    vi.mocked(api.uploadCSV).mockResolvedValue(mockUploadResponse);

    render(<Home />);
    const input = document.getElementById('csv-file-picker') as HTMLInputElement;
    const file = new File(['Name,Email\nBruce,bruce@wayne.com'], 'leads.csv', {
      type: 'text/csv',
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Confirm Import & Map')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText('Confirm Import & Map');
    fireEvent.click(confirmBtn);

    expect(screen.getByText('Uploading CSV file...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Import Metrics Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Imported Leads')).toBeInTheDocument();
    expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
    expect(screen.getByText('bruce@wayne.com')).toBeInTheDocument();
  });

  test('transitions to error screen when the backend API fails', async () => {
    vi.mocked(api.uploadCSV).mockRejectedValue(new Error('Backend Connection Failed'));

    render(<Home />);
    const input = document.getElementById('csv-file-picker') as HTMLInputElement;
    const file = new File(['Name,Email\nBruce,bruce@wayne.com'], 'leads.csv', {
      type: 'text/csv',
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Confirm Import & Map')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText('Confirm Import & Map');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Import Process Encountered an Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Backend Connection Failed')).toBeInTheDocument();
  });
});
