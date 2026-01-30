import React, { useState } from 'react';
import { CaseLogEntry } from '../types';
import { Plus, Edit2, Trash2, Activity } from 'lucide-react';
import { Modal } from './ui/Modal';
import { InputGroup, inputClasses } from './ui/InputGroup';

interface CaseLogProps {
  caseLog: CaseLogEntry[];
  updateCaseLog: (caseLog: CaseLogEntry[]) => void;
}

export const CaseLogSection: React.FC<CaseLogProps> = ({ caseLog, updateCaseLog }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CaseLogEntry | null>(null);
  const [formData, setFormData] = useState<Partial<CaseLogEntry>>({ 
    caseNumber: '', title: '', status: 'open', dateOpened: new Date().toISOString().split('T')[0], notes: '' 
  });

  const handleEdit = (item: CaseLogEntry) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this case?')) {
      updateCaseLog(caseLog.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateCaseLog(caseLog.map(c => c.id === editingItem.id ? { ...formData as CaseLogEntry, id: editingItem.id } : c));
    } else {
      updateCaseLog([...caseLog, { ...formData as CaseLogEntry, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingItem(null);
    setFormData({ caseNumber: '', title: '', status: 'open', dateOpened: new Date().toISOString().split('T')[0], notes: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100/50 text-red-600';
      case 'pending': return 'bg-amber-100/50 text-amber-600';
      case 'closed': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-ink">Case Log</h2>
          <p className="text-subtle mt-1">Track ongoing disciplinary or special cases</p>
        </div>
        <button 
          onClick={() => { setFormData({ caseNumber: '', title: '', status: 'open', dateOpened: new Date().toISOString().split('T')[0], notes: '' }); setEditingItem(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-clay text-white px-5 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-colors shadow-sm"
        >
          <Plus size={18} /> New Case
        </button>
      </div>

      {showForm && (
        <Modal title={editingItem ? 'Edit Case' : 'New Case'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Case #">
                <input 
                  className={inputClasses.base}
                  value={formData.caseNumber} 
                  onChange={e => setFormData({...formData, caseNumber: e.target.value})} 
                  placeholder="e.g. 2023-001" 
                />
              </InputGroup>

              <InputGroup label="Status">
                <select 
                  className={inputClasses.select}
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending Review</option>
                  <option value="closed">Closed</option>
                </select>
              </InputGroup>
            </div>

            <InputGroup label="Title / Subject">
              <input 
                className={inputClasses.base}
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </InputGroup>

            <InputGroup label="Date Opened">
              <input 
                type="date" 
                className={inputClasses.base}
                value={formData.dateOpened} 
                onChange={e => setFormData({...formData, dateOpened: e.target.value})} 
              />
            </InputGroup>
            
            <InputGroup label="Notes">
              <textarea 
                className={inputClasses.textarea}
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
              />
            </InputGroup>

            <div className="flex justify-end gap-3 pt-6 border-t border-sand/50">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-sand/50 font-semibold text-subtle hover:bg-taupe transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-3 rounded-xl bg-clay text-white font-semibold hover:bg-clay/90 transition-colors shadow-sm"
              >
                {editingItem ? 'Save Changes' : 'Save Case'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {caseLog.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-sand/50 rounded-2xl">
          <Activity className="w-12 h-12 text-subtle/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No active cases</h3>
          <p className="text-subtle">Case records will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {caseLog.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-transparent hover:border-sand hover:shadow-apple-card transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${getStatusColor(item.status)}`}>
                       {item.status}
                     </span>
                     <span className="font-mono text-xs text-subtle">{item.caseNumber}</span>
                   </div>
                   <h3 className="text-lg font-bold text-ink mb-1">{item.title}</h3>
                   <div className="text-xs font-medium text-subtle">Opened: {new Date(item.dateOpened).toLocaleDateString()}</div>
                   {item.notes && <p className="mt-3 text-sm text-subtle/80 leading-relaxed">{item.notes}</p>}
                </div>
                <div className="flex gap-2">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};