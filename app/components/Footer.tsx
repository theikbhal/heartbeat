"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 mb-4 md:mb-0">
            © 2024 Heartbeat. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/features" className="text-gray-600 hover:text-blue-600">
              Features
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-blue-600">
              Documentation
            </Link>
            <Link href="/lifetime" className="text-gray-600 hover:text-blue-600">
              Lifetime Deal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 