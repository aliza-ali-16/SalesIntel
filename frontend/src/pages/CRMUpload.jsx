import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Info,
  ArrowRight
} from 'lucide-react';

export default function CRMUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg('');
    if (!selectedFile) return;

    const fileType = selectedFile.name.split('.').pop().toLowerCase();
    if (fileType !== 'csv') {
      setErrorMsg('Invalid file type. Please upload a standard comma-separated value (.csv) file.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setUploadState('idle');
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      return setErrorMsg('Please choose a file before uploading.');
    }

    setErrorMsg('');
    setUploadState('uploading');
    setProgress(15);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate uploading progress ticks
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const response = await axios.post('/crm/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressTimer);
      setProgress(100);
      setUploadState('processing');

      // Add a small delay for user to read state
      setTimeout(() => {
        setUploadState('success');
        setTimeout(() => {
          // Navigate directly to the monitoring screen so they can see logs or outputs
          navigate('/monitoring');
        }, 1500);
      }, 1000);

    } catch (err) {
      setUploadState('error');
      setErrorMsg(err.response?.data?.message || 'Upload execution failed. Check file format.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl shadow-sm">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Import Client Data</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload your customer CRM contacts list. Our Multi-Agent System will analyze behavioral metrics, assign priority lead categories, structure follow-ups, and generate customized emails immediately.
        </p>

        {/* Drag and Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            mt-6 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
            ${file 
              ? 'border-accentPurple bg-accentPurple/5' 
              : 'border-slate-300 hover:border-accentPurple bg-slate-50/50 hover:bg-slate-100/50 dark:border-slate-800 dark:hover:border-accentPurple/50 dark:bg-slate-900/10 dark:hover:bg-slate-900/30'
            }
          `}
        >
          <input
            type="file"
            id="crmFileInput"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="crmFileInput" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
            <div className="p-4 rounded-full bg-white dark:bg-[#121420] text-accentPurple border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
              {file ? <FileSpreadsheet size={28} /> : <UploadCloud size={28} />}
            </div>
            
            {file ? (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Drag & drop your CSV file here, or browse</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports standard CSV contacts spreadsheet format</p>
              </div>
            )}
          </label>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 mt-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons & Progress bars */}
        {uploadState === 'idle' && file && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUploadSubmit}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-accentPurple to-accentIndigo text-white rounded-xl text-sm font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              <span>Initialize AI Pipeline</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Uploading progress states */}
        {['uploading', 'processing', 'success'].includes(uploadState) && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                {uploadState === 'success' ? (
                  <CheckCircle size={15} className="text-accentEmerald" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-accentPurple animate-ping"></span>
                )}
                <span>
                  {uploadState === 'uploading' && `Uploading CRM dataset (${progress}%)`}
                  {uploadState === 'processing' && 'Invoking Multi-Agent controllers...'}
                  {uploadState === 'success' && 'Import Successful. Opening Log Terminal...'}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-accentPurple to-accentIndigo h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Guide/Template Help Box */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Info size={16} className="text-accentPurple" />
          <span>Expected CSV Headers Schema</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          For correct processing, verify your spreadsheet contains columns named exactly like the layout headers below:
        </p>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-xl">
          <table className="w-full text-left border-collapse text-xs font-mono-custom">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#121420] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">name</th>
                <th className="p-3">email</th>
                <th className="p-3">visits</th>
                <th className="p-3">email_opens</th>
                <th className="p-3">purchases</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 dark:border-slate-800/50 text-slate-600 dark:text-slate-400">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">Sarah Connor</td>
                <td className="p-3">sarah@skynet.com</td>
                <td className="p-3">18</td>
                <td className="p-3">4</td>
                <td className="p-3">2</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">John Connor</td>
                <td className="p-3">john@resistance.net</td>
                <td className="p-3">2</td>
                <td className="p-3">0</td>
                <td className="p-3">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
