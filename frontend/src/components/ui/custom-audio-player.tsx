import { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, SpeakerHighIcon, SpeakerSlashIcon, CircleNotchIcon } from '@phosphor-icons/react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface CustomAudioPlayerProps {
  src: string;
}

export function CustomAudioPlayer({ src }: CustomAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch the audio as a blob to allow seeking and determine duration accurately
  useEffect(() => {
    setIsLoading(true);
    fetch(src)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load audio:', err);
        setIsLoading(false);
      });

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * (duration || 0);
    audioRef.current.currentTime = newTime;
    setProgress(value[0]);
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-14 bg-secondary/50 rounded-md border border-border flex items-center justify-center text-muted-foreground gap-2 text-sm">
        <CircleNotchIcon className="animate-spin" size={16} /> Loading audio...
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="w-full h-14 bg-secondary/50 rounded-md border border-border flex items-center justify-center text-destructive text-sm">
        Failed to load recording
      </div>
    );
  }

  return (
    <div className="w-full bg-secondary/30 rounded-md border border-border p-2 px-3 flex items-center gap-2">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
        onClick={togglePlayPause}
      >
        {isPlaying ? <PauseIcon weight="fill" size={16} /> : <PlayIcon weight="fill" size={16} />}
      </Button>

      <span className="text-[11px] font-mono text-muted-foreground w-8 text-right shrink-0">
        {formatTime(currentTime)}
      </span>

      <div className="flex-1 flex items-center px-1">
        <Slider 
          value={[progress]} 
          max={100} 
          step={0.1}
          onValueChange={handleSliderChange}
          className="cursor-pointer"
        />
      </div>

      <span className="text-[11px] font-mono text-muted-foreground w-8 shrink-0">
        {formatTime(duration)}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
        onClick={toggleMute}
      >
        {isMuted ? <SpeakerSlashIcon size={18} /> : <SpeakerHighIcon size={18} />}
      </Button>
    </div>
  );
}
