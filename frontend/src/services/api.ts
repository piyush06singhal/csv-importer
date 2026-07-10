import { env } from '../config/env.config';
import type { ImportResponse } from 'shared';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function uploadCSV(
  file: File,
  onProgress?: (progress: { stage: string; percent: number }) => void
): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/import`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let data: any;
      try {
        data = await res.json();
      } catch (e) {
        throw new ApiClientError(
          'Failed to connect to backend server. Make sure the API is running.',
          res.status,
          'API_ERROR'
        );
      }
      const errorMsg = data?.error?.message || 'An error occurred during import.';
      const errorCode = data?.error?.code || 'API_ERROR';
      throw new ApiClientError(errorMsg, res.status, errorCode);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new ApiClientError('Response body stream is not available.');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult: ImportResponse | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;

        let event: any;
        try {
          event = JSON.parse(line);
        } catch (e) {
          continue;
        }

        if (event.type === 'progress' && onProgress) {
          onProgress({ stage: event.stage, percent: event.percent });
        } else if (event.type === 'error') {
          throw new ApiClientError(event.error.message, res.status, event.error.code);
        } else if (event.type === 'result') {
          finalResult = event.data;
        }
      }
    }

    if (!finalResult) {
      throw new ApiClientError('Server stream closed without yielding mapping results.');
    }

    return finalResult;
  } catch (error: any) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error.message || 'Failed to connect to backend server. Make sure the API is running.'
    );
  }
}
