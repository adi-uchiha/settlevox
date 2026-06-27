import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneCallIcon, ClockIcon, TimerIcon, CheckCircleIcon, TargetIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { API_BASE_URL } from '../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function DashboardOverview() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [stats, setStats] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    talkTimeMinutes: 0,
    timeSavedMinutes: 0,
    qualificationRate: 0,
    completionRate: 0,
    transferAnswerRate: 0,
  });

  useEffect(() => {
    let timeoutId: number | undefined;
    let currentDelay = 3000;
    let lastStatsStr = '';

    async function fetchStats() {
      try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
          const data = await response.json();
          const statsStr = JSON.stringify(data);
          
          if (statsStr === lastStatsStr) {
            // Stats did not change, back off polling interval (max 30s)
            currentDelay = Math.min(currentDelay + 3000, 30000);
          } else {
            // Reset to default on new data
            currentDelay = 3000;
            lastStatsStr = statsStr;
            setStats(data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      } finally {
        timeoutId = window.setTimeout(fetchStats, currentDelay);
      }
    }
    
    fetchStats();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const barChartData = {
    labels: ['Total Calls', 'Answered Calls'],
    datasets: [
      {
        label: 'Volume',
        data: [stats.totalCalls, stats.answeredCalls],
        backgroundColor: 'rgba(5, 98, 239, 0.8)', // Primary brand blue
        borderRadius: 4,
      },
    ],
  };

  const donutData = {
    labels: ['Qualified', 'Unqualified'],
    datasets: [
      {
        data: [
          Math.round(stats.totalCalls * (stats.qualificationRate / 100)) || 0, 
          stats.totalCalls - (Math.round(stats.totalCalls * (stats.qualificationRate / 100)) || 0)
        ],
        backgroundColor: [
          '#22c55e', // Qualified
          '#ef4444', // Unqualified
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: textColor }
      },
    },
    scales: {
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor }
      },
      x: {
        grid: { display: false },
        ticks: { color: textColor }
      }
    }
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: textColor }
      },
    },
    cutout: '70%',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium tracking-tight">SettleVox Demo — PI Intake AI</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor your AI voice agent's performance and lead qualification metrics.
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-secondary/50 py-1.5 px-3">
          Jun 24 – Jun 26, 2026
        </Badge>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <PhoneCallIcon size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls} <span className="text-sm font-normal text-muted-foreground">({stats.answeredCalls} ANSWERED)</span></div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/20">+100%</Badge> vs last period
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Talk Time</CardTitle>
            <ClockIcon size={20} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(stats.talkTimeMinutes / 60)}h {stats.talkTimeMinutes % 60}m</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <TimerIcon size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(stats.timeSavedMinutes / 60)}h {stats.timeSavedMinutes % 60}m</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20">+100%</Badge> paralegal hours saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Qualification Rate</CardTitle>
            <CheckCircleIcon size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualificationRate}%</div>
            <p className="text-xs mt-1">
              {stats.qualificationRate > 20 ? (
                <Badge className="bg-green-500/20 text-green-500">GOOD</Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-500">LOW</Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Intake Completion Rate</CardTitle>
            <TargetIcon size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reached WRAP_UP phase
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transfer Answer Rate</CardTitle>
            <UserCircleIcon size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transferAnswerRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.answeredCalls} connected / {stats.totalCalls - stats.answeredCalls} no answer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle>Call Volume Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border bg-card">
          <CardHeader>
            <CardTitle>Actions Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
