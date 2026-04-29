/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import JoinPage from './components/JoinPage';
import WorkspacePage from './app/workspace/WorkspacePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join/:boardId" element={<JoinPage />} />
        <Route path="/workspace/:boardId" element={<WorkspacePage />} />
      </Routes>
    </BrowserRouter>
  );
}
