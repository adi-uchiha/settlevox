import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClickToTalk } from './pages/ClickToTalk';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardOverview } from './pages/DashboardOverview';
import { CallsList } from './pages/CallsList';
import { CallDetails } from './pages/CallDetails';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  // Theme is now managed by next-themes via ThemeProvider

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/demo" replace />} />
          <Route path="/demo" element={<Navigate to="/dashboard/demo" replace />} />
          
          {/* Dashboard Pages */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="calls" element={<CallsList />} />
            <Route path="calls/:id" element={<CallDetails />} />
            <Route path="demo" element={<ClickToTalk />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
