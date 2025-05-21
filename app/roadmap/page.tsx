"use client";
import Link from "next/link";

const roadmap = [
  {
    section: "Planned",
    items: [
      "Mobile app support (Android/iOS)",
      "Drag-and-drop node movement",
      "Shareable links for nodes and mindmaps",
      "Public mindmap gallery improvements",
      "Advanced export/import options",
      "Collaboration features",
      "Bug reporting and feedback system"
    ]
  },
  {
    section: "In Progress",
    items: [
      "Tab / Shift+Tab for node indentation/outdentation",
      "Move node to another place",
      "Search icon in top navigation",
      "Beta tester program page"
    ]
  },
  {
    section: "Completed",
    items: [
      "Zoom and breadcrumb navigation",
      "Checklist nodes and slash commands",
      "YouTube and image embed support",
      "User authentication and persistence",
      "Public mindmap gallery (MVP)",
      "Features and documentation pages"
    ]
  }
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Product Roadmap</h1>
        <p className="mb-8 text-gray-600">See what&apos;s planned, in progress, and already shipped for Heartbeat.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {roadmap.map((section) => (
            <div key={section.section} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-700">{section.section}</h2>
              <ul className="list-disc list-inside space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 