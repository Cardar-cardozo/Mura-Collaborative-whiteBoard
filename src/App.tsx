

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import JoinPage from './components/JoinPage';
import WorkspacePage from './app/workspace/WorkspacePage';
import MobileGuard from './components/MobileGuard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileGuard>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join/:boardId" element={<JoinPage />} />
            <Route path="/workspace/:boardId" element={<WorkspacePage />} />
          </Routes>
        </BrowserRouter>
      </MobileGuard>
    </QueryClientProvider>
  );
}
