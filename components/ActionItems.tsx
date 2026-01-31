import React, { useState } from 'react';
import { ActionItem } from '../types';
import { Plus, Edit2, Trash2, CheckSquare, Check, Calendar, Archive, RotateCcw, Clock, LayoutList, History, Download } from 'lucide-react';
import { Modal } from './ui/Modal';
import { InputGroup, inputClasses } from './ui/InputGroup';
import { jsPDF } from "jspdf";

interface ActionItemsProps {
  actionItems: ActionItem[];
  updateActionItems: (items: ActionItem[]) => void;
}

interface HistoryGroups {
  completed: Record<string, ActionItem[]>;
  open: ActionItem[];
  dropped: ActionItem[];
}

export const ActionItemsSection: React.FC<ActionItemsProps> = ({ actionItems, updateActionItems }) => {
  const [viewMode, setViewMode] = useState<'queue' | 'history'>('queue');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [formData, setFormData] = useState<Partial<ActionItem>>({ 
    title: '', dueDate: '', status: 'pending', priority: 'medium', assignee: '' 
  });
  
  // History Filters
  const [historyStart, setHistoryStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [historyEnd, setHistoryEnd] = useState(() => new Date().toISOString().split('T')[0]);

  // --------------------------------------------------------------------------
  // UTILS
  // --------------------------------------------------------------------------
  const getToday = () => new Date().toISOString().split('T')[0];

  const setQuarter = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    setHistoryStart(d.toISOString().split('T')[0]);
    setHistoryEnd(getToday());
  };

  const setYearToDate = () => {
    const d = new Date();
    setHistoryStart(`${d.getFullYear()}-01-01`);
    setHistoryEnd(getToday());
  };

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------
  const handleEdit = (item: ActionItem) => {
    setFormData(item);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Permanently delete this task record? This cannot be undone.')) {
      updateActionItems(actionItems.filter(a => a.id !== id));
    }
  };

  // Toggle between Pending and Completed
  const toggleStatus = (item: ActionItem) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    const updates: Partial<ActionItem> = { status: newStatus };
    
    if (newStatus === 'completed') {
      updates.completedDate = getToday();
    } else {
      updates.completedDate = undefined;
    }

    updateActionItems(actionItems.map(a => a.id === item.id ? { ...a, ...updates } : a));
  };

  // Mark as Dropped (Archive without deleting)
  const handleDrop = (item: ActionItem) => {
    if (window.confirm('Mark this item as Dropped/Abandoned? It will move to History.')) {
      updateActionItems(actionItems.map(a => a.id === item.id ? { 
        ...a, 
        status: 'dropped',
        completedDate: getToday() // We treat dropped items as "closed" on this date
      } : a));
    }
  };

  // Carry Forward (Reactivate from History)
  const handleCarryForward = (item: ActionItem) => {
    updateActionItems(actionItems.map(a => a.id === item.id ? { 
      ...a, 
      status: 'pending', 
      createdDate: getToday(), // Reset created date to now as it's a "new" attempt
      completedDate: undefined
    } : a));
    alert("Item carried forward to the active queue.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateActionItems(actionItems.map(a => a.id === editingItem.id ? { ...formData as ActionItem, id: editingItem.id } : a));
    } else {
      updateActionItems([...actionItems, { 
        ...formData as ActionItem, 
        id: Date.now().toString(),
        createdDate: getToday()
      }]);
    }
    setShowForm(false);
    setEditingItem(null);
    setFormData({ title: '', dueDate: '', status: 'pending', priority: 'medium', assignee: '' });
  };


  // --------------------------------------------------------------------------
  // RENDER: VIEW MODES & DATA PREP
  // --------------------------------------------------------------------------

  // 1. ACTIVE QUEUE VIEW
  // Only shows Pending and recently Completed. Hides Dropped.
  const activeQueue = [...actionItems]
    .filter(a => a.status !== 'dropped')
    .sort((a, b) => {
      if (a.status === b.status) {
        return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
      }
      return a.status === 'completed' ? 1 : -1;
    });

  // 2. HISTORY VIEW LOGIC
  const historyItems = actionItems.filter(a => {
    const start = historyStart;
    const end = historyEnd;
    
    if (a.status === 'completed' || a.status === 'dropped') {
      const date = a.completedDate || a.createdDate || '2000-01-01';
      return date >= start && date <= end;
    } else {
      // Pending items created in this window
      const created = a.createdDate || '2000-01-01';
      return created >= start && created <= end;
    }
  });

  // Grouping
  const historyGroups = historyItems.reduce((acc, item) => {
    if (item.status === 'completed') {
      const person = item.assignee || 'Unassigned';
      if (!acc.completed[person]) acc.completed[person] = [];
      acc.completed[person].push(item);
    } else if (item.status === 'pending') {
      acc.open.push(item);
    } else if (item.status === 'dropped') {
      acc.dropped.push(item);
    }
    return acc;
  }, { completed: {}, open: [], dropped: [] } as HistoryGroups);

  // --------------------------------------------------------------------------
  // PDF EXPORT
  // --------------------------------------------------------------------------
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    // Helper to check page break
    const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > 270) {
            doc.addPage();
            y = 20;
        }
    };

    // --- HEADER ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const title = viewMode === 'queue' ? "Committee Action Items (Active Queue)" : "Committee Action Items History";
    doc.text(title, pageWidth / 2, y, { align: "center" });
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const subtitle = viewMode === 'queue' 
        ? `Generated: ${new Date().toLocaleDateString()}`
        : `Report Period: ${new Date(historyStart).toLocaleDateString()} to ${new Date(historyEnd).toLocaleDateString()}`;
    doc.text(subtitle, pageWidth / 2, y, { align: "center" });
    y += 15;

    // --- QUEUE MODE EXPORT ---
    if (viewMode === 'queue') {
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        if (activeQueue.length === 0) {
            doc.text("No active items.", margin, y);
        } else {
            activeQueue.forEach(item => {
                checkPageBreak(20);
                
                // Status Box
                const isDone = item.status === 'completed';
                doc.setFillColor(isDone ? 230 : 255, isDone ? 230 : 255, isDone ? 230 : 255);
                doc.rect(margin, y - 5, pageWidth - (margin * 2), 16, "F");
                
                doc.setFont("helvetica", "bold");
                const checkMark = isDone ? "[DONE]" : "[OPEN]";
                doc.text(checkMark, margin + 2, y);
                
                doc.setFontSize(11);
                doc.text(item.title, margin + 25, y);
                
                y += 6;
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                const assignee = item.assignee || "Unassigned";
                const due = item.dueDate ? `Due: ${item.dueDate}` : "";
                const priority = item.priority === 'high' ? "HIGH PRIORITY" : "";
                
                doc.text(`${assignee}   ${due}   ${priority}`, margin + 25, y);
                
                y += 12;
            });
        }
    }

    // --- HISTORY MODE EXPORT ---
    else {
        // 1. Completed Items
        checkPageBreak(30);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, y - 6, pageWidth - (margin * 2), 8, "F");
        doc.text("COMPLETED ITEMS (By Person)", margin + 2, y);
        y += 10;

        const people = Object.keys(historyGroups.completed);
        if (people.length === 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text("No items completed in this period.", margin, y);
            y += 10;
        } else {
            people.forEach(person => {
                checkPageBreak(20);
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(person, margin, y);
                y += 6;
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                historyGroups.completed[person].forEach(item => {
                    checkPageBreak(10);
                    doc.text(`• ${item.title} (Finished: ${item.completedDate})`, margin + 5, y);
                    y += 6;
                });
                y += 4;
            });
        }

        // 2. Open Items
        if (historyGroups.open.length > 0) {
            y += 5;
            checkPageBreak(30);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setFillColor(220, 220, 220);
            doc.rect(margin, y - 6, pageWidth - (margin * 2), 8, "F");
            doc.text("OPEN ITEMS (Created in Period)", margin + 2, y);
            y += 10;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            historyGroups.open.forEach(item => {
                checkPageBreak(10);
                doc.text(`• ${item.title} (Assignee: ${item.assignee || 'None'})`, margin + 5, y);
                y += 6;
            });
        }

        // 3. Dropped Items
        if (historyGroups.dropped.length > 0) {
            y += 5;
            checkPageBreak(30);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setFillColor(220, 220, 220);
            doc.rect(margin, y - 6, pageWidth - (margin * 2), 8, "F");
            doc.text("DROPPED / ABANDONED", margin + 2, y);
            y += 10;
            
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            historyGroups.dropped.forEach(item => {
                checkPageBreak(10);
                doc.text(`• ${item.title} (Dropped: ${item.completedDate})`, margin + 5, y);
                y += 6;
            });
        }
    }

    doc.save(`Action_Items_${viewMode}_${getToday()}.pdf`);
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-sand">
        <div>
          <h2 className="text-3xl font-bold text-ink">Action Items</h2>
          <p className="text-subtle mt-1">Tasks, follow-ups, and history log</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-white text-ink border border-sand px-4 py-3 rounded-xl font-semibold hover:bg-taupe transition-colors shadow-sm"
                title="Export current view to PDF"
             >
                <Download size={18} /> Export Report
             </button>
             {viewMode === 'queue' && (
                <button 
                onClick={() => { setFormData({ title: '', dueDate: '', status: 'pending', priority: 'medium', assignee: '' }); setEditingItem(null); setShowForm(true); }}
                className="flex items-center gap-2 bg-clay text-white px-5 py-3 rounded-xl font-semibold hover:bg-clay/90 transition-colors shadow-sm"
                >
                <Plus size={18} /> New Task
                </button>
             )}
        </div>
      </div>

      {/* VIEW TOGGLE */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-taupe/50 rounded-xl w-fit">
        <button
            onClick={() => setViewMode('queue')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'queue'
                ? 'bg-white text-clay shadow-sm' 
                : 'text-subtle hover:text-ink hover:bg-white/50'
            }`}
          >
            <LayoutList size={16} /> Current Queue
        </button>
        <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'history'
                ? 'bg-white text-clay shadow-sm' 
                : 'text-subtle hover:text-ink hover:bg-white/50'
            }`}
          >
            <History size={16} /> History Log
        </button>
      </div>

      {/* FORM MODAL */}
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

      {/* ================================================================================== */}
      {/* QUEUE VIEW */}
      {/* ================================================================================== */}
      {viewMode === 'queue' && (
        <>
        {activeQueue.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-sand/50 rounded-2xl">
            <CheckSquare className="w-12 h-12 text-subtle/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink mb-2">No active tasks</h3>
            <p className="text-subtle">You're all caught up! Check History for past items.</p>
            </div>
        ) : (
            <div className="space-y-3">
            {activeQueue.map(item => (
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
                        item.dueDate < getToday() && item.status !== 'completed' 
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
                        onClick={() => handleDrop(item)} 
                        className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"
                        title="Mark as Dropped/Abandoned"
                    >
                        <Archive size={18} />
                    </button>
                    <button 
                        onClick={() => handleEdit(item)} 
                        className="p-2 text-subtle hover:bg-taupe rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Permanently"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
        </>
      )}

      {/* ================================================================================== */}
      {/* HISTORY VIEW */}
      {/* ================================================================================== */}
      {viewMode === 'history' && (
        <div className="space-y-8 animate-fade-in-up">
            
            {/* Filter Controls */}
            <div className="bg-white/50 p-6 rounded-2xl border border-sand/50">
                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-subtle uppercase tracking-wider">Date Range</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="date" 
                                className="bg-white border-sand/50 rounded-xl px-4 py-2 text-sm"
                                value={historyStart}
                                onChange={(e) => setHistoryStart(e.target.value)}
                            />
                            <span className="text-subtle text-xs">to</span>
                            <input 
                                type="date" 
                                className="bg-white border-sand/50 rounded-xl px-4 py-2 text-sm"
                                value={historyEnd}
                                onChange={(e) => setHistoryEnd(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={setQuarter}
                            className="px-4 py-2 bg-white border border-sand/50 rounded-xl text-xs font-bold text-subtle hover:text-clay hover:border-clay/50 transition-colors"
                        >
                            Last Quarter
                        </button>
                        <button 
                            onClick={setYearToDate}
                            className="px-4 py-2 bg-white border border-sand/50 rounded-xl text-xs font-bold text-subtle hover:text-clay hover:border-clay/50 transition-colors"
                        >
                            Year to Date
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION: OPEN ITEMS (In this period) */}
            {historyGroups.open.length > 0 && (
                <div>
                     <h3 className="text-sm font-bold text-subtle uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock size={14} /> Created & Still Open
                     </h3>
                     <div className="space-y-2">
                        {historyGroups.open.map(item => (
                            <div key={item.id} className="bg-white border border-l-4 border-l-clay border-y-sand/20 border-r-sand/20 rounded-r-xl p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-ink">{item.title}</div>
                                    <div className="text-xs text-subtle mt-1">Created: {item.createdDate || 'Unknown'} • Assignee: {item.assignee || 'None'}</div>
                                </div>
                                <div className="text-xs font-bold bg-clay/10 text-clay px-2 py-1 rounded">PENDING</div>
                            </div>
                        ))}
                     </div>
                </div>
            )}

            {/* SECTION: COMPLETED BY PERSON */}
            <div>
                 <h3 className="text-sm font-bold text-subtle uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckSquare size={14} /> Completed Items
                 </h3>
                 {Object.keys(historyGroups.completed).length === 0 ? (
                     <div className="text-sm text-subtle italic ml-2">No completed items in this period.</div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(Object.entries(historyGroups.completed) as [string, ActionItem[]][]).map(([person, items]) => (
                            <div key={person} className="bg-white/60 rounded-2xl p-5 border border-sand/30">
                                <h4 className="font-serif font-bold text-ink mb-3 pb-2 border-b border-sand/30 flex justify-between items-center">
                                    {person}
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{items.length}</span>
                                </h4>
                                <ul className="space-y-3">
                                    {items.map(item => (
                                        <li key={item.id} className="text-sm text-subtle">
                                            <div className="flex items-start gap-2">
                                                <Check size={14} className="mt-0.5 text-green-600 shrink-0" />
                                                <span className="line-through opacity-80">{item.title}</span>
                                            </div>
                                            <div className="text-[10px] text-subtle/60 pl-6 mt-0.5">Done: {item.completedDate || 'Unknown'}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                     </div>
                 )}
            </div>

            {/* SECTION: DROPPED */}
            {historyGroups.dropped.length > 0 && (
                <div className="pt-6 border-t border-sand/30">
                     <h3 className="text-sm font-bold text-subtle uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Archive size={14} /> Dropped / Abandoned
                     </h3>
                     <div className="space-y-2 opacity-75">
                        {historyGroups.dropped.map(item => (
                            <div key={item.id} className="bg-taupe/30 border border-sand/30 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-subtle line-through">{item.title}</div>
                                    <div className="text-xs text-subtle/60 mt-1">Dropped: {item.completedDate || 'Unknown'}</div>
                                </div>
                                <button 
                                    onClick={() => handleCarryForward(item)}
                                    className="flex items-center gap-1 text-xs font-bold text-clay hover:underline"
                                >
                                    <RotateCcw size={12} /> Carry Forward
                                </button>
                            </div>
                        ))}
                     </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};