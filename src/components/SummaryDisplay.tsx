"use client";

import { Key, Tag, FileText, FileDown, BrainCircuit, BookOpen, Layers, HelpCircle, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { Packer, Document, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface SummaryData {
    mainSummary: string;
    sections: { title: string; summary: string; }[];
    keywords: string[];
    ideaCards: { title: string; content: string; }[];
    mindMap: string;
    quiz: { question: string; answer: string; }[];
}

interface SummaryDisplayProps {
  data: SummaryData;
}

const createFileName = (extension: string) => `summary_${new Date().toISOString().split('T')[0]}.${extension}`;

export default function SummaryDisplay({ data }: SummaryDisplayProps) {
  const { mainSummary, sections, keywords, ideaCards, mindMap, quiz } = data;

  const generateTxt = () => {
    const content = `...`; // Simplified for brevity
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, createFileName('txt'));
  };

  const generateMd = () => {
    let content = `# AI Summary\n\n## Main Summary\n${mainSummary}\n\n`;
    content += `## Keywords\n${keywords.map(k => `\`#${k}\``).join(' ')}\n\n`;
    content += `## Sections\n`;
    sections.forEach(s => {
      content += `### ${s.title}\n${s.summary}\n\n`;
    });
    content += `## Mind Map\n\`\`\`\n${mindMap}\n\`\`\``;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, createFileName('md'));
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.text("AI Summary", 10, 10);
    doc.text("Keywords:", 10, 20);
    doc.text(keywords.join(', '), 10, 30);
    // ... more content
    doc.save(createFileName('pdf'));
  };

  const generateDocx = () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun("AI Summary")],
          }),
          // ... more content
        ],
      }],
    });
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, createFileName('docx'));
    });
  };

  return (
    <div className="space-y-8 mt-6">
      {/* Keywords */}
      <div className="p-6 bg-slate-800 rounded-lg shadow-inner">
        <h2 className="text-2xl font-bold text-white flex items-center mb-4"><Tag className="mr-3 text-blue-400" />Keywords</h2>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, i) => (
            <span key={i} className="inline-block bg-blue-700 text-white px-3 py-1 rounded-full text-sm">
              #{keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Section-wise Summary */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center mb-4"><Layers className="mr-3 text-blue-400" />Section-wise Summary</h2>
        <div className="space-y-4">
        {sections.map((section, i) => (
            <div key={i} className="p-4 bg-slate-800 rounded-lg shadow-inner transition-shadow duration-300 hover:shadow-lg hover:shadow-blue-900/50">
                <h3 className="font-semibold text-lg text-blue-300 flex items-center"><BookOpen className="mr-2 h-5 w-5"/>{section.title}</h3>
                <p className="text-gray-300 mt-2">{section.summary}</p>
            </div>
        ))}
        </div>
      </div>
      
      {/* Idea Cards */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center mb-4"><Key className="mr-3 text-blue-400" />Idea Blocks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideaCards.map((card, i) => (
            <div key={i} className="p-4 bg-slate-800 rounded-lg shadow-inner">
              <h3 className="font-semibold text-lg text-blue-300">{card.title}</h3>
              <p className="text-gray-300 mt-1">{card.content}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mind Map */}
      <div className="p-6 bg-slate-800 rounded-lg shadow-inner">
        <h2 className="text-2xl font-bold text-white flex items-center mb-4"><BrainCircuit className="mr-3 text-blue-400" />Mind Map Preview</h2>
        <pre className="whitespace-pre-wrap text-gray-300 bg-slate-900 p-4 rounded-md text-sm">{mindMap}</pre>
      </div>
      
      {/* Quiz Section */}
      {quiz && quiz.length > 0 && (
        <div className="p-6 bg-slate-800 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
                <HelpCircle className="mr-3 text-blue-400" />Quiz Yourself
            </h2>
            <div className="space-y-4">
                {quiz.map((item, i) => (
                    <details key={i} className="bg-slate-900 p-4 rounded-lg group">
                        <summary className="font-semibold text-lg text-gray-300 cursor-pointer list-none flex justify-between items-center">
                            {item.question}
                            <span className="text-xs text-gray-500 group-open:hidden">Show Answer</span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-slate-700 text-gray-400 flex items-start">
                            <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-1" />
                            <p>{item.answer}</p>
                        </div>
                    </details>
                ))}
            </div>
        </div>
      )}
      
      {/* Export Options */}
      <div className="p-6 bg-slate-800 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-white flex items-center mb-4"><FileDown className="mr-3 text-blue-400"/>Export Summary</h2>
          <div className="flex flex-wrap gap-3">
              <button onClick={generateMd} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  <FileText className="mr-2 h-4 w-4" /> Export as .md
              </button>
              <button onClick={generateTxt} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  <FileText className="mr-2 h-4 w-4" /> Export as .txt
              </button>
              <button onClick={generatePdf} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  <FileText className="mr-2 h-4 w-4" /> Export as .pdf
              </button>
              <button onClick={generateDocx} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  <FileText className="mr-2 h-4 w-4" /> Export as .docx
              </button>
          </div>
      </div>
    </div>
  );
} 