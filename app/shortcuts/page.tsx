"use client";
import Link from "next/link";

const shortcuts = [
  { keys: "S", desc: "Add sibling node" },
  { keys: "C", desc: "Add child node" },
  { keys: "I", desc: "Edit current node" },
  { keys: "D", desc: "Delete current node" },
  { keys: "T", desc: "Toggle collapse/expand" },
  { keys: "F", desc: "Find nodes" },
  { keys: "Z", desc: "Zoom into current node" },
  { keys: "X", desc: "Toggle checklist mode" },
  { keys: "Tab", desc: "Indent node (make child of previous sibling)" },
  { keys: "Shift+Tab", desc: "Outdent node (make sibling of parent)" },
  { keys: "Arrow Up/Down", desc: "Navigate between nodes" },
  { keys: "Ctrl+K", desc: "Open search" },
  { keys: "Enter", desc: "Confirm edit or search result" },
  { keys: "Escape", desc: "Cancel edit or close search" },
];

export default function ShortcutsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Keyboard Shortcuts</h1>
        <p className="mb-6 text-gray-600">Boost your productivity with these keyboard shortcuts for Heartbeat mindmaps.</p>
        <table className="w-full bg-white rounded-lg shadow mb-8">
          <thead>
            <tr className="bg-blue-50">
              <th className="text-left px-4 py-2 text-blue-700">Shortcut</th>
              <th className="text-left px-4 py-2 text-blue-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2 font-mono text-lg">{s.keys}</td>
                <td className="px-4 py-2">{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 