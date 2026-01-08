import Link from "next/link";
import { Button } from "@boxtrack/ui";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">BoxTrack</h1>
        <p className="text-xl text-gray-600 mb-8">
          Track storage boxes during moves with QR codes and location
          management
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
          <Link href="/api/health">
            <Button variant="secondary" size="lg">
              API Health
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold mb-2">Track Boxes</h3>
            <p className="text-gray-600 text-sm">
              Photograph contents and assign locations to each box
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2">QR Codes</h3>
            <p className="text-gray-600 text-sm">
              Generate labels with QR codes for instant identification
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Find Items</h3>
            <p className="text-gray-600 text-sm">
              Quickly locate any item across all your boxes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
