import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PhoneCallIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  WarningCircleIcon, 
  FastForwardIcon, 
  UserMinusIcon, 
  MicrophoneSlashIcon 
} from '@phosphor-icons/react';
import { API_BASE_URL } from '../config';

export function ClickToTalk() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('7499695286');
  const [status, setStatus] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'ended'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [callSid, setCallSid] = useState('');

  const handleCall = async () => {
    if (!phoneNumber) {
      setErrorMessage("Please select a valid phone number.");
      return;
    }
    
    setErrorMessage('');
    setStatus('dialing');

    try {
      const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const response = await fetch(`${API_BASE_URL}/request-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const data = await response.json();
      setCallSid(data.callSid);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect. Please try again.");
      setStatus('idle');
    }
  };

  const handleEndCall = async () => {
    setStatus('ended');
    if (callSid) {
      try {
        await fetch(`${API_BASE_URL}/end-call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callSid })
        });
      } catch (e) {
        console.error('Failed to end call:', e);
      }
    }
  };

  useEffect(() => {
    if (!callSid || status === 'ended') return;

    const eventSource = new EventSource(`${API_BASE_URL}/call-status/${callSid}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'ringing') setStatus('ringing');
      if (data.status === 'in-progress') setStatus('connected');
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'busy' || data.status === 'no-answer') {
        setStatus('ended');
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [callSid, status]);

  return (
    <div className="min-h-[calc(100vh-10rem)] w-full flex flex-col items-center justify-start pt-12 pb-24 px-4 gap-10">

      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.svg" alt="SettleVox Logo" className="h-10 w-auto" />
            <CardTitle className="text-3xl font-display font-medium text-foreground">SettleVox</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground mt-2 text-base">
            Experience our AI Legal Intake Agent. Select the phone number below and SettleVox will call you immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
            <div className="relative">
              <PhoneCallIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Select 
                value={countryCode + phoneNumber} 
                onValueChange={(val) => {
                  if (val === "+917499695286") {
                    setCountryCode("+91");
                    setPhoneNumber("7499695286");
                  }
                }}
                disabled={status !== 'idle' && status !== 'ended'}
              >
                <SelectTrigger className="w-full pl-10 bg-secondary/50 border-border">
                  <SelectValue placeholder="Select Phone Number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+917499695286">🇮🇳 +91 7499695286</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorMessage && (
              <p className="text-sm text-destructive mt-1">{errorMessage}</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {status === 'idle' || status === 'ended' ? (
              <Button 
                onClick={handleCall} 
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Start AI Demo Call
              </Button>
            ) : status === 'dialing' || status === 'ringing' ? (
              <Button disabled className="w-full h-12 text-lg bg-secondary text-secondary-foreground font-semibold">
                <span className="animate-pulse flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {status === 'dialing' ? 'Dialing...' : 'Ringing...'}
                </span>
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleEndCall} className="w-full h-12 text-lg font-semibold">
                End Demo Call
              </Button>
            )}
            {status === 'idle' && (
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="w-full h-12 text-muted-foreground border-border mt-2">
                Go to Dashboard Overview
              </Button>
            )}
          </div>
        </CardContent>
        {status === 'ended' && (
          <CardFooter className="flex-col pt-4 pb-8">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Call ended. Check the dashboard to see the extracted data.
            </p>
            <Button variant="outline" className="w-full border-border" onClick={() => window.location.href = '/dashboard'}>
              View Dashboard
            </Button>
          </CardFooter>
        )}
      </Card>

      <div className="w-full max-w-3xl space-y-6">
        <h3 className="text-xl font-display font-medium text-foreground px-1">Technical Architecture: Challenges & Improvements</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Current Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <div>
                <strong className="text-foreground">Network & API Latency:</strong>
                <p className="mt-1">Noticeable conversational latency exists due to transatlantic transit times (US-hosted Twilio edge servers communicating with local/regional processing nodes) compounded by sequential third-party API hops between Cartesia (STT/TTS) and Groq (LLM).</p>
              </div>
              <div>
                <strong className="text-foreground">Static Phone Numbers:</strong>
                <p className="mt-1">Due to Twilio's Free Tier restrictions, outbound calling is strictly locked to pre-verified Caller IDs. Dynamic number inputs are disabled to prevent Twilio from automatically rejecting the call.</p>
              </div>
              <div>
                <strong className="text-foreground">WebSocket Transitions:</strong>
                <p className="mt-1">Raw 8kHz µ-law audio from Twilio requires continuous chunking, buffering, and repacking to bridge communication with Cartesia's WebSockets, adding overhead.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Future Improvements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <div>
                <strong className="text-foreground">Edge Colocation:</strong>
                <p className="mt-1">Deploying the Node.js orchestrator server directly to US East (AWS/Vercel) adjacent to Twilio's primary signaling edge would eliminate hundreds of milliseconds of geographical WebSocket transit latency.</p>
              </div>
              <div>
                <strong className="text-foreground">Token-Level Streaming:</strong>
                <p className="mt-1">Currently, the LLM buffers responses until a structural delimiter is hit. Streaming tokens directly into Cartesia Sonic's TTS context buffer would allow near-instantaneous responses and faster barge-in handling.</p>
              </div>
              <div>
                <strong className="text-foreground">Paid Telephony Tier:</strong>
                <p className="mt-1">Upgrading to a paid Twilio account or SIP trunk provider would unlock global SMS routing and allow any user to input their custom phone number for testing without pre-verification limits.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card mt-6">
          <CardHeader>
            <CardTitle>Supported Demo Test Cases</CardTitle>
            <CardDescription className="text-muted-foreground">Try these scenarios during the demo to test the agent's edge case handling capabilities.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3 items-start bg-secondary/30 p-4 rounded-lg border border-border/50">
                <CheckCircleIcon size={24} className="text-green-500 mt-0.5 shrink-0" weight="fill" />
                <div>
                  <strong className="text-foreground block mb-1">1. The "Golden Path"</strong>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Provide details for a clear-cut auto accident (rear-ended, injured, other party at fault). The agent will smoothly gather all required information step-by-step, qualify the lead, and proceed to wrap-up.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-secondary/30 p-4 rounded-lg border border-border/50">
                <XCircleIcon size={24} className="text-red-500 mt-0.5 shrink-0" weight="fill" />
                <div>
                  <strong className="text-foreground block mb-1">2. The Unqualified Lead</strong>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Describe an incident with no third-party liability (e.g., slipping in your own driveway). The agent will recognize the criteria mismatch and gracefully reject the lead without offering legal advice.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-secondary/30 p-4 rounded-lg border border-border/50">
                <WarningCircleIcon size={24} className="text-amber-500 mt-0.5 shrink-0" weight="fill" />
                <div>
                  <strong className="text-foreground block mb-1">3. The Barge-In (Interruption)</strong>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Interrupt the agent mid-sentence with an out-of-band question (e.g., "Wait, are you a robot?"). The system will instantly halt audio playback, address the question, and seamlessly return to the intake script.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-secondary/30 p-4 rounded-lg border border-border/50">
                <FastForwardIcon size={24} className="text-blue-500 mt-0.5 shrink-0" weight="fill" />
                <div>
                  <strong className="text-foreground block mb-1">4. The Over-Sharer (Fast-Forwarding)</strong>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Provide multiple pieces of information (incident, injuries, liability) in one breath. The underlying FSM will extract all entities concurrently and fast-forward past redundant questions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-secondary/30 p-4 rounded-lg border border-border/50">
                <UserMinusIcon size={24} className="text-purple-500 mt-0.5 shrink-0" weight="fill" />
                <div>
                  <strong className="text-foreground block mb-1">5. Contact Refusal (Zod Fallbacks)</strong>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Refuse to provide your name or email when asked. The system will leverage fallback schemas to log the fields as "REFUSED" and continue the flow without getting trapped in an infinite loop.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-secondary/30 p-4 rounded-lg border border-border/50">
                <MicrophoneSlashIcon size={24} className="text-rose-500 mt-0.5 shrink-0" weight="fill" />
                <div>
                  <strong className="text-foreground block mb-1">6. Recording Refusal (TCPA)</strong>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Say "No" when the agent asks for permission to record the call during the greeting. The agent will strictly enforce compliance by acknowledging the refusal and immediately terminating the call.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
