"use client";
import Link from "next/link";

export default function FeaturesPage() {
  const features = [
    {
      title: "Interactive Mindmap",
      description: "Create and edit nodes with keyboard shortcuts and mouse interactions",
      items: [
        "Add siblings (S key)",
        "Add children (C key)",
        "Edit nodes (I key)",
        "Delete nodes (D key)",
        "Toggle collapse (T key)",
        "Find nodes (F key)",
        "Navigate with arrow keys",
        "Indent node (Tab)",
        "Outdent node (Shift+Tab)"
      ]
    },
    {
      title: "Zoom & Navigation",
      description: "Easily navigate through your mindmap with zoom and breadcrumbs",
      items: [
        "Zoom into nodes (Z key)",
        "Breadcrumb navigation",
        "Click breadcrumbs to zoom out",
        "Visual hierarchy with indentation"
      ]
    },
    {
      title: "Search (Ctrl+K)",
      description: "Quickly find any node in your mindmap",
      items: [
        "Global search with Ctrl+K",
        "Real-time results",
        "Keyboard navigation in results",
        "Path display for each result",
        "Click to zoom to result"
      ]
    },
    {
      title: "Rich Content Support",
      description: "Add various types of content to your nodes",
      items: [
        "YouTube video embeds",
        "Image previews",
        "Clickable links",
        "Expandable video player",
        "Image gallery view"
      ]
    },
    {
      title: "Checklist Feature",
      description: "Convert any node into a checklist item",
      items: [
        "Toggle checklist mode (X key)",
        "Checkbox UI",
        "Strikethrough for completed items",
        "Slash commands (/check, /text)",
        "Visual completion status"
      ]
    },
    {
      title: "User Features",
      description: "Personal mindmap management",
      items: [
        "User authentication",
        "Persistent storage",
        "Personal mindmap per user",
        "Auto-save functionality",
        "Secure data handling"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Features</h1>
        <div className="grid gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{feature.title}</h2>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <ul className="list-disc list-inside space-y-2">
                {feature.items.map((item, itemIndex) => (
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