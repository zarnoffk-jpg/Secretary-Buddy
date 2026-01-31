import React, { useState, useEffect, useCallback } from 'react';
import { Meeting } from '../types';
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, Download, Save, RefreshCw } from 'lucide-react';
import { Modal } from './ui/Modal';
import { InputGroup, inputClasses } from './ui/InputGroup';
import { jsPDF } from "jspdf";
import { supabase } from '../supabaseClient';

interface MeetingsProps {
  meetings: Meeting[];
  updateMeetings: (meetings: Meeting[]) => void;
}

export const MeetingsSection: React.FC<MeetingsProps> = ({ meetings, updateMeetings }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Meeting>>({
    title: '', date: '', time: '', location: '', notes: ''
  });

  // Fetch from Supabase
  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: true });

    if (error) {
      console.error('Supabase meetings fetch error', error);
    } else if (data) {
      const mappedMeetings: Meeting[] = data.map((m: any) => ({
        id: m.id.toString(),
        title: m.title || 'Untitled',
        date: m.meeting_date || m.date || new Date().toISOString().split('T')[0],
        time: m.meeting_time || m.time || '', 
        location: m.location || '',
        notes: m.notes || ''
      }));
      updateMeetings(mappedMeetings);
    }
    setLoading(false);
  }, [updateMeetings]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMeetings();
    // We intentionally ignore dependency array warnings to prevent infinite loops 
    // caused by the unstable updateMeetings prop passed from parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedMeetings = [...meetings].sort((a, b) => b.date.localeCompare(a.date));

  const handleEdit = (item: Meeting) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this meeting permanently?')) return;

    // Optimistic Update: Remove immediately for "instant" feel
    const previousMeetings = [...meetings];
    const optimisticList = meetings.filter(m => m.id !== id);
    updateMeetings(optimisticList);

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Success: The item is already gone from UI.
      // We can optionally refetch to be 100% in sync, but mostly not needed if successful.
      
    } catch (error: any) {
      // Revert if failed
      console.error('Supabase delete error', error);
      alert(`Failed to delete: ${error.message}`);
      updateMeetings(previousMeetings);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: formData.title,
      meeting_date: formData.date,
      meeting_time: formData.time,
      location: formData.location,
      notes: formData.notes
    };

    let error = null;

    if (editingItem) {
      const { error: updateError } = await supabase
        .from('meetings')
        .update(payload)
        .eq('id', editingItem.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('meetings')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      console.error('Save error', error);
      alert(`Failed to save: ${error.message}`);
    } else {
      // Refresh to get new IDs or confirmed state
      await fetchMeetings();
      setShowForm(false);
      setEditingItem(null);
      setFormData({ title: '', date: '', time: '', location: '', notes: '' });
    }
    setLoading(false);
  };

  const handleExportPDF = () => {
    if (sortedMeetings.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Meetings Schedule", pageWidth / 2, y, { align: "center" });
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    // Table
    const headers = [
        { title: "Date", x: margin, w: 30 },
        { title: "Time", x: margin + 30, w: 25 },
        { title: "Meeting Title", x: margin + 55, w: 80 },
        { title: "Location", x: margin + 135, w: 45 }
    ];

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, pageWidth - (margin * 2), 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    headers.forEach(h => {
        doc.text(h.title, h.x, y);
    });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    sortedMeetings.forEach((m) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        const dateStr = new Date(m.date).toLocaleDateString();
        const timeStr = m.time || '-';
        const titleStr = doc.splitTextToSize(m.title, headers[2].w - 5);
        const locStr = doc.splitTextToSize(m.location || '-', headers[3].w - 5);
        const maxLines = Math.max(titleStr.length, locStr.length);
        const rowHeight = Math.max(10, maxLines * 5 + 4);

        doc.text(dateStr, headers[0].x, y);
        doc.text(timeStr, headers[1].x, y);
        doc.text(titleStr, headers[2].x, y);
        doc.text(locStr, headers[3].x, y);

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + rowHeight - 4, pageWidth - margin, y + rowHeight - 4);

        y += rowHeight;
    });

    doc.save(`meetings_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-sand">
        <div>
          <h2 className="text-4xl font-serif font-bold text-ink flex items-center gap-3">
            Meetings
            {loading && <RefreshCw size={20} className="animate-spin text-clay" />}
          </h2>
          <p className="text-subtle mt-2 font-serif italic">Schedule, agendas, and minutes</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleExportPDF}
                disabled={sortedMeetings.length === 0}
                className="flex items-center justify-center bg-white text-ink border border-sand w-12 h-12 rounded-xl hover:bg-taupe transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export meetings to PDF"
             >
                <Download size={22} />
             </button>
            <button 
              onClick={() => { setFormData({ title: '', date: '', time: '', location: '', notes: '' }); setEditingItem(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-clay text-white px-6 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-all shadow-md active:translate-y-0.5"
            >
              <Plus size={18} /> New Meeting
            </button>
        </div>
      </div>

      {showForm && (
        <Modal title={editingItem ? 'Edit Meeting' : 'Schedule Meeting'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputGroup label="Title">
              <input 
                className={inputClasses.base}
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
                placeholder="Committee Meeting" 
              />
            </InputGroup>

            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Date">
                <input 
                  type="date"
                  className={inputClasses.base}
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  required 
                />
              </InputGroup>
              <InputGroup label="Time">
                <input 
                  type="time"
                  className={inputClasses.base}
                  value={formData.time} 
                  onChange={e => setFormData({...formData, time: e.target.value})} 
                />
              </InputGroup>
            </div>

            <InputGroup label="Location">
              <input 
                className={inputClasses.base}
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
                placeholder="Conference Room A" 
              />
            </InputGroup>

            <InputGroup label="Notes">
              <textarea 
                className={inputClasses.textarea}
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                placeholder="Agenda items, minutes..." 
              />
            </InputGroup>

            <div className="flex justify-end gap-3 pt-6 border-t border-sand">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-sand font-semibold text-subtle hover:bg-taupe hover:text-ink transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-3 rounded-xl bg-clay text-white font-semibold hover:bg-clay/90 transition-colors shadow-sm flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {editingItem ? 'Save Changes' : 'Schedule Meeting'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {meetings.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-sand rounded-2xl bg-taupe/10">
          <Calendar className="w-16 h-16 text-sand mx-auto mb-4" />
          <h3 className="text-xl font-serif font-bold text-ink mb-2">No meetings scheduled</h3>
          <p className="text-subtle">Plan your next committee meeting or event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sortedMeetings.map(meeting => (
            <div key={meeting.id} className="bg-surface rounded-xl p-0 shadow-card border border-sand hover:shadow-soft transition-all duration-200 overflow-hidden flex flex-col md:flex-row">
              <div className="bg-clay-light/30 p-6 flex flex-col items-center justify-center min-w-[120px] border-b md:border-b-0 md:border-r border-sand">
                  <span className="text-xs font-bold uppercase tracking-widest text-clay mb-1">{new Date(meeting.date).toLocaleDateString(undefined, {month: 'short'})}</span>
                  <span className="text-4xl font-serif font-bold text-ink">{new Date(meeting.date).getDate()}</span>
                  <span className="text-xs text-subtle mt-1">{new Date(meeting.date).toLocaleDateString(undefined, {weekday: 'short'})}</span>
              </div>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-ink font-serif">{meeting.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-subtle">
                      {meeting.time && (
                        <span className="flex items-center gap-1.5 bg-taupe px-2 py-1 rounded">
                          <Clock size={14} />
                          {meeting.time}
                        </span>
                      )}
                      {meeting.location && (
                        <span className="flex items-center gap-1.5 bg-taupe px-2 py-1 rounded">
                          <MapPin size={14} />
                          {meeting.location}
                        </span>
                      )}
                    </div>
                    {meeting.notes && (
                      <p className="text-subtle text-sm leading-relaxed max-w-2xl border-l-2 border-sand pl-3 italic">
                        "{meeting.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(meeting)} 
                      className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, meeting.id)} 
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                      disabled={loading}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};