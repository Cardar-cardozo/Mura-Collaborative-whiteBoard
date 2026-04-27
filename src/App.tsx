/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Whiteboard from './components/Whiteboard';
import HomePage from './components/HomePage';

export default function App() {
  const [session, setSession] = useState<{ leaderName: string; groupName: string; count: number } | null>(null);

  if (!session) {
    return <HomePage onStart={setSession} />;
  }

  return (
    <main className="w-full h-screen">
      <Whiteboard groupName={session.groupName} leaderName={session.leaderName} />
    </main>
  );
}
