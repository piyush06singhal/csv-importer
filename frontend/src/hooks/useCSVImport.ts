import { useState, useCallback } from 'react';
import { uploadCSV, ApiClientError } from '../services/api';
import type { ImportResponse } from 'shared';

export type ImportStatus =
  | 'IDLE'
  | 'FILE_SELECTED'
  | 'PREVIEW_READY'
  | 'IMPORTING'
  | 'SUCCESS'
  | 'ERROR';

export type ImportStage =
  | 'Idle'
  | 'Uploading CSV file...'
  | 'Parsing rows...'
  | 'AI Mapping and Extraction...'
  | 'Validating target schemas...'
  | 'Consolidating results...'
  | 'Done';

export function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseLocalCSV(content: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const headers = parseCSVLine(firstLine, delimiter).map((h) =>
    h.replace(/^"|"$/g, '').trim()
  );
  const rows: Record<string, string>[] = [];

  const limit = Math.min(lines.length, 11);
  for (let i = 1; i < limit; i++) {
    const cells = parseCSVLine(lines[i], delimiter).map((c) =>
      c.replace(/^"|"$/g, '').trim()
    );
    const row: Record<string, string> = {};
    headers.forEach((h, index) => {
      row[h] = cells[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function useCSVImport() {
  const [status, setStatus] = useState<ImportStatus>('IDLE');
  const [file, setFile] = useState<File | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [stage, setStage] = useState<ImportStage>('Idle');
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMsg('Invalid file extension. Please select a valid .csv file.');
      setStatus('ERROR');
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setStatus('FILE_SELECTED');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        try {
          const parsed = parseLocalCSV(text);
          setPreviewHeaders(parsed.headers);
          setPreviewRows(parsed.rows);
          setStatus('PREVIEW_READY');
        } catch (err: any) {
          setErrorMsg('Failed to read CSV preview details.');
          setStatus('ERROR');
        }
      }
    };
    reader.readAsText(selectedFile);
  }, []);

  const resetImport = useCallback(() => {
    setFile(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    setStage('Idle');
    setProgress(0);
    setResult(null);
    setErrorMsg(null);
    setStatus('IDLE');
  }, []);

  const triggerImport = useCallback(async () => {
    if (!file) return;

    setStatus('IMPORTING');
    setProgress(5);
    setStage('Uploading CSV file...');

    try {
      const response = await uploadCSV(file, (progressUpdate) => {
        setStage(progressUpdate.stage as any);
        setProgress(progressUpdate.percent);
      });

      setProgress(100);
      setStage('Consolidating results...');
      setResult(response);
      setStatus('SUCCESS');
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMsg(err.message || 'An unexpected connection issue occurred. Please try again.');
    }
  }, [file]);

  return {
    status,
    file,
    previewHeaders,
    previewRows,
    stage,
    progress,
    result,
    errorMsg,
    selectFile,
    resetImport,
    triggerImport,
  };
}
