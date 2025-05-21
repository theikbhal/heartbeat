"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

// Node type (copied from demo page)
type Node = {
  id: string;
  text: string;
  children: Node[];
  collapsed?: boolean;
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function findNodeById(tree: Node, id: string, parent: Node | null = null): { node: Node; parent: Node | null } | null {
  if (tree.id === id) return { node: tree, parent };
  for (const child of tree.children) {
    const found = findNodeById(child, id, tree);
    if (found) return found;
  }
  return null;
}

function flattenTree(tree: Node): Node[] {
  const result: Node[] = [];
  function traverse(node: Node) {
    result.push(node);
    if (!node.collapsed) {
      for (const child of node.children) traverse(child);
    }
  }
  traverse(tree);
  return result;
}

const API_URL = "https://tawhid.in/tiny/heartbeat/api.php";

export default function UserPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<Node | null>(null);
  const [selectedId, setSelectedId] = useState<string>("root");

  // Helper to sanitize email for filename
  function emailToFilename(email: string) {
    return email.replace(/[^a-zA-Z0-9]/g, "_");
  }

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user]);

  // Load mindmap for user
  useEffect(() => {
    if (!user) return;
    const filename = emailToFilename(user.email);
    fetch(`${API_URL}?filename=${filename}&action=get`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.id && data.text) {
          setTree(data);
        } else {
          // Default mindmap if none exists
          setTree({
            id: "root",
            text: "My Mindmap",
            collapsed: false,
            children: [
              { id: generateId(), text: "Welcome to Heartbeat!", children: [] },
              { id: generateId(), text: "You can edit this mindmap.", children: [] },
              { id: generateId(), text: "Add your own nodes!", children: [] },
            ],
          });
        }
      });
  }, [user]);

  // Save mindmap on every change
  useEffect(() => {
    if (!user || !tree) return;
    const filename = emailToFilename(user.email);
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, data: tree })
    });
  }, [tree, user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-md mx-auto text-center mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Welcome, {user.name}!</h2>
        <p className="mb-2 text-gray-700">Email: {user.email}</p>
        <button
          onClick={logout}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
      {/* Mindmap Section */}
      {tree && (
        <div className="bg-white p-6 rounded shadow max-w-2xl w-full">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Your Mindmap</h3>
          <div>
            {tree && renderNode(tree)}
          </div>
        </div>
      )}
    </div>
  );

  // Render tree recursively
  function renderNode(node: Node) {
    const isSelected = node.id === selectedId;
    return (
      <div key={node.id} style={{ marginLeft: 24, borderLeft: "1px dotted #ccc" }}>
        <div
          style={{
            background: isSelected ? "#dbeafe" : undefined,
            fontWeight: isSelected ? "bold" : undefined,
            color: "#111",
            padding: "2px 8px",
            borderRadius: 4,
            cursor: "pointer",
            display: "inline-block",
          }}
          onClick={() => setSelectedId(node.id)}
        >
          {node.text}
        </div>
        {!node.collapsed && node.children.map(renderNode)}
      </div>
    );
  }
} 