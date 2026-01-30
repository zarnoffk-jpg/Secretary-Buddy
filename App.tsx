import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MeetingsSection } from './components/Meetings';
import { CorrespondenceSection } from './components/Correspondence';
import { ActionItemsSection } from './components/ActionItems';
import { CaseLogSection } from './components/CaseLog';
import { RosterSection } from './components/Roster';
import { AppData, TabId, Contact, Meeting, ActionItem } from './types';
import { Feather, Save } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const STORAGE_KEY = 'secretary-buddy-data';

const defaultData: AppData = {
  meetings: [],
  correspondence: [],
  actionItems: [],
  contacts: [],
  caseLog: [],
  committeeRoster: [],
  stickyNote: '',
  lastUpdated: null
};

export default function App() {
  const [data, setData] = useState<AppData>(defaultData);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      saveData(data);
    }
  }, [data, loading]);

  const loadData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.stickyNote === 'undefined') parsed.stickyNote = '';
        setData(parsed);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    }
    setLoading(false);
  };

  const saveData = (newData: AppData) => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...newData,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Save failed:', error);
    }
    setTimeout(() => setSaving(false), 500);
  };

  const updateData = <K extends keyof AppData>(key: K, value: AppData[K]) => {
    setData(prev => ({
      ...prev,
      [key]: value,
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleMagicInput = async (input: string): Promise<string> => {
    if (!process.env.API_KEY) {
      return "Error: API Key is missing.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: `You are an expert executive secretary. Analyze the user's raw notes and extract structured data to organize their day.
          
          Current Date: ${new Date().toISOString().split('T')[0]}

          Rules:
          1. Extract 'contacts' if new people are mentioned with details (role, email, phone).
          2. Extract 'meetings' if a time and event are mentioned.
          3. Extract 'actionItems' for tasks. 
          4. Infer missing details reasonably (e.g., if 'tomorrow', calculate the date).
          5. Set priority to 'medium' if unspecified.
          `,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              contacts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    address: { type: Type.STRING },
                  }
                }
              },
              meetings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING, description: "YYYY-MM-DD" },
                    time: { type: Type.STRING, description: "HH:MM" },
                    location: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  }
                }
              },
              actionItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    dueDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                    priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
                    assignee: { type: Type.STRING },
                  }
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      const newContacts: Contact[] = (result.contacts || []).map((c: any) => ({
        ...c,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        role: c.role || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || ''
      }));

      const newMeetings: Meeting[] = (result.meetings || []).map((m: any) => ({
        ...m,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        time: m.time || '',
        location: m.location || '',
        notes: m.notes || ''
      }));

      const newActionItems: ActionItem[] = (result.actionItems || []).map((a: any) => ({
        ...a,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        priority: a.priority || 'medium',
        assignee: a.assignee || ''
      }));

      setData(prev => ({
        ...prev,
        contacts: [...prev.contacts, ...newContacts],
        meetings: [...prev.meetings, ...newMeetings],
        actionItems: [...prev.actionItems, ...newActionItems],
        lastUpdated: new Date().toISOString()
      }));

      const summary = [];
      if (newContacts.length) summary.push(`${newContacts.length} contacts`);
      if (newMeetings.length) summary.push(`${newMeetings.length} meetings`);
      if (newActionItems.length) summary.push(`${newActionItems.length} tasks`);

      return summary.length > 0 
        ? `Filed successfully: ${summary.join(', ')}.` 
        : "Processed, but no specific items were found to create.";

    } catch (e) {
      console.error(e);
      return "Failed to process with AI. Please try again.";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-subtle font-serif italic animate-pulse">
        Preparing workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-ink font-sans flex flex-col selection:bg-clay/20">
      {/* Header - Glassmorphic with Receding Behavior on Modal Open */}
      <header className="h-20 px-8 sticky top-0 z-50 flex items-center justify-between bg-paper/60 backdrop-blur-xl border-b border-sand/30 transition-all duration-500 ease-in-out [body.has-modal_&]:opacity-0 [body.has-modal_&]:-translate-y-4 [body.has-modal_&]:pointer-events-none">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-10 h-10 bg-clay text-white rounded-xl flex items-center justify-center shadow-apple-card transition-all duration-500 ease-spring group-hover:rotate-[15deg] group-hover:scale-110 group-hover:shadow-glow">
            <Feather size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-ink leading-tight tracking-tight">Secretary Buddy</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-subtle font-medium opacity-80">Digital Atelier</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs font-medium text-subtle flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50">
            {saving ? (
              <>
                <Save size={12} className="animate-spin text-clay" />
                <span className="italic">Saving...</span>
              </>
            ) : data.lastUpdated ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-clay/70"></span>
                Last saved {new Date(data.lastUpdated).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
              </>
            ) : 'Ready'}
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-8 md:p-12 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                data={data} 
                setActiveTab={setActiveTab} 
                onMagicInput={handleMagicInput}
              />
            )}
            {/* Wrap other components in a fade-in div */}
            <div className={activeTab === 'dashboard' ? '' : 'animate-fade-in-up'}>
              {activeTab === 'meetings' && (
                <MeetingsSection 
                  meetings={data.meetings}
                  updateMeetings={(m) => updateData('meetings', m)}
                />
              )}
              {activeTab === 'correspondence' && (
                <CorrespondenceSection
                  correspondence={data.correspondence}
                  contacts={data.contacts}
                  updateCorrespondence={(c) => updateData('correspondence', c)}
                />
              )}
              {activeTab === 'actionItems' && (
                <ActionItemsSection
                  actionItems={data.actionItems}
                  updateActionItems={(a) => updateData('actionItems', a)}
                />
              )}
              {activeTab === 'caseLog' && (
                <CaseLogSection
                  caseLog={data.caseLog}
                  updateCaseLog={(cl) => updateData('caseLog', cl)}
                />
              )}
              {activeTab === 'roster' && (
                <RosterSection
                  roster={data.committeeRoster}
                  updateRoster={(r) => updateData('committeeRoster', r)}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}