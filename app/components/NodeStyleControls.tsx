import React from 'react';
import { NodeData } from '../utils/HistoryManager';

type NodeStyle = NonNullable<NodeData['style']>;
type StyleProperty = keyof NodeStyle;

interface NodeStyleControlsProps {
  node: NodeData;
  onStyleChange: (style: NodeData['style']) => void;
  onClose: () => void;
}

export function NodeStyleControls({ node, onStyleChange, onClose }: NodeStyleControlsProps) {
  const [style, setStyle] = React.useState<NodeStyle>(node.style || {});

  const handleChange = (property: StyleProperty, value: NodeStyle[StyleProperty]) => {
    const newStyle = { ...style, [property]: value };
    setStyle(newStyle);
    onStyleChange(newStyle);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close style controls"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-black">Node Style</h2>
        
        <div className="space-y-4">
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <input
              type="color"
              value={style.backgroundColor || '#ffffff'}
              onChange={(e) => handleChange('backgroundColor', e.target.value as NodeStyle['backgroundColor'])}
              className="w-full h-8 rounded border"
            />
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <input
              type="color"
              value={style.textColor || '#000000'}
              onChange={(e) => handleChange('textColor', e.target.value as NodeStyle['textColor'])}
              className="w-full h-8 rounded border"
            />
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Size
            </label>
            <input
              type="number"
              value={style.fontSize || 14}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value) as NodeStyle['fontSize'])}
              className="w-full px-3 py-2 border rounded"
              min="8"
              max="72"
            />
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Weight
            </label>
            <select
              value={style.fontWeight || 'normal'}
              onChange={(e) => handleChange('fontWeight', e.target.value as NodeStyle['fontWeight'])}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>

          {/* Font Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Style
            </label>
            <select
              value={style.fontStyle || 'normal'}
              onChange={(e) => handleChange('fontStyle', e.target.value as NodeStyle['fontStyle'])}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Border Color
            </label>
            <input
              type="color"
              value={style.borderColor || '#000000'}
              onChange={(e) => handleChange('borderColor', e.target.value as NodeStyle['borderColor'])}
              className="w-full h-8 rounded border"
            />
          </div>

          {/* Border Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Border Width
            </label>
            <input
              type="number"
              value={style.borderWidth || 1}
              onChange={(e) => handleChange('borderWidth', parseInt(e.target.value) as NodeStyle['borderWidth'])}
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="10"
            />
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Border Radius
            </label>
            <input
              type="number"
              value={style.borderRadius || 4}
              onChange={(e) => handleChange('borderRadius', parseInt(e.target.value) as NodeStyle['borderRadius'])}
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="20"
            />
          </div>

          {/* Padding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Padding
            </label>
            <input
              type="number"
              value={style.padding || 8}
              onChange={(e) => handleChange('padding', parseInt(e.target.value) as NodeStyle['padding'])}
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="20"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              onStyleChange({});
              onClose();
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
} 