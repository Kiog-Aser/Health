'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Edit3, Check, X } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceRecorder({ onTranscriptChange, disabled = false, className = '' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded' | 'transcribing'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setIsRecording(true);
      setRecordingState('recording');
      setTranscript('');

      // Set up audio visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start audio level monitoring
      updateAudioLevel();

      // Set up speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + ' ' + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingState('idle');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingState('transcribing');
    
    // Stop audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Give a moment for final recognition results
    setTimeout(() => {
      setRecordingState(transcript ? 'recorded' : 'idle');
      if (transcript) {
        onTranscriptChange(transcript.trim());
      }
    }, 1000);
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditingText(transcript);
  };

  const handleSaveEdit = () => {
    setTranscript(editingText);
    onTranscriptChange(editingText.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingText(transcript);
    setIsEditing(false);
  };

  const clearTranscript = () => {
    setTranscript('');
    setRecordingState('idle');
    onTranscriptChange('');
  };

  // Generate waveform bars based on audio level
  const generateWaveformBars = () => {
    const barCount = 20;
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      const height = isRecording 
        ? Math.max(20, audioLevel * 100 + Math.random() * 30) 
        : 20 + Math.random() * 5;
      
      bars.push(
        <div
          key={i}
          className={`bg-white transition-all duration-75 rounded-full ${
            isRecording ? 'opacity-100' : 'opacity-30'
          }`}
          style={{
            width: '3px',
            height: `${height}%`,
            animationDelay: `${i * 50}ms`,
          }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recording Button and Visualization */}
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || recordingState === 'transcribing'}
          className={`btn btn-circle shadow-lg ${
            isRecording 
              ? 'btn-error animate-pulse' 
              : 'btn-primary'
          } transition-all duration-200`}
          title={isRecording ? 'Stop recording' : 'Start voice note'}
        >
          {recordingState === 'transcribing' ? (
            <div className="loading loading-spinner loading-sm"></div>
          ) : isRecording ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {/* Waveform Animation */}
        {(isRecording || recordingState === 'transcribing') && (
          <div className="flex items-center gap-1 h-8 px-2 bg-black/40 rounded-lg backdrop-blur-sm">
            {generateWaveformBars()}
          </div>
        )}

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center gap-2 text-sm bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
            <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
            <span className="text-white/90">Recording...</span>
          </div>
        )}

        {recordingState === 'transcribing' && (
          <div className="flex items-center gap-2 text-sm bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
            <div className="loading loading-spinner loading-xs"></div>
            <span className="text-white/90">Processing...</span>
          </div>
        )}
      </div>

      {/* Transcript Display/Edit */}
      {recordingState === 'recorded' && transcript && (
        <div className="bg-base-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-base-content/80">Voice Note:</span>
            <div className="flex gap-1">
              {!isEditing && (
                <>
                  <button
                    onClick={handleEdit}
                    className="btn btn-ghost btn-xs"
                    title="Edit transcript"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={clearTranscript}
                    className="btn btn-ghost btn-xs text-error"
                    title="Clear voice note"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="textarea textarea-bordered w-full resize-none"
                rows={3}
                placeholder="Edit your voice note..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="btn btn-primary btn-sm"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-base-content/70 bg-base-100 p-2 rounded border italic">
              "{transcript}"
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {recordingState === 'idle' && (
        <p className="text-xs text-base-content/60">
          Tap the microphone to add context about your meal
        </p>
      )}
    </div>
  );
} 