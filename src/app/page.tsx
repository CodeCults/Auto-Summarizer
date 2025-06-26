"use client";

import { useState, FormEvent, useRef, useEffect } from 'react';
import SummaryDisplay from '@/components/SummaryDisplay';
import { ChevronDown } from 'lucide-react';

// Define the structure for our summary data
interface SummaryData {
  mainSummary: string;
  sections: { title: string; summary: string; }[];
  keywords: string[];
  ideaCards: { title: string; content: string; }[];
  mindMap: string;
  quiz: { question: string; answer: string; }[];
  originalText: string;
}

interface EvaluationResult {
    score: number;
    feedback: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New states for advanced features
  const [summaryStyle, setSummaryStyle] = useState('Simplified');
  const [userSummary, setUserSummary] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const options = ['Simplified', 'Academic', 'Bullet Points'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, [dropdownRef]);

  const canSubmit = text.trim() !== '' || url.trim() !== '' || file !== null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setSummaryData(null);
    setEvaluationResult(null);
    setUserSummary('');
    setError('');

    const formData = new FormData();
    formData.append('text', text);
    formData.append('url', url);
    formData.append('summaryStyle', summaryStyle);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'An error occurred.');
      setSummaryData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e: FormEvent) => {
    e.preventDefault();
    if (!userSummary || !summaryData?.originalText) return;

    setIsEvaluating(true);
    setError('');

    try {
        const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalText: summaryData.originalText,
                userSummary: userSummary,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Evaluation failed.');
        setEvaluationResult(data);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
    } finally {
        setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 80) return 'text-green-400';
    if (score > 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <main className="max-w-3xl w-full mx-auto p-6 bg-[#1e293b] rounded-lg shadow-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">AI Text Summarizer</h1>
          <p className="text-gray-400">Get a concise summary of your text, document, or webpage.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
            className="w-full p-3 border rounded-lg transition-all duration-200 bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500"
            rows={8}
          />

          <div className="text-center text-gray-500 text-sm">
            <p>Or upload a file or provide a link</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="sm:col-span-2 w-full p-3 border rounded-lg transition-all duration-200 bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500"
            />
            <div className="flex items-center justify-center sm:justify-start gap-2">
                <label htmlFor="file-upload" className="cursor-pointer rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 hover:scale-[1.02] transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e293b]">
                    Dosya Seç
                </label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    accept=".txt,.pdf,.docx"
                    className="hidden"
                />
                <span className="text-sm text-gray-400 truncate" title={file?.name}>
                    {file ? file.name : "Dosya seçilmedi"}
                </span>
            </div>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="flex-grow relative" ref={dropdownRef}>
              <label htmlFor="summary-style-button" className="block text-sm font-medium text-gray-400 mb-1">Summary Style</label>
              <button
                  type="button"
                  id="summary-style-button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex justify-between items-center px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                  <span>{summaryStyle}</span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                      <ul className="py-1">
                          {options.map((option) => (
                              <li
                                  key={option}
                                  onClick={() => {
                                      setSummaryStyle(option);
                                      setIsDropdownOpen(false);
                                  }}
                                  className="px-4 py-2 text-white hover:bg-blue-600 cursor-pointer"
                              >
                                  {option}
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="self-end w-1/2 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-700 disabled:text-gray-400 transition-colors duration-200"
            >
              {loading ? 'Summarizing...' : 'Summarize'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">
            <p><span className="font-semibold">Error:</span> {error}</p>
          </div>
        )}

        {summaryData && <SummaryDisplay data={summaryData} />}

        {summaryData && (
            <div className="p-6 bg-slate-800 rounded-lg shadow-inner mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Evaluate Your Summary</h2>
                <form onSubmit={handleEvaluate} className="space-y-4">
                    <textarea
                        value={userSummary}
                        onChange={(e) => setUserSummary(e.target.value)}
                        placeholder="Write your own summary here to get feedback..."
                        className="w-full p-3 border rounded-lg bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={5}
                    />
                    <button type="submit" disabled={isEvaluating || !userSummary} className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-slate-700 transition-colors">
                        {isEvaluating ? "Evaluating..." : "Get Feedback"}
                    </button>
                </form>

                {evaluationResult && (
                    <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold text-white">Evaluation Result</h3>
                        <p className="text-lg mt-2">
                            <span className={`font-bold text-2xl ${getScoreColor(evaluationResult.score)}`}>{evaluationResult.score}%</span>
                            <span className="text-gray-400 ml-2">Match</span>
                        </p>
                        <p className="mt-2 text-gray-300">{evaluationResult.feedback}</p>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
}
