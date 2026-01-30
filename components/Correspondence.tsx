import React, { useState } from 'react';
import { Correspondence, Contact } from '../types';
import { Plus, Edit2, Trash2, Search, Mail, Phone, User, FileText } from 'lucide-react';
import { Modal } from './ui/Modal';
import { InputGroup, inputClasses } from './ui/InputGroup';

interface CorrespondenceProps {
  correspondence: Correspondence[];
  contacts: Contact[];
  updateCorrespondence: (c: Correspondence[]) => void;
}

export const CorrespondenceSection: React.FC<CorrespondenceProps> = ({ correspondence, contacts, updateCorrespondence }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Correspondence | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  
  const [formData, setFormData] = useState<Partial<Correspondence>>({ 
    date: new Date().toISOString().split('T')[0], 
    direction: 'incoming', 
    contact: '', 
    subject: '', 
    content: '', 
    method: 'email' 
  });

  const filteredItems = correspondence
    .filter(c => filter === 'all' || c.direction === filter)
    .filter(c => c.subject.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleEdit = (item: Correspondence) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this record?')) {
      updateCorrespondence(correspondence.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateCorrespondence(correspondence.map(c => c.id === editingItem.id ? { ...formData as Correspondence, id: editingItem.id } : c));
    } else {
      updateCorrespondence([...correspondence, { ...formData as Correspondence, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingItem(null);
    setFormData({ date: new Date().toISOString().split('T')[0], direction: 'incoming', contact: '', subject: '', content: '', method: 'email' });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail size={14} />;
      case 'phone': return <Phone size={14} />;
      case 'person': return <User size={14} />;
      default: return <FileText size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-ink">Correspondence</h2>
          <p className="text-subtle mt-1">Track incoming and outgoing messages</p>
        </div>
        <button 
          onClick={() => { setFormData({ date: new Date().toISOString().split('T')[0], direction: 'incoming', contact: '', subject: '', content: '', method: 'email' }); setEditingItem(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-clay text-white px-5 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-colors shadow-sm"
        >
          <Plus size={18} /> Log Message
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle group-focus-within:text-clay transition-colors">
            <Search size={18} />
          </div>
          <input 
            className="w-full bg-white border border-sand/50 rounded-2xl py-3.5 pl-12 pr-4 text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-clay/10 focus:border-clay/50 transition-all"
            placeholder="Search subjects or contacts..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-sand/50">
          {['all', 'incoming', 'outgoing'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                filter === f 
                  ? 'bg-clay text-white shadow-sm' 
                  : 'text-subtle hover:bg-white/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <Modal title={editingItem ? 'Edit Log' : 'Log Correspondence'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Direction">
                <select 
                  className={inputClasses.select}
                  value={formData.direction} 
                  onChange={e => setFormData({...formData, direction: e.target.value as any})}
                >
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </select>
              </InputGroup>
              <InputGroup label="Method">
                <select 
                  className={inputClasses.select}
                  value={formData.method} 
                  onChange={e => setFormData({...formData, method: e.target.value})}
                >
                  <option value="email">Email</option>
                  <option value="letter">Letter</option>
                  <option value="phone">Phone Call</option>
                  <option value="person">In Person</option>
                </select>
              </InputGroup>
            </div>
            
            <InputGroup label="Contact Name">
              <input 
                className={inputClasses.base}
                list="contacts-list" 
                value={formData.contact} 
                onChange={e => setFormData({...formData, contact: e.target.value})} 
                required 
                placeholder="Who is this with?" 
              />
              <datalist id="contacts-list">
                {contacts.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </InputGroup>

            <InputGroup label="Date">
              <input 
                type="date" 
                className={inputClasses.base}
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                required 
              />
            </InputGroup>

            <InputGroup label="Subject">
              <input 
                className={inputClasses.base}
                value={formData.subject} 
                onChange={e => setFormData({...formData, subject: e.target.value})} 
                required 
                placeholder="Main topic" 
              />
            </InputGroup>

            <InputGroup label="Content / Summary">
              <textarea 
                className={inputClasses.textarea}
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
                placeholder="What was discussed or decided?" 
              />
            </InputGroup>

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
                {editingItem ? 'Save Changes' : 'Log Message'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-sand/50 rounded-2xl">
          <Mail className="w-12 h-12 text-subtle/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No correspondence found</h3>
          <p className="text-subtle">Adjust filters or log a new message.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-transparent hover:border-sand hover:shadow-apple-card transition-all duration-300">
               <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                      item.direction === 'incoming' 
                        ? 'bg-green-100/50 text-green-700' 
                        : 'bg-clay/10 text-clay'
                    }`}>
                      {item.direction === 'incoming' ? 'INCOMING' : 'OUTGOING'}
                    </span>
                    <span className="text-xs font-medium text-subtle">{new Date(item.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-subtle/80 capitalize">
                      {getMethodIcon(item.method)} {item.method}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-1">{item.subject}</h3>
                  <div className="text-sm font-semibold text-clay mb-3">{item.contact}</div>
                  <p className="text-subtle text-sm leading-relaxed max-w-2xl">
                    {item.content}
                  </p>
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