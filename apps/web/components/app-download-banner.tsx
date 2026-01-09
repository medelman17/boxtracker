"use client";

import { useState, useEffect } from "react";

type AppDownloadBannerProps = {
  deepLink: string;
  message?: string;
};

export function AppDownloadBanner({ deepLink: _deepLink, message }: AppDownloadBannerProps) {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    }
  }, []);

  if (platform === "desktop" || dismissed) {
    return null;
  }

  // TODO: Replace with actual App Store/Play Store URLs when published
  const storeLink =
    platform === "ios"
      ? "https://apps.apple.com/app/boxtrack/id000000000"
      : "https://play.google.com/store/apps/details?id=com.boxtrack.app";

  return (
    <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium">
          {message ?? "Get the BoxTrack app for the best experience"}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <a
          href={storeLink}
          className="bg-white text-primary-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          Get App
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white p-1"
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
