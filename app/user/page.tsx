"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import Footer from "../components/Footer";
import Image from "next/image";
import { HistoryManager, NodeData } from '../utils/HistoryManager';
import { NodeStyleControls } from '../components/NodeStyleControls';

// Update Node type to match NodeData
type Node = NodeData;

interface Mindmap {
  id: string;
  title: string;
  is_public: boolean;
  owner_name?: string;
}

// Add ToastType definition
type ToastType = 'success' | 'info' | 'error';

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
          <li><b>y</b>: Copy node</li>
          <li><b>x</b>: Cut node</li>
          <li><b>p</b>: Paste after node</li>
          <li><b>P</b>: Paste as child</li>
        </ul>
      </div>
    </div>
  );
}

// Add Toast component
function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`}>
      {message}
    </div>
  );
}

export default function UserPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<NodeData | null>(null);
  const [selectedId, setSelectedId] = useState<string>("root");
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set(["root"]));
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"command" | "edit">("command");
  const [editText, setEditText] = useState("");
  const [search, setSearch] = useState("");
  const [zoomedNodeId, setZoomedNodeId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{ nodes: NodeData[], operation: 'copy' | 'cut' } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const historyManager = useRef(new HistoryManager()).current;
  const [showStyleControls, setShowStyleControls] = useState(false);
  const [expandedMap, setExpandedMap] = useState<{ [id: string]: boolean }>({});
  const [showHelp, setShowHelp] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<NodeData[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [selectedMindmap, setSelectedMindmap] = useState<Mindmap | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [userPlan, setUserPlan] = useState<string>("free");
  const [showPublicMindmaps, setShowPublicMindmaps] = useState(false);
  const [publicMindmaps, setPublicMindmaps] = useState<Mindmap[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to sanitize email for filename
  function emailToFilename(email: string) {
    return email.replace(/[^a-zA-Z0-9]/g, "_");
  }

  // Get path from root to a node
  function getNodePath(nodeId: string): NodeData[] {
    const path: NodeData[] = [];
    function findPath(currentNode: NodeData, targetId: string): boolean {
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
  function flattenTree(tree: NodeData | null): NodeData[] {
    if (!tree) return [];
    const result: NodeData[] = [];
    function traverse(node: NodeData) {
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

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Load user plan
    fetch("/api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_user_plan",
        email: user
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.plan) {
          setUserPlan(data.plan);
        }
      })
      .catch((err) => {
        console.error("Error loading user plan:", err);
      });

    // Load user's mindmaps
    fetch("/api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_mindmaps",
        email: user
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.mindmaps) {
          setMindmaps(data.mindmaps);
        }
      })
      .catch((err) => {
        console.error("Error loading mindmaps:", err);
        setError("Failed to load mindmaps");
      });

    // Load public mindmaps
    fetch("/api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_public_mindmaps"
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.mindmaps) {
          setPublicMindmaps(data.mindmaps);
        }
      })
      .catch((err) => {
        console.error("Error loading public mindmaps:", err);
      });
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

        if (e.shiftKey) {
          // Sequential selection with Shift + Arrow
          const newSelection = new Set(selectedNodes);
          if (lastSelectedId) {
            const lastIdx = flat.findIndex(n => n.id === lastSelectedId);
            const start = Math.min(lastIdx, nextIdx);
            const end = Math.max(lastIdx, nextIdx);
            for (let i = start; i <= end; i++) {
              newSelection.add(flat[i].id);
            }
          } else {
            newSelection.add(flat[nextIdx].id);
          }
          setSelectedNodes(newSelection);
          setLastSelectedId(flat[nextIdx].id);
        } else {
          // Single selection
          setSelectedNodes(new Set([flat[nextIdx].id]));
          setLastSelectedId(flat[nextIdx].id);
        }
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
      if (e.key === "y" || e.key === "x") {
        e.preventDefault();
        if (!tree || selectedId === "root") return;
        
        if (selectedNodes.size > 1) {
          // Handle multiple nodes
          const nodes: NodeData[] = [];
          selectedNodes.forEach(id => {
            const found = findNodeById(tree, id);
            if (found) {
              // Create a deep copy of the node
              const deepCopy = structuredClone(found.node);
              // Generate new IDs for the node and all its children
              function generateNewIds(node: NodeData) {
                node.id = generateId();
                node.children.forEach(generateNewIds);
              }
              generateNewIds(deepCopy);
              nodes.push(deepCopy);
            }
          });
          
          if (nodes.length > 0) {
            setClipboard({ 
              nodes: nodes, // Store array of nodes instead of a single node
              operation: e.key === 'y' ? 'copy' : 'cut' 
            });
            
            setToast({ 
              message: e.key === 'y' 
                ? `Copied ${nodes.length} nodes` 
                : `Cut ${nodes.length} nodes`, 
              type: 'success' 
            });
            
            if (e.key === 'x') {
              // Remove all selected nodes
              setTree(oldTree => {
                if (!oldTree) return oldTree;
                const copy = structuredClone(oldTree);
                selectedNodes.forEach(id => {
                  const found = findNodeById(copy, id);
                  if (found && found.parent) {
                    const idx = found.parent.children.findIndex(n => n.id === id);
                    if (idx !== -1) {
                      found.parent.children.splice(idx, 1);
                    }
                  }
                });
                return copy;
              });
              setSelectedNodes(new Set());
            }
          }
        } else {
          // Handle single node
          const found = findNodeById(tree, selectedId);
          if (found) {
            // Create a deep copy of the node
            const deepCopy = structuredClone(found.node);
            // Generate new IDs for the node and all its children
            function generateNewIds(node: NodeData) {
              node.id = generateId();
              node.children.forEach(generateNewIds);
            }
            generateNewIds(deepCopy);
            
            setClipboard({ 
              nodes: [deepCopy], // Store as array for consistency
              operation: e.key === 'y' ? 'copy' : 'cut' 
            });
            
            setToast({ 
              message: e.key === 'y' 
                ? `Copied: ${found.node.text}` 
                : `Cut: ${found.node.text}`, 
              type: 'success' 
            });
            
            if (e.key === 'x') {
              setTree(oldTree => {
                if (!oldTree) return oldTree;
                const copy = structuredClone(oldTree);
                const found = findNodeById(copy, selectedId);
                if (!found || !found.parent) return copy;
                const parent = found.parent;
                const idx = parent.children.findIndex((n) => n.id === selectedId);
                parent.children.splice(idx, 1);
                if (parent.children[idx]) {
                  setSelectedId(parent.children[idx].id);
                } else if (parent.children[idx - 1]) {
                  setSelectedId(parent.children[idx - 1].id);
                } else {
                  setSelectedId(parent.id);
                }
                return copy;
              });
            }
          }
        }
        return;
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        if (!tree || !clipboard) return;
        
        setTree(oldTree => {
          if (!oldTree) return oldTree;
          const copy = structuredClone(oldTree);
          const found = findNodeById(copy, selectedId);
          if (!found) return copy;
          
          if (e.key === "p") {
            // Paste after selected node
            if (found.parent) {
              const idx = found.parent.children.findIndex((n) => n.id === selectedId);
              // Insert all nodes after the selected node
              found.parent.children.splice(idx + 1, 0, ...clipboard.nodes);
              setToast({ 
                message: `Pasted ${clipboard.nodes.length} nodes after: ${found.node.text}`, 
                type: 'success' 
              });
            }
          } else {
            // Paste as children of selected node
            found.node.children.push(...clipboard.nodes);
            setToast({ 
              message: `Pasted ${clipboard.nodes.length} nodes as children of: ${found.node.text}`, 
              type: 'success' 
            });
          }
          
          // If it was a cut operation, clear the clipboard
          if (clipboard.operation === 'cut') {
            setClipboard(null);
            setToast({ message: 'Cut operation completed', type: 'info' });
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
  }, [mode, selectedId, tree, search, zoomedNodeId, clipboard, selectedNodes, lastSelectedId]);

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

  // Add selection helper functions
  const handleNodeSelect = (nodeId: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedId) {
      // Sequential selection
      const flat = flattenTree(tree);
      const lastIdx = flat.findIndex(n => n.id === lastSelectedId);
      const currentIdx = flat.findIndex(n => n.id === nodeId);
      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx);
        const end = Math.max(lastIdx, currentIdx);
        const newSelection = new Set(selectedNodes);
        for (let i = start; i <= end; i++) {
          newSelection.add(flat[i].id);
        }
        setSelectedNodes(newSelection);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Random selection
      const newSelection = new Set(selectedNodes);
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId);
      } else {
        newSelection.add(nodeId);
      }
      setSelectedNodes(newSelection);
    } else {
      // Single selection
      setSelectedNodes(new Set([nodeId]));
    }
    setLastSelectedId(nodeId);
    setSelectedId(nodeId);
  };

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
  function renderNode(node: NodeData) {
    const isSelected = selectedNodes.has(node.id);
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
            border: isSelected ? "2px solid #3b82f6" : undefined,
          }}
          onClick={(e) => handleNodeSelect(node.id, e)}
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

  // Add handleStyleChange function
  const handleStyleChange = (nodeId: string, newStyle: NodeData['style']) => {
    setTree(prevTree => {
      if (!prevTree) return prevTree;
      const copy = structuredClone(prevTree);
      const found = findNodeById(copy, nodeId);
      if (found) {
        found.node.style = newStyle;
      }
      return copy;
    });
  };

  // Add getNodeById function
  function getNodeById(node: NodeData, id: string): NodeData | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = getNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Heartbeat</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-sm text-gray-500">Plan: </span>
                <span className="text-sm font-medium text-gray-900">
                  {userPlan === "premium" ? "Premium" : "Free"}
                </span>
              </div>
              <button
                onClick={logout}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Mindmaps</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPublicMindmaps(!showPublicMindmaps)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {showPublicMindmaps ? "Show My Mindmaps" : "Show Public Mindmaps"}
              </button>
              <button
                onClick={() => {
                  setSelectedMindmap(null);
                  setIsEditing(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                New Mindmap
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {showPublicMindmaps ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicMindmaps.map((mindmap) => (
                <div
                  key={mindmap.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {mindmap.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      By {mindmap.owner_name}
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setSelectedMindmap(mindmap);
                          setIsEditing(false);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mindmaps.map((mindmap) => (
                <div
                  key={mindmap.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {mindmap.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {mindmap.is_public ? "Public" : "Private"}
                    </p>
                    <div className="mt-4 space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMindmap(mindmap);
                          setIsEditing(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          // Implement delete logic
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedMindmap && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isEditing ? "Edit Mindmap" : "View Mindmap"}
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={selectedMindmap.title}
                  onChange={(e) =>
                    setSelectedMindmap({
                      ...selectedMindmap,
                      title: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {isEditing && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMindmap.is_public}
                      onChange={(e) =>
                        setSelectedMindmap({
                          ...selectedMindmap,
                          is_public: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Make this mindmap public
                    </span>
                  </label>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedMindmap(null);
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                {isEditing && (
                  <button
                    onClick={() => {
                      setIsSaving(true);
                      // Implement save logic
                      setIsSaving(false);
                    }}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelp && <HelpCard onClose={() => setShowHelp(false)} />}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {showStyleControls && tree && (
        <NodeStyleControls
          node={findNodeById(tree, selectedId)?.node || tree}
          onStyleChange={(style) => handleStyleChange(selectedId, style)}
          onClose={() => setShowStyleControls(false)}
        />
      )}

      {renderBreadcrumb()}
      {renderNode(zoomedNodeId && tree ? getNodeById(tree, zoomedNodeId) || tree : tree!)}
    </div>
  );
} 