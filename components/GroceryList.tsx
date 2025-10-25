
import React, { useState, useCallback } from 'react';
import { UploadCloud, Wand2, X, FileAudio } from 'lucide-react';
import { processGroceryAudio } from '../services/geminiService';
import { fileToGenerativePart } from '../utils/imageUtils';
import Notepad from './Notepad';
import ErrorAlert from './ErrorAlert';
import Spinner from './Spinner';
import { GroceryItem } from '../types';

interface GroceryListProps {
  items: GroceryItem[];
  onAddItems: (newItems: string[]) => void;
  onClearList: () => void;
  onToggleItem: (index: number) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ items, onAddItems, onClearList, onToggleItem }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      setAudioFile(file);
      setError(null);
    } else {
      setError("Invalid file type. Please upload a supported audio or video file (e.g., MP3, WAV, MP4, MOV).");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFileSelect(event.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setAudioFile(null);
  };

  const handleProcessAudio = useCallback(async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setError(null);
    try {
      const audioPart = await fileToGenerativePart(audioFile);
      const cleanedItems = await processGroceryAudio(audioPart);
      onAddItems(cleanedItems);
      setAudioFile(null); // Clear file after processing
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError("An unknown error occurred while processing the audio.");
    } finally {
      setIsProcessing(false);
    }
  }, [audioFile, onAddItems]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full mb-6">
        {!audioFile ? (
          <label
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${
              isDragging ? 'border-fuchsia-400 bg-fuchsia-900/20' : 'border-indigo-400/40 hover:border-fuchsia-400/80 hover:bg-black/20'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-indigo-300">
              <UploadCloud className={`w-10 h-10 mb-3 transition-transform duration-300 ${isDragging ? 'scale-110 text-fuchsia-300' : ''}`} />
              <p className="mb-2 text-sm font-semibold">
                <span className="text-fuchsia-400">Click to upload audio</span> or drag and drop
              </p>
              <p className="text-xs">MOV, MP4, MP3, WAV, etc.</p>
            </div>
            <input
              id="audio-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="audio/*,video/mp4,video/quicktime"
            />
          </label>
        ) : (
          <div className="relative group w-full bg-black/20 rounded-lg p-6 border-2 border-white/10 flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <FileAudio className="w-8 h-8 text-fuchsia-400 mr-4 flex-shrink-0" />
              <p className="text-gray-200 truncate" title={audioFile.name}>{audioFile.name}</p>
            </div>
            <button
              onClick={handleClearFile}
              className="p-2 rounded-full text-indigo-300 hover:bg-white/10 hover:text-red-400 transition-colors duration-200 flex-shrink-0 ml-4"
              aria-label="Clear file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleProcessAudio}
        disabled={isProcessing || !audioFile}
        className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-fuchsia-600 rounded-lg shadow-lg hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-fuchsia-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-70"
        aria-label="Process audio file"
      >
        {isProcessing ? (
          <>
            <Spinner />
            Processing...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 mr-2" />
            Add to List
          </>
        )}
      </button>

      <div className="w-full mt-8">
        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
        <Notepad items={items} onClear={onClearList} onToggle={onToggleItem} />
      </div>
    </div>
  );
};

export default GroceryList;
