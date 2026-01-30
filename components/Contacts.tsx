import React, { useState } from 'react';
import { Contact } from '../types';
import { Plus, Edit2, Trash2, Search, Mail, Phone } from 'lucide-react';
import { Modal } from './ui/Modal';
import { InputGroup, inputClasses } from './ui/InputGroup';

interface ContactsProps {
  contacts: Contact[];
  updateContacts: (contacts: Contact[]) => void;
}

export const ContactsSection: React.FC<ContactsProps> = ({ contacts, updateContacts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Contact>>({ name: '', role: '', email: '', phone: '', address: '' });

  const handleEdit = (item: Contact) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this contact?')) {
      updateContacts(contacts.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateContacts(contacts.map(c => c.id === editingItem.id ? { ...formData as Contact, id: editingItem.id } : c));
    } else {
      updateContacts([...contacts, { ...formData as Contact, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: '', role: '', email: '', phone: '', address: '' });
  };

  const filteredContacts = contacts
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.role.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-ink">Contacts</h2>
          <p className="text-subtle mt-1">Directory and address book</p>
        </div>
        <button 
          onClick={() => { setFormData({ name: '', role: '', email: '', phone: '', address: '' }); setEditingItem(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-clay text-white px-5 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-colors shadow-sm"
        >
          <Plus size={18} /> New Contact
        </button>
      </div>

      <div className="relative mb-6 group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle group-focus-within:text-clay transition-colors">
          <Search size={18} />
        </div>
        <input 
          className="w-full bg-white border border-sand/50 rounded-2xl py-3.5 pl-12 pr-4 text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-clay/10 focus:border-clay/50 transition-all"
          placeholder="Search contacts..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {showForm && (
        <Modal title={editingItem ? 'Edit Contact' : 'New Contact'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputGroup label="Name">
              <input 
                className={inputClasses.base}
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </InputGroup>

            <InputGroup label="Role / Title">
              <input 
                className={inputClasses.base}
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})} 
                placeholder="e.g. Treasurer" 
              />
            </InputGroup>

            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Email">
                <input 
                  type="email" 
                  className={inputClasses.base}
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </InputGroup>
              <InputGroup label="Phone">
                <input 
                  type="tel" 
                  className={inputClasses.base}
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </InputGroup>
            </div>

            <InputGroup label="Address">
              <input 
                className={inputClasses.base}
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
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
                {editingItem ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="bg-white rounded-2xl p-5 shadow-sm border border-transparent hover:border-sand hover:shadow-apple-card transition-all duration-300">
            <div className="flex justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-clay/10 text-clay flex items-center justify-center text-lg font-bold">
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <div className="text-base font-bold text-ink">{contact.name}</div>
                  <div className="text-sm text-subtle mb-3">{contact.role}</div>
                  <div className="space-y-1.5">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-xs font-medium text-subtle">
                        <Mail size={12} /> {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-xs font-medium text-subtle">
                        <Phone size={12} /> {contact.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                 <button 
                    onClick={() => handleEdit(contact)} 
                    className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(contact.id)} 
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};