'use client';

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonText } from "@/components/ui/button";

export default function HomePage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runSupabaseTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      setTestResults({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-0 to-background-0">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold text-typography-900 mb-6">BoxTrack</h1>
        <p className="text-xl text-typography-600 mb-8">
          Track storage boxes during moves with QR codes and location
          management
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg">
              <ButtonText>Go to Dashboard</ButtonText>
            </Button>
          </Link>
          <Link href="/api/health">
            <Button action="secondary" size="lg">
              <ButtonText>API Health</ButtonText>
            </Button>
          </Link>
          <Button
            onClick={runSupabaseTest}
            action="secondary"
            size="lg"
            disabled={testing}
            isLoading={testing}
          >
            <ButtonText>{testing ? 'Testing...' : 'Test Supabase'}</ButtonText>
          </Button>
        </div>

        {testResults && (
          <div className="mt-8 p-6 bg-background-0 rounded-lg shadow-lg text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-bold mb-4 text-typography-900">
              Test Results: {testResults.status}
            </h3>
            <pre className="text-xs bg-background-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-background-0 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold mb-2 text-typography-900">Track Boxes</h3>
            <p className="text-typography-600 text-sm">
              Photograph contents and assign locations to each box
            </p>
          </div>

          <div className="p-6 bg-background-0 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2 text-typography-900">QR Codes</h3>
            <p className="text-typography-600 text-sm">
              Generate labels with QR codes for instant identification
            </p>
          </div>

          <div className="p-6 bg-background-0 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2 text-typography-900">Find Items</h3>
            <p className="text-typography-600 text-sm">
              Quickly locate any item across all your boxes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
