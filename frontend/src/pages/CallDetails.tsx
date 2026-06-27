import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, UserIcon, WarningCircleIcon, PlayCircleIcon, DownloadSimpleIcon, FileTextIcon } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { CustomAudioPlayer } from '@/components/ui/custom-audio-player';

export function CallDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [callData, setCallData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: number | undefined;
    
    async function fetchCall() {
      try {
        const response = await fetch(`${API_BASE_URL}/calls/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCallData(data);
          
          // Poll every 2 seconds if the call is active
          if (data.status !== 'completed' && data.status !== 'error') {
            timeoutId = window.setTimeout(fetchCall, 2000);
          }
        }
      } catch (e) {
        console.error('Failed to fetch call details:', e);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchCall();
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted"></div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-muted rounded-lg col-span-1"></div>
          <div className="h-64 bg-muted rounded-lg col-span-1"></div>
          <div className="h-64 bg-muted rounded-lg col-span-1"></div>
        </div>
      </div>
    );
  }

  if (!callData) {
    return <div className="p-8 text-center text-destructive">Failed to load call data.</div>;
  }

  const mockCallData = {
    id: callData.call_id,
    phone: callData.phone_number || 'Unknown',
    status: callData.status || 'unknown',
    date: callData.started_at || new Date().toISOString(),
    duration: callData.duration_seconds !== undefined && callData.duration_seconds !== null ? `${callData.duration_seconds}s` : 'Unknown',
    isQualified: callData.extracted_data?.is_qualified === true,
    cmsId: callData.cms_id || 'Not Synced',
    extractedData: callData.extracted_data || {},
    transcript: callData.transcript || [],
    recordingUrl: callData.recording_url || null
  };

  const handleDownloadTranscript = () => {
    const textContent = mockCallData.transcript.map((msg: any) => `${msg.speaker.toUpperCase()}: ${msg.text}`).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${mockCallData.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonContent = JSON.stringify(mockCallData.extractedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intake_${mockCallData.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/calls')} className="border-border rounded-full">
          <ArrowLeftIcon size={18} />
        </Button>
        <div>
          <h2 className="text-3xl font-display font-medium tracking-tight">Call {mockCallData.phone}</h2>
          <p className="text-muted-foreground mt-1">
            {new Date(mockCallData.date).toLocaleString()} • {mockCallData.duration}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {mockCallData.status === 'completed' || mockCallData.isQualified ? (
            mockCallData.isQualified ? (
              <Badge className="bg-primary text-primary-foreground animate-in fade-in zoom-in">Qualified Lead</Badge>
            ) : (
              <Badge variant="secondary" className="animate-in fade-in zoom-in">Unqualified</Badge>
            )
          ) : (
            <Badge className="bg-green-500/20 text-green-500 animate-pulse border-green-500/50 border">Live Call Active</Badge>
          )}
          <Badge variant="outline" className="font-mono">CMS ID: {mockCallData.cmsId}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Extracted Data Panel */}
        <Card className="col-span-1 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="text-primary" />
              Extracted Intake Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{mockCallData.extractedData.caller_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incident Type</p>
              <p className="font-medium capitalize">{(mockCallData.extractedData.incident_type || 'N/A').replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Incident</p>
              <p className="font-medium">{mockCallData.extractedData.incident_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <WarningCircleIcon /> Injuries
              </p>
              <p className="font-medium">{mockCallData.extractedData.injuries_described || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fault Description</p>
              <p className="text-sm bg-secondary p-3 rounded-md mt-1 capitalize">{(mockCallData.extractedData.fault_assessment || 'N/A').replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consent Given?</p>
              <p className="font-medium">
                {mockCallData.extractedData.consent_given === true || mockCallData.extractedData.consent_given === 'true' 
                  ? 'Yes' 
                  : mockCallData.extractedData.consent_given === false || mockCallData.extractedData.consent_given === 'false' 
                    ? 'No' 
                    : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Media & Actions Panel */}
        <div className="col-span-1 flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircleIcon className="text-primary" />
                Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockCallData.recordingUrl ? (
                <div className="space-y-4">
                  <CustomAudioPlayer src={`${API_BASE_URL}/calls/${mockCallData.id}/recording`} />
                  <p className="text-xs text-muted-foreground">Playback controls available in the custom player.</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4 border border-dashed border-border rounded-md">
                  Recording unavailable in demo.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DownloadSimpleIcon className="text-primary" />
                Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2 border-border" onClick={handleDownloadTranscript}>
                <FileTextIcon /> Download Transcript (.txt)
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 border-border" onClick={handleDownloadJson}>
                <DownloadSimpleIcon /> Download Intake JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transcript Panel */}
        <Card className="col-span-1 border-border bg-card flex flex-col h-full overflow-hidden relative">
          <CardHeader className="shrink-0 relative z-10 bg-card">
            <CardTitle>Conversation Transcript</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 relative p-0">
            <div className="absolute inset-0 px-6 pb-6 overflow-y-auto">
              <div className="space-y-4">
              {mockCallData.transcript.map((msg: any, index: number) => (
                <div 
                  key={index} 
                  className={`flex ${msg.speaker === 'agent' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 text-sm animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                      msg.speaker === 'agent' 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'bg-primary/20 border border-primary/30 text-foreground'
                    }`}
                  >
                    <p className="font-semibold text-xs mb-1 opacity-70 uppercase tracking-wider">
                      {msg.speaker === 'agent' ? 'SettleVox (AI)' : 'Caller'}
                    </p>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
