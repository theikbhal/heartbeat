"use client";
import { useState, useRef, useEffect } from "react";
import React from "react";

const LOCAL_STORAGE_KEY = "mindmap-demo-tree";
const API_URL = "https://tawhid.in/tiny/heartbeat/api.php";
const API_FILENAME = "demo";

// Node type
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
        </ul>
      </div>
    </div>
  );
}

function exportToMarkdown(node: Node, depth = 0): string {
  let md = `${"  ".repeat(depth)}- ${node.text}\n`;
  for (const child of node.children) {
    md += exportToMarkdown(child, depth + 1);
  }
  return md;
}

function exportToTabText(node: Node, depth = 0): string {
  let txt = `${"\t".repeat(depth)}${node.text}\n`;
  for (const child of node.children) {
    txt += exportToTabText(child, depth + 1);
  }
  return txt;
}

function ExportModal({ tree, onClose }: { tree: Node; onClose: () => void }) {
  const [tab, setTab] = useState<'json' | 'markdown' | 'tab'>('json');
  let content = '';
  if (tab === 'json') content = JSON.stringify(tree, null, 2);
  if (tab === 'markdown') content = exportToMarkdown(tree);
  if (tab === 'tab') content = exportToTabText(tree);

  function handleCopy() {
    navigator.clipboard.writeText(content);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close export"
        >×</button>
        <h2 className="text-xl font-bold mb-4 text-black">Export Mindmap</h2>
        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-1 rounded ${tab === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTab('json')}>JSON</button>
          <button className={`px-3 py-1 rounded ${tab === 'markdown' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTab('markdown')}>Markdown</button>
          <button className={`px-3 py-1 rounded ${tab === 'tab' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTab('tab')}>Tab-indented</button>
        </div>
        <textarea
          className="w-full h-64 border rounded p-2 text-xs font-mono mb-2 text-black"
          value={content}
          readOnly
        />
        <button onClick={handleCopy} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Copy</button>
      </div>
    </div>
  );
}

function parseTabText(text: string): Node {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const root: Node = { id: generateId(), text: lines[0]?.trim() || "Root", children: [] };
  const stack: { node: Node; depth: number }[] = [{ node: root, depth: 0 }];
  for (let i = 1; i < lines.length; ++i) {
    const line = lines[i];
    const depth = line.match(/^\t*/)?.[0].length || 0;
    const node: Node = { id: generateId(), text: line.trim(), children: [] };
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  }
  return root;
}

function ImportModal({ onImport, onClose }: { onImport: (tree: Node) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'json' | 'tab'>('json');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleImport() {
    try {
      let tree: Node;
      if (tab === 'json') {
        tree = JSON.parse(input);
      } else {
        tree = parseTabText(input);
      }
      onImport(tree);
      onClose();
    } catch {
      setError('Invalid input!');
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close import"
        >×</button>
        <h2 className="text-xl font-bold mb-4 text-black">Import Mindmap</h2>
        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-1 rounded ${tab === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTab('json')}>JSON</button>
          <button className={`px-3 py-1 rounded ${tab === 'tab' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTab('tab')}>Tab-indented</button>
        </div>
        <textarea
          className="w-full h-64 border rounded p-2 text-xs font-mono mb-2 text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={tab === 'json' ? '{ "id": ..., "text": ... }' : 'Root\n\tChild 1\n\tChild 2'}
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button onClick={handleImport} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Import</button>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [tree, setTree] = useState<Node>({
    id: "root",
    text: "Joke Video Creation",
    collapsed: false,
    children: [
      { id: generateId(), text: "1. Select joke reference image", children: [] },
      { id: generateId(), text: "2. Type joke text", children: [] },
      { id: generateId(), text: "3. Generate image (AI or meme tool)", children: [] },
      { id: generateId(), text: "4. Edit with Canva", collapsed: false, children: [
        { id: generateId(), text: "Add overlays", children: [] },
        { id: generateId(), text: "Add text effects", children: [] },
        { id: generateId(), text: "Export as video", children: [] },
      ] },
      { id: generateId(), text: "5. Add song (background music)", children: [] },
      { id: generateId(), text: "6. Upload to platform (YouTube, Instagram, etc.)", children: [] },
    ],
  });
  const [selectedId, setSelectedId] = useState<string>("root");
  const [zoomedNodeId, setZoomedNodeId] = useState<string | null>(null);
  const [mode, setMode] = useState<"command" | "edit">("command");
  const [editText, setEditText] = useState("");
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load from API on mount
  useEffect(() => {
    fetch(`${API_URL}?filename=${API_FILENAME}&action=get`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.id && data.text) {
          setTree(data);
        } else {
          // fallback to localStorage
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            try { setTree(JSON.parse(saved)); } catch {}
          }
        }
      })
      .catch(() => {
        // fallback to localStorage
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try { setTree(JSON.parse(saved)); } catch {}
        }
      });
  }, []);

  // Save to API and localStorage on every tree change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tree));
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: API_FILENAME, data: tree })
    });
  }, [tree]);

  // Focus input in edit mode
  useEffect(() => {
    if (mode === "edit" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, selectedId]);

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
    findPath(tree, nodeId);
    return path;
  }

  // Helper: get path for a node
  function getNodePathText(nodeId: string): string {
    const path = getNodePath(nodeId);
    return path.map(n => n.text).join(' > ');
  }

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (mode === "edit") return;
      if (e.key === "Escape") {
        setMode("command");
        return;
      }
      if (e.key === "i") {
        e.preventDefault(); // Prevent 'i' from being added to the node text
        setMode("edit");
        const node = findNodeById(tree, selectedId)?.node;
        setEditText(node?.text || "");
        return;
      }
      if (e.key === "s") {
        setTree((oldTree) => {
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
        const flat = flattenTree(tree);
        const idx = flat.findIndex((n) => n.id === selectedId);
        let nextIdx = idx;
        if (e.key === "ArrowDown" && idx < flat.length - 1) nextIdx = idx + 1;
        if (e.key === "ArrowUp" && idx > 0) nextIdx = idx - 1;
        setSelectedId(flat[nextIdx].id);
        return;
      }
      if (e.key === "d") {
        // Delete current node (except root)
        if (selectedId === "root") return;
        setTree((oldTree) => {
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

  // Render breadcrumb navigation
  function renderBreadcrumb() {
    if (!zoomedNodeId) return null;
    const path = getNodePath(zoomedNodeId);
    return (
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        {path.map((node, index) => (
          <React.Fragment key={node.id}>
            <button
              onClick={() => setZoomedNodeId(node.id)}
              className="hover:text-blue-600 hover:underline"
            >
              {node.text}
            </button>
            {index < path.length - 1 && <span>›</span>}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Render tree recursively
  function renderNode(node: Node) {
    const isSelected = node.id === selectedId;
    const match = search && node.text.toLowerCase().includes(search.toLowerCase());
    
    // If zoomed, only render the zoomed node and its descendants
    if (zoomedNodeId && !getNodePath(node.id).some(n => n.id === zoomedNodeId)) {
      return null;
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
                  if (found) found.node.text = editText;
                  return copy;
                });
                setMode("command");
              }}
              onKeyDown={e => {
                if (e.key === "Escape") {
                  setEditText(findNodeById(tree, selectedId)?.node.text || "");
                  setMode("command");
                } else if (e.key === "Enter") {
                  // Save and create sibling
                  setTree((oldTree) => {
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
                onClick={(e) => {
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

  // Helper to get node by id
  function getNodeById(node: Node, id: string): Node | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = getNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 relative">
        {/* Help icon */}
        <button
          className="absolute top-4 right-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center shadow"
          onClick={() => setShowHelp(true)}
          aria-label="Show help"
        >
          ?
        </button>
        {showHelp && <HelpCard onClose={() => setShowHelp(false)} />}
        {/* Export icon */}
        <button
          className="absolute top-4 right-16 bg-green-100 hover:bg-green-200 text-green-700 rounded-full w-8 h-8 flex items-center justify-center shadow"
          onClick={() => setShowExport(true)}
          aria-label="Export mindmap"
        >
          &#8681;
        </button>
        {showExport && <ExportModal tree={tree} onClose={() => setShowExport(false)} />}
        {/* Import icon */}
        <button
          className="absolute top-4 right-28 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full w-8 h-8 flex items-center justify-center shadow"
          onClick={() => setShowImport(true)}
          aria-label="Import mindmap"
        >
          &#8682;
        </button>
        {showImport && <ImportModal onImport={setTree} onClose={() => setShowImport(false)} />}
        <h1 className="text-2xl font-bold mb-4 text-black">Mindmap Demo (Keyboard Driven)</h1>
        {renderBreadcrumb()}
        {/* Search Modal/Dropdown */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-20">
            <div className="bg-white rounded-xl shadow-lg mt-32 w-full max-w-lg p-4">
              <input
                ref={searchInputRef}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full border px-4 py-2 rounded text-lg mb-2 text-black"
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
              <div className="text-xs text-gray-400 mt-2">Use ↑/↓ to navigate, Enter to zoom, Esc to close</div>
            </div>
          </div>
        )}
        <div>{renderNode(zoomedNodeId ? getNodeById(tree, zoomedNodeId)! : tree)}</div>
        {search && <div className="mt-4 text-xs text-gray-500">Searching for: <b>{search}</b></div>}
      </div>
    </div>
  );
} 