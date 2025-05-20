"use client";
import { useState, useRef, useEffect } from "react";

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
  const [mode, setMode] = useState<"command" | "edit">("command");
  const [editText, setEditText] = useState("");
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Focus input in edit mode
  useEffect(() => {
    if (mode === "edit" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, selectedId]);

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (mode === "edit") return;
      if (e.key === "Escape") {
        setMode("command");
        return;
      }
      if (e.key === "i") {
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
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedId, tree, search]);


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
                  const copy = structuredClone(oldTree);
                  const found = findNodeById(copy, selectedId);
                  if (found) found.node.text = editText;
                  return copy;
                });
                setMode("command");
              }}
              onKeyDown={e => {
                if (e.key === "Escape") {
                  // Discard changes
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
                } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  // Save and move selection
                  setTree((oldTree) => {
                    const copy = structuredClone(oldTree);
                    const found = findNodeById(copy, selectedId);
                    if (found) found.node.text = editText;
                    return copy;
                  });
                  setMode("command");
                  // Move selection
                  const flat = flattenTree(tree);
                  const idx = flat.findIndex((n) => n.id === selectedId);
                  let nextIdx = idx;
                  if (e.key === "ArrowDown" && idx < flat.length - 1) nextIdx = idx + 1;
                  if (e.key === "ArrowUp" && idx > 0) nextIdx = idx - 1;
                  setSelectedId(flat[nextIdx].id);
                }
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <>
              {node.text} {node.children.length > 0 && (
                <span style={{ fontSize: 12, color: "#888" }}>
                  [{node.collapsed ? "+" : "-"}]
                </span>
              )}
            </>
          )}
        </div>
        {!node.collapsed && node.children.map(renderNode)}
      </div>
    );
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
        <h1 className="text-2xl font-bold mb-4 text-black">Mindmap Demo (Keyboard Driven)</h1>
        <div>{renderNode(tree)}</div>
        {search && <div className="mt-4 text-xs text-gray-500">Searching for: <b>{search}</b></div>}
      </div>
    </div>
  );
} 