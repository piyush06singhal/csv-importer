'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useCSVImport } from '@/hooks/useCSVImport';
import type { LeadRecord } from 'shared';

// High-performance React Table virtualization viewport component
function VirtualizedTable({ records }: { records: LeadRecord[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const rowHeight = 48; // fixed row height in pixels
  const viewportHeight = 400; // max viewport window size

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalRows = records.length;
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
  const endIndex = Math.min(totalRows, startIndex + visibleCount + 6);

  const topSpacerHeight = startIndex * rowHeight;
  const bottomSpacerHeight = Math.max(0, (totalRows - endIndex) * rowHeight);
  const visibleRecords = records.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-auto border border-slate-800 rounded-xl scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      style={{ height: `${viewportHeight}px` }}
      role="region"
      aria-label="Virtualized Leads Mappings Grid"
      tabIndex={0}
    >
      <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
        <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-20">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[160px]">Name</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[200px]">Email</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[160px]">Phone</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[160px]">Company</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[120px]">Owner</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[160px]">CRM Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[130px]">Data Source</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[120px]">City</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-[250px]">Description</th>
          </tr>
        </thead>
        <tbody className="bg-slate-950/10 divide-y divide-slate-900/50">
          {topSpacerHeight > 0 && (
            <tr>
              <td colSpan={9} style={{ height: `${topSpacerHeight}px` }} aria-hidden="true" />
            </tr>
          )}
          {visibleRecords.map((lead, idx) => {
            const absoluteIdx = startIndex + idx;
            return (
              <tr
                key={absoluteIdx}
                className="hover:bg-slate-900/30 transition-colors"
                style={{ height: `${rowHeight}px` }}
              >
                <td className="px-4 py-2 text-xs text-slate-200 truncate font-medium">
                  {lead.name || <span className="text-slate-700 italic">null</span>}
                </td>
                <td className="px-4 py-2 text-xs text-slate-300 truncate">
                  {lead.email || <span className="text-slate-700 italic">null</span>}
                </td>
                <td className="px-4 py-2 text-xs text-slate-300 truncate">
                  {lead.country_code ? `+${lead.country_code} ` : ''}
                  {lead.mobile_without_country_code || (
                    <span className="text-slate-700 italic">null</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-slate-300 truncate">
                  {lead.company || <span className="text-slate-700 italic">null</span>}
                </td>
                <td className="px-4 py-2 text-xs text-slate-300 truncate">
                  {lead.lead_owner || <span className="text-slate-700 italic">null</span>}
                </td>
                <td className="px-4 py-2 text-xs truncate">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      lead.crm_status === 'SALE_DONE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : lead.crm_status === 'BAD_LEAD'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : lead.crm_status === 'DID_NOT_CONNECT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {lead.crm_status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs truncate">
                  {lead.data_source ? (
                    <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                      {lead.data_source}
                    </span>
                  ) : (
                    <span className="text-slate-700 italic">null</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-slate-300 truncate">
                  {lead.city || <span className="text-slate-700 italic">null</span>}
                </td>
                <td className="px-4 py-2 text-xs text-slate-400 truncate">
                  {lead.description || lead.crm_note || (
                    <span className="text-slate-700 italic">null</span>
                  )}
                </td>
              </tr>
            );
          })}
          {bottomSpacerHeight > 0 && (
            <tr>
              <td colSpan={9} style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true" />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const {
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
  } = useCSVImport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedSkippedRows, setExpandedSkippedRows] = useState<Record<number, boolean>>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      selectFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      selectFile(selected);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleSkippedRow = (rowIndex: number) => {
    setExpandedSkippedRows((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-12 px-4 md:px-8 transition-colors duration-300">
      {/* Header Block */}
      <header className="w-full max-w-6xl text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold mb-4 backdrop-blur-sm">
          🌟 Competitive Edge Edition
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
          GrowEasy CSV CRM Importer
        </h1>
        <p className="mt-3 text-slate-400 text-base max-w-2xl mx-auto">
          Map arbitrary spreadsheets to target CRM fields in real time. Fast, secure, and virtualized.
        </p>
      </header>

      <section className="w-full max-w-6xl flex flex-col gap-8">
        {/* Upload Interface */}
        {(status === 'IDLE' || status === 'FILE_SELECTED' || status === 'PREVIEW_READY') && !result && (
          <div className="flex flex-col gap-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500 outline-none ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
              role="button"
              aria-label="CSV file upload dropzone"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  triggerFileInput();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-picker"
                tabIndex={-1}
              />
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-200">
                Drag and drop your lead CSV here, or{' '}
                <span className="text-indigo-400 group-hover:text-indigo-300 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Supports standard comma and semicolon CSV files (Max 250 rows)
              </p>

              {file && (
                <div className="mt-6 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 inline-flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-300">{file.name}</span>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetImport();
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors focus:ring-1 focus:ring-red-400 rounded outline-none"
                    title="Remove selected file"
                    aria-label="Remove selected file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW CONTAINER */}
            {status === 'PREVIEW_READY' && previewRows.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-200">Local CSV Preview</h2>
                    <p className="text-xs text-slate-500">
                      Showing first {previewRows.length} columns layout. Click import to start AI extraction
                      mapping.
                    </p>
                  </div>
                  <button
                    onClick={triggerImport}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20 text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                    aria-label="Confirm Import and Map leads"
                  >
                    Confirm Import & Map
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-[350px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                      <tr>
                        {previewHeaders.map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-xs font-semibold text-slate-400 tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          {previewHeaders.map((h) => (
                            <td
                              key={h}
                              className="px-4 py-2.5 text-xs text-slate-300 truncate max-w-[200px]"
                            >
                              {row[h] || <span className="text-slate-600 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROCESSING SCREEN */}
        {status === 'IMPORTING' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-md max-w-md mx-auto w-full flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6" aria-hidden="true">
              <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">{stage}</h3>
            <p className="text-xs text-slate-500 mb-6">
              Converting structures and matching CRM fields. Please do not close this window.
            </p>

            <div
              className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{ width: `${progress}%` }}
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              ></div>
            </div>
            <span className="text-xs font-bold text-indigo-400">{progress}% Completed</span>
          </div>
        )}

        {/* ERROR SCREEN */}
        {status === 'ERROR' && errorMsg && (
          <div className="bg-red-950/20 border border-red-500/25 rounded-2xl p-8 max-w-lg mx-auto w-full text-center backdrop-blur-md">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-300">Import Process Encountered an Error</h3>
            <p className="text-sm text-red-400/80 mt-2 mb-6">{errorMsg}</p>
            <button
              onClick={resetImport}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl text-sm font-semibold transition-all text-slate-200 border border-slate-700 focus:ring-2 focus:ring-slate-500 outline-none"
            >
              Reset and Try Again
            </button>
          </div>
        )}

        {/* SUCCESS DASHBOARD */}
        {status === 'SUCCESS' && result && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header / Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Import Metrics Dashboard</h2>
                <p className="text-xs text-slate-500">Leads parsing completed successfully.</p>
              </div>
              <button
                onClick={resetImport}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-all text-slate-200 border border-slate-700 flex items-center gap-2 self-start sm:self-center focus:ring-2 focus:ring-slate-500 outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import Another File
              </button>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-medium text-slate-500 block uppercase">Total Records</span>
                <span className="text-2xl font-extrabold text-slate-100 mt-1 block">
                  {result.metadata.total_records}
                </span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-medium text-slate-500 block uppercase">Imported Leads</span>
                <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                  {result.metadata.imported_records}
                </span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-medium text-slate-500 block uppercase">Skipped Rows</span>
                <span className="text-2xl font-extrabold text-amber-500 mt-1 block">
                  {result.metadata.skipped_records}
                </span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-medium text-slate-500 block uppercase">Processing Speed</span>
                <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
                  {(result.metadata.processing_time_ms / 1000).toFixed(2)}s
                </span>
              </div>
            </div>

            {/* Performance Metrics Section */}
            <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Total Batches:</span>
                <span className="font-bold text-slate-300 mt-1 block">
                  {result.metadata.batch_count}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Failed Batches:</span>
                <span className="font-bold text-red-400 mt-1 block">
                  {result.metadata.failed_batches ?? 0}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">API Retries:</span>
                <span className="font-bold text-amber-400 mt-1 block">
                  {result.metadata.retry_count ?? 0}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Average Batch Speed:</span>
                <span className="font-bold text-indigo-400 mt-1 block">
                  {result.metadata.avg_batch_time_ms ?? 0} ms
                </span>
              </div>
            </div>

            {/* Virtualized Result Leads Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Successfully Mapped Leads</h3>
              {result.records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <svg className="w-10 h-10 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-semibold">No Matching Records</p>
                  <p className="text-xs text-slate-600 mt-1">Check the skipped records for detailed validation reasons.</p>
                </div>
              ) : (
                <VirtualizedTable records={result.records} />
              )}
            </div>

            {/* Skipped warning rows catalog */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-4">
                Skipped Rows ({result.skipped.length})
              </h3>
              {result.skipped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                  <svg className="w-10 h-10 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold">No Skipped Records</p>
                  <p className="text-xs text-slate-600 mt-1">Excellent! All rows were mapped and imported successfully.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {result.skipped.map((skip, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-800/80 rounded-xl bg-slate-950/20 overflow-hidden"
                    >
                      <div
                        onClick={() => toggleSkippedRow(idx)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleSkippedRow(idx);
                          }
                        }}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-900/20 transition-colors focus:bg-slate-900/20 outline-none"
                        role="button"
                        aria-expanded={expandedSkippedRows[idx]}
                        aria-label={`Skipped row number ${skip.row_index} details`}
                        tabIndex={0}
                      >
                        <div className="flex items-center gap-4 text-xs">
                          <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-bold">
                            Row {skip.row_index}
                          </span>
                          <span className="text-slate-300 font-medium truncate max-w-md">
                            {skip.reason}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          {expandedSkippedRows[idx] ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {expandedSkippedRows[idx] && (
                        <div className="p-4 border-t border-slate-900 bg-slate-950/40 text-xs">
                          <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Original Row Values
                          </h4>
                          <pre className="p-3 bg-slate-950 border border-slate-900 rounded-lg text-indigo-300 overflow-x-auto max-h-[150px] font-mono leading-relaxed">
                            {JSON.stringify(skip.raw_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
