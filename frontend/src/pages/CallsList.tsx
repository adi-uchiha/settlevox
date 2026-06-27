import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PhoneIcon, CalendarIcon, TimerIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react';
import { API_BASE_URL } from '../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function CallsList() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalls() {
      try {
        const response = await fetch(`${API_BASE_URL}/calls`);
        if (response.ok) {
          const data = await response.json();
          setCalls(data);
        }
      } catch (e) {
        console.error('Failed to fetch calls:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCalls();
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const qualifiedCount = calls.filter(c => c.extracted_data?.is_qualified === true).length;
  const unqualifiedCount = calls.filter(c => c.extracted_data?.is_qualified === false).length;
  const errorCount = calls.filter(c => c.status === 'failed' || c.status === 'error').length;
  const incompleteCount = calls.length - qualifiedCount - unqualifiedCount - errorCount;

  const callsByDayAndType: Record<string, Record<string, number>> = {};
  const allTypes = new Set<string>();
  
  calls.forEach(call => {
    if (!call.started_at) return;
    const date = new Date(call.started_at).toLocaleDateString('en-US', { weekday: 'short' });
    const type = call.extracted_data?.incident_type || 'Unknown';
    allTypes.add(type);
    
    if (!callsByDayAndType[date]) callsByDayAndType[date] = {};
    callsByDayAndType[date][type] = (callsByDayAndType[date][type] || 0) + 1;
  });

  const chartLabels = Object.keys(callsByDayAndType);
  const typeArray = Array.from(allTypes);
  const colors = ['rgba(5, 98, 239, 0.8)', 'rgba(42, 122, 122, 0.8)', 'rgba(136, 136, 136, 0.8)', 'rgba(201, 168, 76, 0.8)'];

  const typeDatasets = typeArray.map((type, i) => ({
    label: type.replace(/_/g, ' '),
    data: chartLabels.map(date => callsByDayAndType[date][type] || 0),
    backgroundColor: colors[i % colors.length],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-medium tracking-tight">Call History</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Review past interactions and extracted intake data.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Panel: Table */}
        <Card className="col-span-1 xl:col-span-3 border-border">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border">
                      <TableCell><div className="h-5 bg-muted rounded w-32"></div></TableCell>
                      <TableCell><div className="h-5 bg-muted rounded w-40"></div></TableCell>
                      <TableCell><div className="h-5 bg-muted rounded w-16"></div></TableCell>
                      <TableCell><div className="h-5 bg-muted rounded w-20"></div></TableCell>
                      <TableCell><div className="h-5 bg-muted rounded w-20"></div></TableCell>
                    </TableRow>
                  ))
                ) : (
                  calls.map((call) => (
                    <TableRow 
                      key={call.call_id} 
                      className="cursor-pointer hover:bg-secondary/50 border-border transition-colors"
                      onClick={() => navigate(`/dashboard/calls/${call.call_id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="text-muted-foreground" />
                          {call.phone_number || 'Unknown'}
                          {call.phone_number && (
                            <button 
                              onClick={(e) => copyToClipboard(call.phone_number, e)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              title="Copy Phone Number"
                            >
                              {copiedId === call.phone_number ? <CheckIcon className="text-green-500" /> : <CopyIcon />}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon />
                          {call.started_at ? new Date(call.started_at).toLocaleString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TimerIcon />
                          {call.duration_seconds !== undefined && call.duration_seconds !== null ? `${call.duration_seconds}s` : '0s'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${
                          call.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          call.status === 'in-progress' || call.status === 'ringing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          call.status === 'failed' || call.status === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-gray-500/10 text-gray-500 border-gray-500/20'
                        }`}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.extracted_data?.is_qualified === true ? (
                          <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20">Qualified</Badge>
                        ) : call.extracted_data?.is_qualified === false ? (
                          <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">Unqualified</Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-500 border border-gray-500/20 hover:bg-gray-500/20">Incomplete</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Panel: Charts */}
        <div className="col-span-1 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Actions Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full relative">
                <Doughnut 
                  data={{
                    labels: ['Qualified', 'Unqualified', 'Incomplete', 'Error'],
                    datasets: [{
                      data: [qualifiedCount, unqualifiedCount, incompleteCount, errorCount],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)', // Green
                        'rgba(239, 68, 68, 0.8)', // Red
                        'rgba(245, 158, 11, 0.8)', // Amber
                        'rgba(100, 116, 139, 0.8)', // Slate
                      ],
                      borderWidth: 0,
                    }]
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                        labels: { color: textColor, font: { size: 10 } }
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Volume by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <Bar 
                  data={{
                    labels: chartLabels.length ? chartLabels : ['No Data'],
                    datasets: typeDatasets.length ? typeDatasets : [{ label: 'None', data: [0], backgroundColor: 'rgba(100,116,139,0.8)' }]
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true, grid: { display: false }, ticks: { color: textColor } },
                      y: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor } }
                    },
                    plugins: {
                      legend: { position: 'top' as const, labels: { color: textColor, font: { size: 10 } } }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
