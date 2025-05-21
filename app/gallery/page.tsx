"use client";
import Link from "next/link";

// Placeholder data for public mindmaps
const publicMindmaps = [
  {
    id: "1",
    title: "My Mindmap",
    owner: "user1***@gmail.com",
  },
  {
    id: "2",
    title: "Project Ideas",
    owner: "jane***@example.com",
  },
  {
    id: "3",
    title: "Learning Plan",
    owner: "anon***@mail.com",
  },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Public Mindmap Gallery</h1>
        <p className="mb-6 text-gray-600">Browse public mindmaps created by Heartbeat users. Click any mindmap to view it in read-only mode.</p>
        <div className="grid gap-6">
          {publicMindmaps.map((map) => (
            <div key={map.id} className="bg-white rounded-lg shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-semibold text-gray-900">{map.title}</div>
                <div className="text-gray-500 text-sm">by {map.owner}</div>
              </div>
              <Link href={`/gallery/${map.id}`} className="mt-3 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center">
                View
              </Link>
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