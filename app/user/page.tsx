"use client";
import { useEffect, useState, useRef } from "react";
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

const API_URL = "https://tawhid.in/tiny/heartbeat/api.php";

export default function UserPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<Node | null>(null);
  const [selectedId, setSelectedId] = useState<string>("root");
  const [zoomedNodeId, setZoomedNodeId] = useState<string | null>(null);
  const [mode, setMode] = useState<"command" | "edit">("command");
  const [editText, setEditText] = useState("");
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to sanitize email for filename
  function emailToFilename(email: string) {
    return email.replace(/[^a-zA-Z0-9]/g, "_");
  }

  // Get path from root to a node
  function getNodePath(nodeId: string): Node[] {
    const path: Node[] = [];
    function findPath(currentNode: Node, targetId: string): boolean {
      if (currentNode.id === targetId) {
        path.push(currentNode);
        return true;
      }
      for (const child of currentNode.children) {
        if (findPath(child, targetId)) {
          path.unshift(currentNode);
          return true;
        }
      }
      return false;
    }
    if (tree) findPath(tree, nodeId);
    return path;
  }

  // Flatten tree for navigation
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

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

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

  // Focus input in edit mode
  useEffect(() => {
    if (mode === "edit" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, selectedId]);

  // Keyboard handler (same as demo)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (mode === "edit") return;
      if (e.key === "Escape") {
        setMode("command");
        return;
      }
      if (e.key === "i") {
        e.preventDefault();
        setMode("edit");
        const node = tree && findNodeById(tree, selectedId)?.node;
        setEditText(node?.text || "");
        return;
      }
      if (e.key === "s") {
        setTree((oldTree) => {
          if (!oldTree) return oldTree;
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (!found || !found.parent) return copy;
          const idx = found.parent.children.findIndex((n) => n.id === selectedId);
          found.parent.children.splice(idx + 1, 0, {
            id: generateId(),
            text: "New Sibling",
            children: [],
          });
          return copy;
        });
        return;
      }
      if (e.key === "c") {
        setTree((oldTree) => {
          if (!oldTree) return oldTree;
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (!found) return copy;
          found.node.children.push({
            id: generateId(),
            text: "New Child",
            children: [],
          });
          return copy;
        });
        return;
      }
      if (e.key === "t") {
        setTree((oldTree) => {
          if (!oldTree) return oldTree;
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (!found) return copy;
          found.node.collapsed = !found.node.collapsed;
          return copy;
        });
        return;
      }
      if (e.key === "f") {
        const term = prompt("Find:", search);
        if (term) setSearch(term);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!tree) return;
        const flat = flattenTree(tree);
        const idx = flat.findIndex((n) => n.id === selectedId);
        let nextIdx = idx;
        if (e.key === "ArrowDown" && idx < flat.length - 1) nextIdx = idx + 1;
        if (e.key === "ArrowUp" && idx > 0) nextIdx = idx - 1;
        setSelectedId(flat[nextIdx].id);
        return;
      }
      if (e.key === "d") {
        if (selectedId === "root") return;
        setTree((oldTree) => {
          if (!oldTree) return oldTree;
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (!found || !found.parent) return copy;
          const parent = found.parent;
          const idx = parent.children.findIndex((n) => n.id === selectedId);
          parent.children.splice(idx, 1);
          // Select previous sibling, next sibling, or parent
          if (parent.children[idx - 1]) {
            setSelectedId(parent.children[idx - 1].id);
          } else if (parent.children[idx]) {
            setSelectedId(parent.children[idx].id);
          } else {
            setSelectedId(parent.id);
          }
          return copy;
        });
        return;
      }
      if (e.key === "z") {
        e.preventDefault();
        if (zoomedNodeId) {
          setZoomedNodeId(null);
        } else {
          setZoomedNodeId(selectedId);
        }
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedId, tree, search, zoomedNodeId]);

  // Helper: find node by id
  function findNodeById(tree: Node, id: string, parent: Node | null = null): { node: Node; parent: Node | null } | null {
    if (tree.id === id) return { node: tree, parent };
    for (const child of tree.children) {
      const found = findNodeById(child, id, tree);
      if (found) return found;
    }
    return null;
  }

  // Render breadcrumb navigation
  function renderBreadcrumb() {
    if (!zoomedNodeId || !tree) return null;
    const path = getNodePath(zoomedNodeId);
    return (
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        {path.map((node, index) => (
          <span key={node.id}>
            <button
              onClick={() => setZoomedNodeId(node.id)}
              className="hover:text-blue-600 hover:underline"
            >
              {node.text}
            </button>
            {index < path.length - 1 && <span>›</span>}
          </span>
        ))}
      </div>
    );
  }

  // Render tree recursively
  function renderNode(node: Node) {
    const isSelected = node.id === selectedId;
    const match = search && node.text.toLowerCase().includes(search.toLowerCase());
    return (
      <div key={node.id} style={{ marginLeft: 24, borderLeft: "1px dotted #ccc" }}>
        <div
          style={{
            background: isSelected ? "#dbeafe" : match ? "#fef08a" : undefined,
            fontWeight: isSelected ? "bold" : undefined,
            color: "#111",
            padding: "2px 8px",
            borderRadius: 4,
            cursor: "pointer",
            display: "inline-block",
          }}
          onClick={() => setSelectedId(node.id)}
        >
          {mode === "edit" && isSelected ? (
            <input
              ref={inputRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="border px-2 py-1 rounded"
              style={{ color: "#111", fontWeight: "bold" }}
              onBlur={() => {
                setTree((oldTree) => {
                  if (!oldTree) return oldTree;
                  const copy = structuredClone(oldTree);
                  const found = findNodeById(copy, selectedId);
                  if (found) found.node.text = editText;
                  return copy;
                });
                setMode("command");
              }}
              onKeyDown={e => {
                if (e.key === "Escape") {
                  setEditText(findNodeById(tree!, selectedId)?.node.text || "");
                  setMode("command");
                } else if (e.key === "Enter") {
                  setTree((oldTree) => {
                    if (!oldTree) return oldTree;
                    const copy = structuredClone(oldTree);
                    const found = findNodeById(copy, selectedId);
                    if (found) found.node.text = editText;
                    // Add sibling
                    if (found && found.parent) {
                      const idx = found.parent.children.findIndex((n) => n.id === selectedId);
                      const newId = generateId();
                      found.parent.children.splice(idx + 1, 0, {
                        id: newId,
                        text: "New Sibling",
                        children: [],
                      });
                      setTimeout(() => {
                        setSelectedId(newId);
                        setEditText("New Sibling");
                        setMode("edit");
                      }, 0);
                    } else {
                      setMode("command");
                    }
                    return copy;
                  });
                }
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span>
                {node.text} {node.children.length > 0 && (
                  <span style={{ fontSize: 12, color: "#888" }}>
                    [{node.collapsed ? "+" : "-"}]
                  </span>
                )}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setZoomedNodeId(node.id);
                }}
                className="text-gray-400 hover:text-blue-600"
                title="Zoom in (z)"
              >
                🔍
              </button>
            </div>
          )}
        </div>
        {!node.collapsed && node.children.map(renderNode)}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="w-full bg-white shadow flex items-center justify-between px-8 py-4 mb-8">
        <div>
          <span className="text-xl font-bold text-gray-900 mr-4">Welcome, {user.name}!</span>
          <span className="text-gray-700">Email: {user.email}</span>
        </div>
        <button
          onClick={logout}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="bg-white p-6 rounded shadow max-w-2xl w-full">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Your Mindmap</h3>
          {renderBreadcrumb()}
          <div>{tree && renderNode(zoomedNodeId ? findNodeById(tree, zoomedNodeId)!.node : tree)}</div>
          {search && <div className="mt-4 text-xs text-gray-500">Searching for: <b>{search}</b></div>}
        </div>
      </div>
    </div>
  );
} 