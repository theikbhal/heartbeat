"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import React from "react";
import Image from "next/image";
import { HistoryManager, NodeData } from '../utils/HistoryManager';
import { NodeStyleControls } from '../components/NodeStyleControls';

const LOCAL_STORAGE_KEY = "mindmap-demo-tree";
const API_URL = "https://tawhid.in/tiny/heartbeat/api.php";
const API_FILENAME = "demo";

// Node type
type Node = NodeData;

// Update toast type
type ToastType = 'success' | 'info' | 'error';

// Update node operation type
type NodeOperation = {
  type: 'add' | 'delete' | 'edit' | 'move';
  nodeId: string;
  parentId?: string;
  data?: NodeData;
  oldData?: { text: string };
  newData?: { text: string };
  oldParentId?: string;
  newParentId?: string;
  oldIndex?: number;
  newIndex?: number;
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

// Update node operation functions with strict types
const addNode = (tree: Node, parentId: string, data: NodeData): Node => {
  if (tree.id === parentId) {
    return {
      ...tree,
      children: [...tree.children, data]
    };
  }
  return {
    ...tree,
    children: tree.children.map(child => addNode(child, parentId, data))
  };
};

const deleteNode = (tree: Node, nodeId: string): Node => {
  if (tree.id === nodeId) {
    throw new Error('Cannot delete root node');
  }
  return {
    ...tree,
    children: tree.children
      .filter(child => child.id !== nodeId)
      .map(child => deleteNode(child, nodeId))
  };
};

const editNode = (tree: Node, nodeId: string, newText: string): Node => {
  if (tree.id === nodeId) {
    return {
      ...tree,
      text: newText
    };
  }
  return {
    ...tree,
    children: tree.children.map(child => editNode(child, nodeId, newText))
  };
};

const moveNode = (tree: Node, nodeId: string, newParentId: string, newIndex: number): Node => {
  // Find the node to move
  const findNode = (node: Node): Node | null => {
    if (node.id === nodeId) return node;
    for (const child of node.children) {
      const found = findNode(child);
      if (found) return found;
    }
    return null;
  };

  const nodeToMove = findNode(tree);
  if (!nodeToMove) return tree;

  // Remove the node from its current position
  const removeNode = (node: Node): Node => {
    return {
      ...node,
      children: node.children
        .filter(child => child.id !== nodeId)
        .map(child => removeNode(child))
    };
  };

  // Add the node to its new position
  const addNodeToNewPosition = (node: Node): Node => {
    if (node.id === newParentId) {
      const newChildren = [...node.children];
      newChildren.splice(newIndex, 0, nodeToMove);
      return {
        ...node,
        children: newChildren
      };
    }
    return {
      ...node,
      children: node.children.map(child => addNodeToNewPosition(child))
    };
  };

  const removedTree = removeNode(tree);
  return addNodeToNewPosition(removedTree);
};

export default function DemoPage() {
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

  // Update handleUndo and handleRedo to use type guards
  const handleUndo = useCallback(() => {
    if (historyManager.canUndo()) {
      const entry = historyManager.undo();
      if (entry && tree) {
        setTree(prevTree => {
          if (!prevTree) return prevTree;
          try {
            switch (entry.operation.type) {
              case 'add':
                return deleteNode(prevTree, entry.operation.nodeId);
              case 'delete':
                if (entry.operation.parentId && entry.operation.data) {
                  return addNode(prevTree, entry.operation.parentId, entry.operation.data);
                }
                return prevTree;
              case 'edit':
                if (entry.operation.oldData) {
                  return editNode(prevTree, entry.operation.nodeId, entry.operation.oldData.text);
                }
                return prevTree;
              case 'move':
                if (entry.operation.oldParentId && entry.operation.oldIndex !== undefined) {
                  return moveNode(
                    prevTree,
                    entry.operation.nodeId,
                    entry.operation.oldParentId,
                    entry.operation.oldIndex
                  );
                }
                return prevTree;
              default:
                return prevTree;
            }
          } catch (error) {
            console.error('Error during undo:', error);
            return prevTree;
          }
        });
        setToast({ message: 'Undo successful', type: 'success' });
      }
    } else {
      setToast({ message: 'Nothing to undo', type: 'info' });
    }
  }, [historyManager, tree]);

  const handleRedo = useCallback(() => {
    if (historyManager.canRedo()) {
      const entry = historyManager.redo();
      if (entry && tree) {
        setTree(prevTree => {
          if (!prevTree) return prevTree;
          try {
            switch (entry.operation.type) {
              case 'add':
                if (entry.operation.parentId && entry.operation.data) {
                  return addNode(prevTree, entry.operation.parentId, entry.operation.data);
                }
                return prevTree;
              case 'delete':
                return deleteNode(prevTree, entry.operation.nodeId);
              case 'edit':
                if (entry.operation.newData) {
                  return editNode(prevTree, entry.operation.nodeId, entry.operation.newData.text);
                }
                return prevTree;
              case 'move':
                if (entry.operation.newParentId && entry.operation.newIndex !== undefined) {
                  return moveNode(
                    prevTree,
                    entry.operation.nodeId,
                    entry.operation.newParentId,
                    entry.operation.newIndex
                  );
                }
                return prevTree;
              default:
                return prevTree;
            }
          } catch (error) {
            console.error('Error during redo:', error);
            return prevTree;
          }
        });
        setToast({ message: 'Redo successful', type: 'success' });
      }
    } else {
      setToast({ message: 'Nothing to redo', type: 'info' });
    }
  }, [historyManager, tree]);

  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [expandedMap, setExpandedMap] = useState<{ [id: string]: boolean }>({});
  const inputRef = useRef<HTMLInputElement>(null);

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
    const flat = flattenTree(tree as Node);
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
    findPath(tree as Node, nodeId);
    return path;
  }

  // Helper: get path for a node
  function getNodePathText(nodeId: string): string {
    const path = getNodePath(nodeId);
    return path.map(n => n.text).join(' > ');
  }

  // Add selection helper functions
  const handleNodeSelect = (nodeId: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedId) {
      // Sequential selection
      const flat = flattenTree(tree as Node);
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

  // Update keyboard handler to use node operation functions
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (mode === "edit") return;
      
      // Add escape to clear selection
      if (e.key === "Escape") {
        if (selectedNodes.size > 1) {
          setSelectedNodes(new Set([selectedId]));
          setMode("command");
          return;
        }
        setMode("command");
        return;
      }

      // Handle copy/cut for multiple nodes
      if (e.key === "y" || e.key === "x") {
        e.preventDefault();
        if (!tree || selectedId === "root") return;
        
        if (selectedNodes.size > 1) {
          // Handle multiple nodes
          const nodes: Node[] = [];
          selectedNodes.forEach(id => {
            const found = findNodeById(tree as Node, id);
            if (found) {
              // Create a deep copy of the node
              const deepCopy = structuredClone(found.node);
              // Generate new IDs for the node and all its children
              function generateNewIds(node: Node) {
                node.id = generateId();
                node.children.forEach(generateNewIds);
              }
              generateNewIds(deepCopy);
              nodes.push(deepCopy);
            }
          });
          
          if (nodes.length > 0) {
            setClipboard({ 
              nodes: nodes.map(n => ({ ...n })),
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
          const found = findNodeById(tree as Node, selectedId);
          if (found) {
            // Create a deep copy of the node
            const deepCopy = structuredClone(found.node);
            // Generate new IDs for the node and all its children
            function generateNewIds(node: Node) {
              node.id = generateId();
              node.children.forEach(generateNewIds);
            }
            generateNewIds(deepCopy);
            
            setClipboard({ 
              nodes: [deepCopy],
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
                if (parent.children[idx - 1]) {
                  setSelectedId(parent.children[idx - 1].id);
                } else if (parent.children[idx]) {
                  setSelectedId(parent.children[idx].id);
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

      if (e.key === "i") {
        e.preventDefault();
        setMode("edit");
        const node = findNodeById(tree as Node, selectedId)?.node;
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
        const flat = flattenTree(tree as Node);
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
      if (e.key === "Tab" && !e.shiftKey) {
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
        return;
      }
      if (e.key === "Tab" && e.shiftKey) {
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
              found.parent.children.splice(idx + 1, 0, ...clipboard.nodes.map(n => ({ ...n })));
              setToast({ 
                message: `Pasted ${clipboard.nodes.length} nodes after: ${found.node.text}`, 
                type: 'success' 
              });
            }
          } else {
            // Paste as children of selected node
            found.node.children.push(...clipboard.nodes.map(n => ({ ...n })));
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
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedId, tree, search, zoomedNodeId, clipboard, selectedNodes, lastSelectedId, handleUndo, handleRedo]);

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

    // Apply node styles
    const nodeStyle = {
      background: node.style?.backgroundColor || (isSelected ? "#dbeafe" : match ? "#fef08a" : undefined),
      color: node.style?.textColor || "#111",
      fontSize: node.style?.fontSize ? `${node.style.fontSize}px` : undefined,
      fontWeight: node.style?.fontWeight || (isSelected ? "bold" : undefined),
      fontStyle: node.style?.fontStyle,
      border: node.style?.borderWidth ? `${node.style.borderWidth}px solid ${node.style.borderColor || '#000000'}` : (isSelected ? "2px solid #3b82f6" : undefined),
      borderRadius: node.style?.borderRadius ? `${node.style.borderRadius}px` : undefined,
      padding: node.style?.padding ? `${node.style.padding}px` : undefined,
    };

    return (
      <div key={node.id} style={{ marginLeft: 24, borderLeft: "1px dotted #ccc" }}>
        <div
          style={nodeStyle}
          onClick={(e) => handleNodeSelect(node.id, e)}
        >
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
              onClick={(e) => {
                e.stopPropagation();
                setZoomedNodeId(node.id);
              }}
              className="text-gray-400 hover:text-blue-600"
              title="Zoom in (z)"
            >
              🔍
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(node.id);
                setShowStyleControls(true);
              }}
              className="text-gray-400 hover:text-purple-600"
              title="Style node"
            >
              🎨
            </button>
          </div>
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

  // Helper to get node by id
  function getNodeById(node: Node, id: string): Node | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = getNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  // Add handleAddNode with history tracking
  const handleAddNode = (parentId: string) => {
    const newNode = {
      id: generateId(),
      text: 'New Node',
      children: []
    };

    setTree(prevTree => {
      if (!prevTree) return prevTree;
      const newTree = addNode(prevTree, parentId, newNode);
      if (newTree) {
        historyManager.push({
          type: 'add',
          nodeId: newNode.id,
          parentId,
          data: newNode
        });
      }
      return newTree || prevTree;
    });
  };

  // Add handleDeleteNode with history tracking
  const handleDeleteNode = (nodeId: string) => {
    setTree(prevTree => {
      if (!prevTree) return prevTree;
      const found = findNodeById(prevTree, nodeId);
      if (!found || !found.parent) return prevTree;

      const newTree = deleteNode(prevTree, nodeId);
      if (newTree) {
        historyManager.push({
          type: 'delete',
          nodeId,
          parentId: found.parent.id,
          data: found.node
        });
      }
      return newTree || prevTree;
    });
  };

  // Add handleEditNode with history tracking
  const handleEditNode = (nodeId: string, newText: string) => {
    setTree(prevTree => {
      if (!prevTree) return prevTree;
      const found = findNodeById(prevTree, nodeId);
      if (!found) return prevTree;

      const newTree = editNode(prevTree, nodeId, newText);
      if (newTree) {
        historyManager.push({
          type: 'edit',
          nodeId,
          oldData: { text: found.node.text },
          newData: { text: newText }
        });
      }
      return newTree || prevTree;
    });
  };

  // Add handleMoveNode with history tracking
  const handleMoveNode = (nodeId: string, newParentId: string, newIndex: number) => {
    setTree(prevTree => {
      if (!prevTree) return prevTree;
      const found = findNodeById(prevTree, nodeId);
      const newParent = findNodeById(prevTree, newParentId);
      if (!found || !found.parent || !newParent) return prevTree;

      const oldIndex = found.parent.children.findIndex(n => n.id === nodeId);
      const newTree = moveNode(prevTree, nodeId, newParentId, newIndex);
      if (newTree) {
        historyManager.push({
          type: 'move',
          nodeId,
          oldParentId: found.parent.id,
          newParentId,
          oldIndex,
          newIndex
        });
      }
      return newTree || prevTree;
    });
  };

  // Add style change handler
  const handleStyleChange = useCallback((nodeId: string, newStyle: NodeData['style']) => {
    setTree(prevTree => {
      if (!prevTree) return prevTree;
      const newTree = editNode(prevTree, nodeId, prevTree.text);
      if (!newTree) return prevTree;
      const updatedNode = findNodeById(newTree, nodeId);
      if (updatedNode) {
        updatedNode.node.style = newStyle;
      }
      return newTree;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mind Map Demo</h1>
          <div className="flex gap-4">
            <button
              onClick={handleUndo}
              disabled={!historyManager.canUndo()}
              className={`px-4 py-2 rounded-md ${
                historyManager.canUndo()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!historyManager.canRedo()}
              className={`px-4 py-2 rounded-md ${
                historyManager.canRedo()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Redo
            </button>
          </div>
        </div>
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
            ��
          </button>
          {showExport && <ExportModal tree={tree as Node} onClose={() => setShowExport(false)} />}
          {/* Import icon */}
          <button
            className="absolute top-4 right-28 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full w-8 h-8 flex items-center justify-center shadow"
            onClick={() => setShowImport(true)}
            aria-label="Import mindmap"
          >
            🖇
          </button>
          {showImport && <ImportModal onImport={setTree} onClose={() => setShowImport(false)} />}
          {showStyleControls && tree && (
            <NodeStyleControls
              node={findNodeById(tree, selectedId)?.node || tree}
              onStyleChange={(style) => handleStyleChange(selectedId, style)}
              onClose={() => setShowStyleControls(false)}
            />
          )}
          <h1 className="text-2xl font-bold mb-4 text-black">Mindmap Demo (Keyboard Driven)</h1>
          {selectedNodes.size > 1 && (
            <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-900 rounded">
              <b>Multiple nodes selected:</b> {selectedNodes.size} nodes
              <div className="text-sm mt-1">
                Use Shift+Click for sequential selection<br />
                Use Ctrl/Cmd+Click for random selection
              </div>
            </div>
          )}
          {renderBreadcrumb()}
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
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
          <div>{renderNode(zoomedNodeId ? getNodeById(tree as Node, zoomedNodeId)! : tree as Node)}</div>
          {search && <div className="mt-4 text-xs text-gray-500">Searching for: <b>{search}</b></div>}
        </div>
      </div>
    </div>
  );
} 