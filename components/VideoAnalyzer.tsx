
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, Wand2, X } from 'lucide-react';
import Spinner from './Spinner';
import ErrorAlert from './ErrorAlert';
import ResultDisplay from './ResultDisplay';
import { analyzeImage } from '../services/geminiService';
import { dataUrlToGenerativePart } from '../utils/imageUtils';

const VideoAnalyzer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(videoFile);
    setVideoUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [videoFile]);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setVideoFile(file);
      setResult(null);
      setError(null);
    } else {
      setError("Invalid file type. Please upload a supported video file (e.g., MP4, MOV).");
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

  const handleClearVideo = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setError("Video player is not ready.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("Could not get canvas context.");
      }
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const frameDataUrl = canvas.toDataURL('image/jpeg');

      const imagePart = dataUrlToGenerativePart(frameDataUrl);
      const prompt = "Analyze this video frame. Your task is to identify only the grocery items. For each grocery item, provide its name and relative position (e.g., 'top left', 'center'). Keep the description short and concise. Ignore any non-grocery items. For example: 'Milk in the center, eggs on the right'.";
      
      const analysisResult = await analyzeImage(imagePart, prompt);
      setResult(analysisResult);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred during analysis.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full mb-6">
        {!videoUrl ? (
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
                <span className="text-fuchsia-400">Click to upload a video</span> or drag and drop
              </p>
              <p className="text-xs">MP4, MOV, WebM, Ogg</p>
            </div>
            <input
              id="video-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="video/mp4,video/quicktime,video/webm,video/ogg"
            />
          </label>
        ) : (
          <div className="relative group w-full aspect-video bg-black/20 rounded-lg overflow-hidden border-2 border-white/10">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleClearVideo}
              className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-500/80"
              aria-label="Clear video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={handleAnalyzeFrame}
        disabled={isLoading || !videoFile}
        className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-fuchsia-600 rounded-lg shadow-lg hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-fuchsia-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-70"
        aria-label="Analyze video frame"
      >
        {isLoading ? (
          <>
            <Spinner />
            Analyzing...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 mr-2" />
            Analyze Current Frame
          </>
        )}
      </button>

      <div className="w-full mt-8">
        {error && <ErrorAlert message={error} />}
        {result && <ResultDisplay result={result} autoPlay={true} />}
        {!isLoading && !result && !error && videoFile && (
             <div className="text-center text-indigo-300/70 p-4 border-2 border-dashed border-indigo-400/30 rounded-lg">
                Pause the video on a frame and click analyze.
             </div>
        )}
      </div>
    </div>
  );
};

export default VideoAnalyzer;
