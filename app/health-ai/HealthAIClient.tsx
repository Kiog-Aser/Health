'use client';

import AppLayout from '../components/layout/AppLayout';
import HealthAI from '../components/HealthAI';

export default function HealthAIClient() {
  return (
    <AppLayout title="🧠 Health AI Assistant">
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">AI-Powered Health Knowledge</h1>
            <p className="text-base-content/60">
              Get instant answers to your health questions with evidence-based information
            </p>
          </div>
          
          <HealthAI />
        </div>
      </div>
    </AppLayout>
  );
} 