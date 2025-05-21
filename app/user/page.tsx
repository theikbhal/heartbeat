"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import Footer from "../components/Footer";
import Image from "next/image";

// Node type (copied from demo page)
type Node = {
  id: string;
  text: string;
  children: Node[];
  collapsed?: boolean;
  type?: 'check';
  checked?: boolean;
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const API_URL = "https://tawhid.in/tiny/heartbeat/api.php";

// Helper: extract YouTube video ID from any link
function getYouTubeId(url: string): string | null {
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)?)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper: check if string is a URL
function isUrl(text: string): boolean {
  return /^(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+/.test(text);
}

// Helper: check if string is an image link
function isImageUrl(text: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(text);
}

// Move findNodeById outside the component
function findNodeById(tree: Node | null, id: string, parent: Node | null = null): { node: Node; parent: Node | null } | null {
  if (!tree) return null;
  if (tree.id === id) return { node: tree, parent };
  for (const child of tree.children) {
    const found = findNodeById(child, id, tree);
    if (found) return found;
  }
  return null;
}

function HelpCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close help"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-black">Keyboard Shortcuts</h2>
        <ul className="mb-2 text-sm text-gray-700">
          <li><b>esc</b>: Command mode (cancel edit)</li>
          <li><b>i</b>: Edit node</li>
          <li><b>s</b>: Add sibling</li>
          <li><b>c</b>: Add child</li>
          <li><b>t</b>: Toggle collapse/expand</li>
          <li><b>f</b>: Find</li>
          <li><b>Arrow Up/Down</b>: Traverse nodes</li>
          <li><b>Enter (in edit)</b>: Save & add sibling</li>
          <li><b>d</b>: Delete current node</li>
          <li><b>Tab</b>: Make child of previous sibling</li>
          <li><b>Shift+Tab</b>: Move up one level</li>
        </ul>
      </div>
    </div>
  );
}

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [expandedMap, setExpandedMap] = useState<{ [id: string]: boolean }>({});
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);

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
  function flattenTree(tree: Node | null): Node[] {
    if (!tree) return [];
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

  // Helper: get path for a node
  function getNodePathText(nodeId: string): string {
    if (!tree) return '';
    const path = getNodePath(nodeId);
    return path.map(n => n.text).join(' > ');
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
        const node = findNodeById(tree, selectedId)?.node;
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
      if (e.key === "x") {
        setTree(oldTree => {
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (found) {
            if (found.node.type === 'check') {
              delete found.node.type;
              delete found.node.checked;
            } else {
              found.node.type = 'check';
              found.node.checked = false;
            }
          }
          return copy;
        });
        return;
      }
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        setTree((oldTree) => {
          if (!oldTree) return oldTree;
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (!found || !found.parent) return copy;
          const parent = found.parent;
          const idx = parent.children.findIndex((n) => n.id === selectedId);
          if (idx > 0) {
            // Remove from parent
            const [node] = parent.children.splice(idx, 1);
            // Add as last child of previous sibling
            parent.children[idx - 1].children.push(node);
          }
          return copy;
        });
        return;
      }
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        setTree((oldTree) => {
          if (!oldTree) return oldTree;
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (!found || !found.parent) return copy;
          const parent = found.parent;
          const grand = findNodeById(copy, parent.id)?.parent;
          if (!grand) return copy; // already at root
          // Remove from parent
          const idx = parent.children.findIndex((n) => n.id === selectedId);
          const [node] = parent.children.splice(idx, 1);
          // Insert after parent in grandparent's children
          const parentIdx = grand.children.findIndex((n) => n.id === parent.id);
          grand.children.splice(parentIdx + 1, 0, node);
          return copy;
        });
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedId, tree, search, zoomedNodeId, findNodeById]);

  // Ctrl+K to open search
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (searchOpen) {
        if (e.key === "Escape") {
          setSearchOpen(false);
          setSearchInput("");
          setSearchResults([]);
        }
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [searchOpen]);

  // Search logic
  useEffect(() => {
    if (!searchOpen || !tree) return;
    if (!searchInput) {
      setSearchResults([]);
      setSearchIndex(0);
      return;
    }
    // Flatten tree and filter
    const flat = flattenTree(tree);
    const results = flat.filter(n => n.text.toLowerCase().includes(searchInput.toLowerCase()));
    setSearchResults(results);
    setSearchIndex(0);
  }, [searchInput, searchOpen, tree]);

  // Keyboard navigation in search dropdown
  useEffect(() => {
    if (!searchOpen) return;
    function handleSearchKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        setSearchIndex(i => Math.min(i + 1, searchResults.length - 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setSearchIndex(i => Math.max(i - 1, 0));
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (searchResults[searchIndex]) {
          setZoomedNodeId(searchResults[searchIndex].id);
          setSelectedId(searchResults[searchIndex].id);
          setSearchOpen(false);
          setSearchInput("");
          setSearchResults([]);
        }
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchInput("");
        setSearchResults([]);
      }
    }
    window.addEventListener("keydown", handleSearchKey);
    return () => window.removeEventListener("keydown", handleSearchKey);
  }, [searchOpen, searchResults, searchIndex]);

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
    const youtubeId = getYouTubeId(node.text);
    const expanded = expandedMap[node.id] || false;
    // Render node content
    let nodeContent: React.ReactNode = node.text;
    if (node.type === 'check') {
      nodeContent = (
        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={!!node.checked}
            onChange={e => {
              setTree(oldTree => {
                const copy = structuredClone(oldTree);
                const found = findNodeById(copy, node.id);
                if (found) found.node.checked = e.target.checked;
                return copy;
              });
            }}
          />
          <span className={node.checked ? 'line-through text-gray-400' : ''}>{node.text}</span>
        </label>
      );
    } else if (youtubeId) {
      nodeContent = (
        <>
          <span>{node.text}</span>
        </>
      );
    } else if (isImageUrl(node.text) && isUrl(node.text)) {
      nodeContent = (
        <a href={node.text} target="_blank" rel="noopener noreferrer">
          <Image src={node.text} alt="node-img" width={300} height={200} style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8, display: 'block', margin: '4px 0' }} />
        </a>
      );
    } else if (isUrl(node.text)) {
      nodeContent = (
        <a href={node.text} target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-800">
          {node.text}
        </a>
      );
    }
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
                  const copy = structuredClone(oldTree);
                  const found = findNodeById(copy, selectedId);
                  if (found) {
                    // Slash command: /check or /text
                    if (editText.startsWith('/check')) {
                      found.node.type = 'check';
                      found.node.checked = false;
                      found.node.text = editText.replace(/^\/check\s*/, '');
                    } else if (editText.startsWith('/text')) {
                      delete found.node.type;
                      delete found.node.checked;
                      found.node.text = editText.replace(/^\/text\s*/, '');
                    } else {
                      found.node.text = editText;
                    }
                  }
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
                    const copy = structuredClone(oldTree);
                    const found = findNodeById(copy, selectedId);
                    if (found) {
                      // Slash command: /check or /text
                      if (editText.startsWith('/check')) {
                        found.node.type = 'check';
                        found.node.checked = false;
                        found.node.text = editText.replace(/^\/check\s*/, '');
                      } else if (editText.startsWith('/text')) {
                        delete found.node.type;
                        delete found.node.checked;
                        found.node.text = editText.replace(/^\/text\s*/, '');
                      } else {
                        found.node.text = editText;
                      }
                    }
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
                } else if (e.key === "Tab" && !e.shiftKey) {
                  e.preventDefault();
                  setTree((oldTree) => {
                    const copy = structuredClone(oldTree);
                    const found = findNodeById(copy, selectedId);
                    if (!found || !found.parent) return copy;
                    const parent = found.parent;
                    const idx = parent.children.findIndex((n) => n.id === selectedId);
                    if (idx > 0) {
                      // Remove from parent
                      const [node] = parent.children.splice(idx, 1);
                      // Add as last child of previous sibling
                      parent.children[idx - 1].children.push(node);
                    }
                    return copy;
                  });
                } else if (e.key === "Tab" && e.shiftKey) {
                  e.preventDefault();
                  setTree((oldTree) => {
                    const copy = structuredClone(oldTree);
                    const found = findNodeById(copy, selectedId);
                    if (!found || !found.parent) return copy;
                    const parent = found.parent;
                    const grand = findNodeById(copy, parent.id)?.parent;
                    if (!grand) return copy; // already at root
                    // Remove from parent
                    const idx = parent.children.findIndex((n) => n.id === selectedId);
                    const [node] = parent.children.splice(idx, 1);
                    // Insert after parent in grandparent's children
                    const parentIdx = grand.children.findIndex((n) => n.id === parent.id);
                    grand.children.splice(parentIdx + 1, 0, node);
                    return copy;
                  });
                }
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span>
                {nodeContent} {node.children.length > 0 && (
                  <span style={{ fontSize: 12, color: "#888" }}>
                    [{node.collapsed ? "+" : "-"}]
                  </span>
                )}
              </span>
              <button
                className="text-xs text-gray-400 hover:text-green-600 border border-gray-200 rounded px-1"
                title="Toggle checklist"
                onClick={e => {
                  e.stopPropagation();
                  setTree(oldTree => {
                    const copy = structuredClone(oldTree);
                    const found = findNodeById(copy, node.id);
                    if (found) {
                      if (found.node.type === 'check') {
                        delete found.node.type;
                        delete found.node.checked;
                      } else {
                        found.node.type = 'check';
                        found.node.checked = false;
                      }
                    }
                    return copy;
                  });
                }}
              >
                ☑️
              </button>
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
        {youtubeId && (
          <div className="mt-2">
            <iframe
              width={expanded ? "80%" : 200}
              height={expanded ? "400" : 200}
              style={{ maxWidth: expanded ? "100%" : 200, display: "block", margin: "0 auto" }}
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <button
              className="mt-1 text-xs text-blue-600 underline"
              onClick={() => setExpandedMap(m => ({ ...m, [node.id]: !expanded }))}
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        )}
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
      {/* Public Notice for Free Users */}
      <div className="max-w-2xl mx-auto mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 rounded">
        <b>Notice:</b> Free user mindmaps are <b>public</b>. Upgrade for private mindmaps.
      </div>
      {/* Help icon */}
      <button
        className="absolute top-4 right-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center shadow"
        onClick={() => setShowHelp(true)}
        aria-label="Show help"
      >
        ?
      </button>
      {showHelp && <HelpCard onClose={() => setShowHelp(false)} />}
      {/* Search icon */}
      <button
        className="absolute top-4 right-16 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center shadow"
        onClick={() => {
          setSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }}
        aria-label="Search nodes"
      >
        🔍
      </button>
      {/* Export icon */}
      <button
        className="absolute top-4 right-28 bg-green-100 hover:bg-green-200 text-green-700 rounded-full w-8 h-8 flex items-center justify-center shadow"
        onClick={() => setShowExport(true)}
        aria-label="Export mindmap"
      >
        &#8681;
      </button>
      {/* Search Modal/Dropdown */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-20">
          <div className="bg-white rounded-xl shadow-lg mt-32 w-full max-w-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={searchInputRef}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="flex-1 border px-4 py-2 rounded text-lg text-black"
                placeholder="Search nodes..."
                onKeyDown={e => {
                  if (e.key === "Enter" && searchResults[searchIndex]) {
                    setZoomedNodeId(searchResults[searchIndex].id);
                    setSelectedId(searchResults[searchIndex].id);
                    setSearchOpen(false);
                    setSearchInput("");
                    setSearchResults([]);
                  } else if (e.key === "ArrowDown") {
                    setSearchIndex(i => Math.min(i + 1, searchResults.length - 1));
                    e.preventDefault();
                  } else if (e.key === "ArrowUp") {
                    setSearchIndex(i => Math.max(i - 1, 0));
                    e.preventDefault();
                  } else if (e.key === "Escape") {
                    setSearchOpen(false);
                    setSearchInput("");
                    setSearchResults([]);
                  }
                  e.stopPropagation();
                }}
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchInput("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searchResults.length === 0 && searchInput && (
                <div className="text-gray-400 px-2 py-1">No results</div>
              )}
              {searchResults.map((node, i) => (
                <div
                  key={node.id}
                  className={`px-3 py-2 rounded cursor-pointer text-gray-900 ${i === searchIndex ? "bg-blue-100 text-black" : "hover:bg-gray-100"}`}
                  onMouseDown={() => {
                    setZoomedNodeId(node.id);
                    setSelectedId(node.id);
                    setSearchOpen(false);
                    setSearchInput("");
                    setSearchResults([]);
                  }}
                >
                  <span className="block text-xs text-gray-500 mb-1">{getNodePathText(node.id)}</span>
                  <span className="block font-medium">{node.text}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-2">Use ↑/↓ to navigate, Enter to select, Esc to close</div>
          </div>
        </div>
      )}
      {/* Mindmap Section */}
      <div className="flex flex-col items-center">
        <div className="bg-white p-6 rounded shadow max-w-2xl w-full">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Your Mindmap</h3>
          {renderBreadcrumb()}
          <div>{tree && renderNode(zoomedNodeId ? findNodeById(tree, zoomedNodeId)!.node : tree)}</div>
          {search && <div className="mt-4 text-xs text-gray-500">Searching for: <b>{search}</b></div>}
        </div>
      </div>
      <Footer />
    </div>
  );
} 