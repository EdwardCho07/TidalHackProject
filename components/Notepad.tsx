
import React from 'react';
import { Trash2, CheckSquare, Square } from 'lucide-react';
import { GroceryItem } from '../types';

interface NotepadProps {
  items: GroceryItem[];
  onClear: () => void;
  onToggle: (index: number) => void;
}

const Notepad: React.FC<NotepadProps> = ({ items, onClear, onToggle }) => {
  return (
    <div className="bg-yellow-50 text-gray-800 rounded-lg shadow-lg p-6 font-serif w-full max-w-md mx-auto relative">
      <div className="absolute top-0 left-0 w-full h-12 bg-transparent border-b-2 border-red-400"></div>
      <div className="flex justify-between items-center mb-4 pt-6">
        <h3 className="text-2xl font-bold text-gray-700">My Grocery List</h3>
        {items.length > 0 && (
          <button 
            onClick={onClear}
            className="text-gray-500 hover:text-red-600 transition-colors"
            aria-label="Clear list"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li 
              key={index} 
              className="border-b border-blue-200/50 py-2 text-lg capitalize flex items-center cursor-pointer group"
              onClick={() => onToggle(index)}
            >
              <div className="mr-3">
                {item.checked ? (
                  <CheckSquare className="w-6 h-6 text-fuchsia-600" />
                ) : (
                  <Square className="w-6 h-6 text-gray-400 group-hover:text-fuchsia-500" />
                )}
              </div>
              <span className={`${item.checked ? 'line-through text-gray-400' : 'text-gray-800'} transition-colors`}>
                {item.name}
              </span>
            </li>
          ))
        ) : (
          <p className="text-gray-500 py-8 text-center">Your list is empty. Upload an audio file to add items!</p>
        )}
      </ul>
    </div>
  );
};

export default Notepad;
