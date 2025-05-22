// Types for history operations
export interface NodeData {
  id: string;
  text: string;
  children: NodeData[];
  collapsed?: boolean;
  type?: 'check';
  checked?: boolean;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
  };
}

export type NodeOperation = 
  | { type: 'add'; nodeId: string; parentId: string; data: NodeData }
  | { type: 'delete'; nodeId: string; parentId: string; data: NodeData }
  | { type: 'edit'; nodeId: string; oldData: { text: string }; newData: { text: string } }
  | { type: 'move'; nodeId: string; oldParentId: string; newParentId: string; oldIndex: number; newIndex: number }
  | { type: 'group'; operation: 'start' | 'end' };

export interface HistoryEntry {
  operation: NodeOperation;
  timestamp: number;
  groupId?: string;
  groupEntries?: HistoryEntry[];
}

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private currentGroupId: string | undefined = undefined;
  private maxStackSize: number = 100;

  constructor(maxStackSize: number = 100) {
    this.maxStackSize = maxStackSize;
  }

  // Start a new operation group
  startGroup() {
    this.currentGroupId = Date.now().toString();
  }

  // End the current operation group
  endGroup() {
    this.currentGroupId = undefined;
  }

  // Push a new operation to the history
  push(operation: NodeOperation) {
    const entry: HistoryEntry = {
      operation,
      timestamp: Date.now(),
      groupId: this.currentGroupId
    };

    this.undoStack.push(entry);
    this.redoStack = []; // Clear redo stack when new operation is performed

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  // Undo the last operation
  undo(): HistoryEntry | null {
    if (this.undoStack.length === 0) return null;

    const entry = this.undoStack.pop()!;
    this.redoStack.push(entry);

    // If this was part of a group, undo all operations in the group
    if (entry.groupId) {
      const groupEntries: HistoryEntry[] = [];
      while (this.undoStack.length > 0) {
        const lastEntry = this.undoStack[this.undoStack.length - 1];
        if (lastEntry.groupId === entry.groupId) {
          groupEntries.push(this.undoStack.pop()!);
        } else {
          break;
        }
      }
      return { ...entry, groupEntries };
    }

    return entry;
  }

  // Redo the last undone operation
  redo(): HistoryEntry | null {
    if (this.redoStack.length === 0) return null;

    const entry = this.redoStack.pop()!;
    this.undoStack.push(entry);

    // If this was part of a group, redo all operations in the group
    if (entry.groupId) {
      const groupEntries: HistoryEntry[] = [];
      while (this.redoStack.length > 0) {
        const lastEntry = this.redoStack[this.redoStack.length - 1];
        if (lastEntry.groupId === entry.groupId) {
          groupEntries.push(this.redoStack.pop()!);
        } else {
          break;
        }
      }
      return { ...entry, groupEntries };
    }

    return entry;
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Get the current history state
  getState() {
    return {
      undoStack: this.undoStack,
      redoStack: this.redoStack,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  // Clear all history
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.currentGroupId = undefined;
  }
} 