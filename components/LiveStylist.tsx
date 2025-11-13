import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OutfitSuggestion, StyleProfile } from '../types';
import { getMatchesForImage, getSpeechForText, decode, decodeAudioData } from '../services/geminiService';
import CameraIcon from './icons/CameraIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

// SpeechRecognition API interfaces for TypeScript
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort(): void;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}
declare var SpeechRecognition: { new(): SpeechRecognition; } | undefined;
declare var webkitSpeechRecognition: { new(): SpeechRecognition; } | undefined;


interface LiveStylistProps {
  onSuggestions: (suggestions: OutfitSuggestion[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  styleProfile: StyleProfile;
}

const LiveStylist: React.FC<LiveStylistProps> = ({ onSuggestions, setLoading, setError, styleProfile }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenPrompt, setSpokenPrompt] = useState<string>('');
  const [statusText, setStatusText] = useState('Start your camera to get live style advice.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatusText('Point your camera at a clothing item.');
      setError(null);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Could not access the camera. Please check your browser permissions and ensure it's not used by another app.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Camera access denied. To use this feature, please enable camera permissions for this site in your browser settings.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No camera found on this device. Please connect a camera and try again.";
      }
      setError(errorMessage);
      setStatusText('Camera access denied.');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setCapturedImage(null);
    setStatusText('Start your camera to get live style advice.');
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageUrl);
      setStatusText('Image captured! Now, what would you like to know?');
      stopCamera();
    }
  };
  
  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioContext = audioContextRef.current;
    try {
        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (err) {
        console.error("Error playing audio:", err);
        setError("Could not play the audio suggestion.");
    }
  }, [setError]);
  
  const handleSubmit = useCallback(async (prompt: string) => {
    if (!capturedImage || !prompt) {
      setError('Please capture an image and speak a prompt first.');
      return;
    }
    
    setIsProcessing(true);
    setLoading(true);
    setError(null);
    onSuggestions([]);
    
    try {
        const base64Data = capturedImage.split(',')[1];
        const results = await getMatchesForImage(base64Data, 'image/jpeg', prompt, styleProfile);
        onSuggestions(results);
        setLoading(false); // Show suggestions before generating audio

        if (results.length > 0) {
            setStatusText('Here are some ideas! Generating audio for the first one...');
            setIsGeneratingAudio(true);
            const firstSuggestionText = `${results[0].outfitName}. ${results[0].description}`;
            const audioData = await getSpeechForText(firstSuggestionText);
            await playAudio(audioData);
            setStatusText(`You asked: "${prompt}". Here are your suggestions.`);
        } else {
             setStatusText(`I couldn't find any suggestions for that.`);
        }

    } catch(err: any) {
        setError(err.message || "An unknown error occurred.");
        setStatusText('Something went wrong. Please try again.');
        setLoading(false); // Ensure spinner is hidden on error
    } finally {
        setIsProcessing(false);
        setIsGeneratingAudio(false);
    }
  }, [capturedImage, onSuggestions, playAudio, setLoading, setError, styleProfile]);

  const handleListen = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpokenPrompt(transcript);
      setStatusText(`I heard: "${transcript}". Generating ideas...`);
      handleSubmit(transcript);
    };

    recognition.onerror = (event) => {
      let errorMessage = `Speech recognition error: ${event.error}.`;
      if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please enable microphone permissions in your browser settings to use voice commands.';
      } else if (event.error === 'no-speech') {
          errorMessage = 'No speech was detected. Please try speaking again.';
      }
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
    setIsListening(true);
    setStatusText('Listening for your question...');
    setSpokenPrompt('');
    recognitionRef.current = recognition;
  }, [isListening, handleSubmit, setError]);

  useEffect(() => {
    return () => { // Cleanup on unmount
      stopCamera();
      recognitionRef.current?.abort();
      audioContextRef.current?.close();
    };
  }, []);

  const getButtonText = () => {
    if (isListening) return 'Listening...';
    if (isGeneratingAudio) return 'Generating audio...';
    if (isProcessing) return 'Generating suggestions...';
    return 'Ask a Question';
  };
  
  const getButtonClass = () => {
    const baseClass = 'w-full flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-105';
    if (isListening) return `${baseClass} bg-yellow-500 animate-pulse`;
    if (isGeneratingAudio) return `${baseClass} bg-teal-600 animate-pulse`;
    if (isProcessing) return `${baseClass} bg-indigo-600 animate-pulse`;
    return `${baseClass} bg-purple-500 hover:bg-purple-600`;
  }

  return (
    <div className="flex flex-col items-center space-y-4">
        <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden relative flex justify-center items-center border-2 border-gray-700">
            {stream && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
            {capturedImage && <img src={capturedImage} alt="Captured item" className="w-full h-full object-contain" />}
            {!stream && !capturedImage && (
                <div className="text-center text-gray-400">
                    <p>{statusText}</p>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <p className="text-center text-gray-300 h-6">{!isListening && spokenPrompt ? `You asked: "${spokenPrompt}"` : statusText}</p>

        <div className="grid grid-cols-2 gap-4 w-full">
            {!stream && !capturedImage ? (
                <button onClick={startCamera} className="col-span-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                    <CameraIcon /> Start Camera
                </button>
            ) : null}

            {stream && (
                <>
                    <button onClick={captureImage} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                        <CameraIcon /> Capture
                    </button>
                    <button onClick={stopCamera} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                        Stop Camera
                    </button>
                </>
            )}

            {capturedImage && (
                 <div className="col-span-2 flex flex-col items-center gap-4">
                     <button onClick={handleListen} disabled={isListening || isProcessing} className={getButtonClass()}>
                         <MicrophoneIcon /> {getButtonText()}
                     </button>
                     <button 
                        onClick={() => { setCapturedImage(null); setSpokenPrompt(''); onSuggestions([]); setStatusText('Start your camera to get live style advice.')}} 
                        className="text-gray-400 hover:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isProcessing}
                     >
                        Start Over
                    </button>
                 </div>
            )}
        </div>
    </div>
  );
};

export default LiveStylist;