import React, { useState } from 'react';
import { ActionItem } from '../types';
import { Plus, Edit2, Trash2, CheckSquare, Check, Calendar } from 'lucide-react';
import { Modal } from './ui/Modal';
import { InputGroup, inputClasses } from './ui/InputGroup';

interface ActionItemsProps {
  actionItems: ActionItem[];
  updateActionItems: (items: ActionItem[]) => void;
}

export const ActionItemsSection: React.FC<ActionItemsProps> = ({ actionItems, updateActionItems }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [formData, setFormData] = useState<Partial<ActionItem>>({ 
    title: '', dueDate: '', status: 'pending', priority: 'medium', assignee: '' 
  });

  const handleEdit = (item: ActionItem) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this task?')) {
      updateActionItems(actionItems.filter(a => a.id !== id));
    }
  };

  const toggleStatus = (item: ActionItem) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    updateActionItems(actionItems.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateActionItems(actionItems.map(a => a.id === editingItem.id ? { ...formData as ActionItem, id: editingItem.id } : a));
    } else {
      updateActionItems([...actionItems, { ...formData as ActionItem, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingItem(null);
    setFormData({ title: '', dueDate: '', status: 'pending', priority: 'medium', assignee: '' });
  };

  const sortedItems = [...actionItems].sort((a, b) => {
    if (a.status === b.status) {
      return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
    }
    return a.status === 'completed' ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-ink">Action Items</h2>
          <p className="text-subtle mt-1">Tasks and follow-ups</p>
        </div>
        <button 
          onClick={() => { setFormData({ title: '', dueDate: '', status: 'pending', priority: 'medium', assignee: '' }); setEditingItem(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-clay text-white px-5 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-colors shadow-sm"
        >
          <Plus size={18} /> New Task
        </button>
      </div>

      {showForm && (
        <Modal title={editingItem ? 'Edit Task' : 'New Task'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputGroup label="Task Description">
              <input 
                className={inputClasses.base}
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </InputGroup>

            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Due Date">
                <input 
                  type="date" 
                  className={inputClasses.base}
                  value={formData.dueDate} 
                  onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                />
              </InputGroup>
              <InputGroup label="Assignee">
                <input 
                  className={inputClasses.base}
                  value={formData.assignee} 
                  onChange={e => setFormData({...formData, assignee: e.target.value})} 
                  placeholder="Optional" 
                />
              </InputGroup>
            </div>

            <div>
              <label className="block text-xs font-bold text-subtle uppercase tracking-wider mb-2">Priority</label>
              <div className="flex gap-3">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all border ${
                      formData.priority === p 
                        ? 'bg-clay text-white border-clay shadow-sm' 
                        : 'bg-white text-ink border-sand/50 hover:bg-taupe'
                    }`}
                    onClick={() => setFormData({...formData, priority: p as any})}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-sand/50">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-5 py-3 rounded-xl border border-sand/50 font-semibold text-subtle hover:bg-taupe transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-3 rounded-xl bg-clay text-white font-semibold hover:bg-clay/90 transition-colors shadow-sm"
              >
                {editingItem ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {sortedItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-sand/50 rounded-2xl">
          <CheckSquare className="w-12 h-12 text-subtle/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No tasks pending</h3>
          <p className="text-subtle">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map(item => (
            <div 
              key={item.id} 
              className={`group bg-white rounded-2xl p-5 shadow-sm border border-transparent hover:border-sand hover:shadow-apple-card transition-all duration-200 flex items-center gap-5 ${
                item.status === 'completed' ? 'opacity-60 bg-taupe/20' : ''
              }`}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); toggleStatus(item); }}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  item.status === 'completed' 
                    ? 'bg-clay border-clay text-white' 
                    : 'border-sand bg-white hover:border-clay'
                }`}
              >
                {item.status === 'completed' && <Check size={14} strokeWidth={3} />}
              </button>
              
              <div className="flex-1">
                 <div className={`text-base font-semibold text-ink transition-all ${
                   item.status === 'completed' ? 'line-through text-subtle' : ''
                 }`}>
                   {item.title}
                 </div>
                 <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                   {item.dueDate && (
                     <span className={`flex items-center gap-1 ${
                       item.dueDate < new Date().toISOString().split('T')[0] && item.status !== 'completed' 
                        ? 'text-red-500' 
                        : 'text-subtle'
                     }`}>
                       <Calendar size={12} />
                       Due {new Date(item.dueDate).toLocaleDateString()}
                     </span>
                   )}
                   {item.assignee && <span className="text-subtle">• {item.assignee}</span>}
                   {item.priority === 'high' && item.status !== 'completed' && (
                     <span className="text-red-500 font-bold tracking-wide uppercase text-[10px]">High Priority</span>
                   )}
                 </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(item)} 
                  className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)} 
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};