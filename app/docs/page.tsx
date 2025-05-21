"use client";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      content: [
        "Create an account or use the demo to try out the mindmap",
        "Your mindmap is automatically saved as you make changes",
        "Use keyboard shortcuts for quick navigation and editing",
        "Try the search feature (Ctrl+K) to find nodes quickly"
      ]
    },
    {
      title: "Keyboard Shortcuts",
      content: [
        "S - Add a sibling node",
        "C - Add a child node",
        "I - Edit current node",
        "D - Delete current node",
        "T - Toggle collapse/expand",
        "F - Find nodes",
        "Z - Zoom into current node",
        "X - Toggle checklist mode",
        "Arrow keys - Navigate between nodes",
        "Ctrl+K - Open search",
        "Enter - Confirm edit or search result",
        "Escape - Cancel edit or close search"
      ]
    },
    {
      title: "Node Types",
      content: [
        "Text nodes - Regular text content",
        "Checklist nodes - Toggle with X key or /check command",
        "Link nodes - Automatically detected URLs",
        "Image nodes - Automatically previewed images",
        "YouTube nodes - Embedded video players"
      ]
    },
    {
      title: "Slash Commands",
      content: [
        "/check - Convert node to checklist",
        "/text - Convert checklist back to text"
      ]
    },
    {
      title: "Search Tips",
      content: [
        "Press Ctrl+K to open search",
        "Type to filter nodes in real-time",
        "Use arrow keys to navigate results",
        "Press Enter to zoom to selected result",
        "See the full path to each result"
      ]
    },
    {
      title: "Content Tips",
      content: [
        "Paste YouTube links to create video embeds",
        "Paste image URLs to create image previews",
        "Paste any URL to create clickable links",
        "Click the expand button on videos to view larger",
        "Images are automatically sized and clickable"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Documentation</h1>
        <div className="grid gap-8">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
              <ul className="list-disc list-inside space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700">{item}</li>
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