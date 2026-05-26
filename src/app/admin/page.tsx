'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import './admin.css';

type EditorType = 'executives' | 'projects' | 'events' | 'courses' | 'achievements';

interface TypeConfig {
  file: string;
  title: string;
  desc: string;
  endpoint: string;
}

const TYPE_CONFIGS: Record<EditorType, TypeConfig> = {
  executives: {
    file: 'database.json',
    title: 'Executives Editor',
    desc: 'Edit executive committee details, active sessions, and member profiles.',
    endpoint: '/resources/data/database.json',
  },
  projects: {
    file: 'projects.json',
    title: 'Projects Editor',
    desc: 'Manage featured open-source projects, club contributions, and publications.',
    endpoint: '/resources/data/projects.json',
  },
  events: {
    file: 'events.json',
    title: 'Events Editor',
    desc: 'Schedule and manage workshops, seminars, programming contests, and meetups.',
    endpoint: '/resources/data/events.json',
  },
  courses: {
    file: 'courses.json',
    title: 'Courses Editor',
    desc: 'Manage courses, syllabus listings, and professional certifications.',
    endpoint: '/resources/data/courses.json',
  },
  achievements: {
    file: 'achievements.json',
    title: 'Achievements Editor',
    desc: 'Record competitive programming achievements, tallies, and medals.',
    endpoint: '/resources/data/achievements.json',
  },
};

export default function AdminPanel() {
  const { theme, toggleTheme } = useTheme();
  const [activeType, setActiveType] = useState<EditorType>('executives');
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Layout States
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSectionIdx, setOpenSectionIdx] = useState<number | null>(null); // For accordion panels
  
  // Drag and Drop States
  const [draggableIdx, setDraggableIdx] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [draggedTallyIdx, setDraggedTallyIdx] = useState<number | null>(null);

  // Committee selected index (for executives)
  const [selectedCommitteeIdx, setSelectedCommitteeIdx] = useState<number>(0);


  // Interactive Editor States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editorText, setEditorText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Check if environment is local dev & sync layout preferences
  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
    const savedSidebar = localStorage.getItem('sidebarState');
    if (savedSidebar === 'collapsed') {
      setCollapsed(true);
    }
  }, []);


  // Show status toasts
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Helpers
  const getTodayStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const cleanLoadedData = (type: EditorType, data: any) => {
    if (type === 'events' && data && Array.isArray(data.events)) {
      const todayStr = getTodayStr();
      const initialCount = data.events.length;
      const filteredEvents = data.events.filter((ev: any) => {
        if (!ev.date) return false;
        return ev.date >= todayStr;
      });
      const removedCount = initialCount - filteredEvents.length;
      if (removedCount > 0) {
        setTimeout(() => {
          showToast(`Filtered out ${removedCount} expired event(s) ✓`, 'error');
        }, 800);
      }
      return {
        ...data,
        events: filteredEvents
      };
    }
    return data;
  };

  const validateStructure = (type: EditorType, data: any): { valid: boolean; reason?: string } => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, reason: 'Root must be a JSON object' };
    }
    switch (type) {
      case 'executives':
        if (typeof data.current_committee !== 'string') {
          return { valid: false, reason: 'Missing or invalid "current_committee" string' };
        }
        if (!Array.isArray(data.committees)) {
          return { valid: false, reason: 'Missing or invalid "committees" array' };
        }
        for (let i = 0; i < data.committees.length; i++) {
          const c = data.committees[i];
          if (!c || typeof c !== 'object' || typeof c.session !== 'string' || typeof c.label !== 'string') {
            return { valid: false, reason: `Committee at index ${i} is missing "session" or "label"` };
          }
          if (!Array.isArray(c.members)) {
            return { valid: false, reason: `Committee at index ${i} is missing "members" array` };
          }
        }
        break;
      case 'projects':
        if (!Array.isArray(data.projects)) {
          return { valid: false, reason: 'Missing or invalid "projects" array' };
        }
        break;
      case 'events':
        if (!Array.isArray(data.events)) {
          return { valid: false, reason: 'Missing or invalid "events" array' };
        }
        break;
      case 'courses':
        if (!Array.isArray(data.courses)) {
          return { valid: false, reason: 'Missing or invalid "courses" array' };
        }
        break;
      case 'achievements':
        if (!Array.isArray(data.tally)) {
          return { valid: false, reason: 'Missing or invalid "tally" array' };
        }
        if (!Array.isArray(data.achievements)) {
          return { valid: false, reason: 'Missing or invalid "achievements" array' };
        }
        break;
    }
    return { valid: true };
  };

  const validateJsonChange = (text: string, syncToDb: boolean = true) => {
    try {
      const parsed = JSON.parse(text);
      const structRes = validateStructure(activeType, parsed);
      if (!structRes.valid) {
        setJsonError(`Structure Schema Error: ${structRes.reason}`);
        setErrorLine(null);
        return false;
      }
      setJsonError(null);
      setErrorLine(null);
      if (syncToDb) {
        setDb(parsed);
      }
      return true;
    } catch (err: any) {
      const msg = err.message || 'Invalid JSON syntax';
      setJsonError(msg);
      
      let pos = -1;
      const posMatch = msg.match(/position (\d+)/i);
      if (posMatch) {
        pos = parseInt(posMatch[1], 10);
      }
      
      const lineMatch = msg.match(/line (\d+)/i);
      if (lineMatch) {
        setErrorLine(parseInt(lineMatch[1], 10));
      } else if (pos >= 0) {
        const line = text.substring(0, pos).split('\n').length;
        setErrorLine(line);
      } else {
        setErrorLine(null);
      }
      return false;
    }
  };

  // Sync editor text with database updates (from left side forms)
  useEffect(() => {
    if (db) {
      const serialized = JSON.stringify(db, null, 2);
      try {
        const currentParsed = JSON.parse(editorText);
        if (JSON.stringify(currentParsed) !== JSON.stringify(db)) {
          setEditorText(serialized);
        }
      } catch (e) {
        if (!isEditMode) {
          setEditorText(serialized);
        }
      }
    } else {
      setEditorText('');
    }
  }, [db, isEditMode]);

  const handleEditorChange = (val: string) => {
    setUndoStack(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === editorText) return prev;
      const next = [...prev, editorText];
      if (next.length > 50) return next.slice(1);
      return next;
    });
    setRedoStack([]);
    setEditorText(val);
    validateJsonChange(val, true);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(old => [...old, editorText]);
    setEditorText(prev);
    setUndoStack(old => old.slice(0, -1));
    validateJsonChange(prev, true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(old => [...old, editorText]);
    setEditorText(next);
    setRedoStack(old => old.slice(0, -1));
    validateJsonChange(next, true);
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      if (jsonError) {
        if (confirm('The JSON editor currently contains errors. Exiting will discard your unsaved changes. Exit anyway?')) {
          setEditorText(JSON.stringify(db, null, 2));
          setJsonError(null);
          setErrorLine(null);
          setIsEditMode(false);
        }
      } else {
        setIsEditMode(false);
      }
    } else {
      setEditorText(JSON.stringify(db, null, 2));
      setUndoStack([]);
      setRedoStack([]);
      setJsonError(null);
      setErrorLine(null);
      setIsEditMode(true);
    }
  };

  // Get default structure for new/failed files
  const getEmptyData = (type: EditorType) => {
    switch (type) {
      case 'executives':
        return { current_committee: '2026-27', committees: [] };
      case 'projects':
        return { projects: [] };
      case 'events':
        return { note: '', events: [] };
      case 'courses':
        return { courses: [] };
      case 'achievements':
        return { tally: [], achievements: [] };
    }
  };

  // Load target file
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setOpenSectionIdx(null);
      try {
        const res = await fetch(`${TYPE_CONFIGS[activeType].endpoint}?t=${Date.now()}`);
        if (!res.ok) throw new Error('File not found');
        const data = await res.json();
        const cleanedData = cleanLoadedData(activeType, data);
        setDb(cleanedData);
        showToast(`Loaded ${TYPE_CONFIGS[activeType].file} ✓`);
        
        if (activeType === 'executives' && data.committees) {
          const activeIdx = data.committees.findIndex((c: any) => c.session === data.current_committee);
          setSelectedCommitteeIdx(activeIdx >= 0 ? activeIdx : 0);
        }
      } catch (err) {
        showToast(`Failed to fetch ${TYPE_CONFIGS[activeType].file}. Starting fresh.`, 'error');
        setDb(getEmptyData(activeType));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeType]);

  // Handle Export / Download
  const handleExport = () => {
    if (!db) return;
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = TYPE_CONFIGS[activeType].file;
    a.click();
    showToast('File exported ✓');
  };

  // Copy JSON to Clipboard
  const handleCopy = () => {
    if (!db) return;
    navigator.clipboard.writeText(JSON.stringify(db, null, 2))
      .then(() => showToast('JSON copied to clipboard ✓'))
      .catch(() => showToast('Copy failed', 'error'));
  };

  // Save changes directly back to filesystem (Dev mode only)
  const handleSaveToDisk = async () => {
    if (!db) return;
    try {
      const res = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeType, data: db }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast('Saved to workspace file successfully ✓');
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (err: any) {
      showToast(err.message || 'Saving failed', 'error');
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const cleanedData = cleanLoadedData(activeType, parsed);
        setDb(cleanedData);
        showToast('Uploaded JSON loaded successfully ✓');
      } catch (err) {
        showToast('Invalid JSON structure', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const cleanedData = cleanLoadedData(activeType, parsed);
        setDb(cleanedData);
        showToast('Dropped JSON loaded successfully ✓');
      } catch (err) {
        showToast('Invalid JSON structure', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Touch-based Drag and Drop for mobile support
  const handleTouchStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIdx === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = element?.closest('[data-index]');
    if (!card) return;
    const targetIdxStr = card.getAttribute('data-index');
    if (targetIdxStr === null) return;
    const targetIdx = parseInt(targetIdxStr, 10);
    if (isNaN(targetIdx) || targetIdx === draggedIdx) return;

    const listName = activeType === 'executives' ? 'members' : activeType;
    const newDb = { ...db };
    if (activeType === 'executives') {
      const list = [...newDb.committees[selectedCommitteeIdx].members];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(targetIdx, 0, draggedItem);
      newDb.committees[selectedCommitteeIdx].members = list;
    } else {
      const list = [...newDb[listName]];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(targetIdx, 0, draggedItem);
      newDb[listName] = list;
    }
    setDb(newDb);
    setDraggedIdx(targetIdx);
  };

  const handleTouchEnd = () => {
    setDraggedIdx(null);
  };

  // Reordering array states using DnD
  const onDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const onDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    
    // Perform live reordering on dragover for instant feedback
    const listName = activeType === 'executives' ? 'members' : activeType;
    const newDb = { ...db };
    
    if (activeType === 'executives') {
      const list = [...newDb.committees[selectedCommitteeIdx].members];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(targetIdx, 0, draggedItem);
      newDb.committees[selectedCommitteeIdx].members = list;
    } else {
      const list = [...newDb[listName]];
      const draggedItem = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(targetIdx, 0, draggedItem);
      newDb[listName] = list;
    }
    
    setDb(newDb);
    setDraggedIdx(targetIdx);
  };

  const onDragEnd = () => {
    setDraggedIdx(null);
    setDraggableIdx(null);
  };

  // Helper syntax highlighter for the live preview box
  const highlightJson = (json: string) => {
    if (!json) return '';
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'j-num';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'j-key';
          } else {
            cls = 'j-str';
          }
        } else if (/true|false/.test(match)) {
          cls = 'j-bool';
        } else if (/null/.test(match)) {
          cls = 'j-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  // ----------------------------------------------------
  // SUB-EDITORS RENDERING
  // ----------------------------------------------------

  // 1. Executives Editor
  const renderExecutivesEditor = () => {
    if (!db.committees) return null;
    const committees = db.committees || [];
    const currentComm = committees[selectedCommitteeIdx];

    const addCommittee = () => {
      const session = prompt('Enter Session ID (e.g. 2027-28, hyphens only):');
      if (!session) return;
      const label = prompt('Enter Display Label (e.g. 2027 – 2028):');
      if (!label) return;

      const newDb = { ...db };
      newDb.committees.unshift({
        session,
        label,
        total_members: 0,
        members: []
      });
      setDb(newDb);
      setSelectedCommitteeIdx(0);
      showToast('Committee session added');
    };

    const deleteCommittee = (idx: number) => {
      if (!confirm('Are you sure you want to delete this entire committee session?')) return;
      const newDb = { ...db };
      newDb.committees.splice(idx, 1);
      setDb(newDb);
      setSelectedCommitteeIdx(0);
      showToast('Committee session deleted');
    };

    const updateCommField = (field: string, val: any) => {
      const newDb = { ...db };
      newDb.committees[selectedCommitteeIdx][field] = val;
      setDb(newDb);
    };

    const addMember = () => {
      if (!currentComm) return;
      const newDb = { ...db };
      newDb.committees[selectedCommitteeIdx].members.push({
        id: `m-${Date.now()}`,
        initial: 'N',
        name: 'New Executive Member',
        role: 'Executive Member',
        role_display: '// EXECUTIVE MEMBER',
        department: 'Statistics',
        bio: 'Short biography.',
        socials: []
      });
      setDb(newDb);
      setOpenSectionIdx(newDb.committees[selectedCommitteeIdx].members.length - 1);
    };

    const updateMemberField = (mIdx: number, field: string, val: any) => {
      const newDb = { ...db };
      newDb.committees[selectedCommitteeIdx].members[mIdx][field] = val;
      setDb(newDb);
    };

    const deleteMember = (mIdx: number) => {
      if (!confirm('Delete this member?')) return;
      const newDb = { ...db };
      newDb.committees[selectedCommitteeIdx].members.splice(mIdx, 1);
      setDb(newDb);
      showToast('Member removed');
    };

    const addSocial = (mIdx: number) => {
      const type = prompt('Select type (linkedin, github, facebook, email, codeforces, website):');
      if (!type) return;
      const label = prompt('Display label (e.g. LinkedIn):');
      if (!label) return;
      const url = prompt('Link URL (e.g. https://...):');
      if (!url) return;

      const newDb = { ...db };
      newDb.committees[selectedCommitteeIdx].members[mIdx].socials.push({ type, label, url });
      setDb(newDb);
    };

    const deleteSocial = (mIdx: number, sIdx: number) => {
      const newDb = { ...db };
      newDb.committees[selectedCommitteeIdx].members[mIdx].socials.splice(sIdx, 1);
      setDb(newDb);
    };

    return (
      <div>
        <div className="cc-row">
          <div className="field">
            <span className="cc-label">ACTIVE COMMITTEE SESSION</span>
            <select
              className="cc-select"
              value={db.current_committee}
              onChange={(e) => setDb({ ...db, current_committee: e.target.value })}
            >
              {committees.map((c: any) => (
                <option key={c.session} value={c.session}>{c.session}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={addCommittee}>+ Add Committee</button>
        </div>

        {committees.length > 0 && (
          <div className="committee-block open" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div className="editor-section-header">
              <div className="field" style={{ flex: 1 }}>
                <label>EDITING COMMITTEE SESSION</label>
                <select
                  className="cc-select"
                  value={selectedCommitteeIdx}
                  onChange={(e) => {
                    setSelectedCommitteeIdx(Number(e.target.value));
                    setOpenSectionIdx(null);
                  }}
                >
                  {committees.map((c: any, idx: number) => (
                    <option key={c.session} value={idx}>{c.label} ({c.session})</option>
                  ))}
                </select>
              </div>
              {committees.length > 1 && (
                <button className="btn btn-danger btn-sm" onClick={() => deleteCommittee(selectedCommitteeIdx)}>Delete Committee</button>
              )}
            </div>

            {currentComm && (
              <div className="inline-fields">
                <div className="field">
                  <label>Display Label</label>
                  <input
                    type="text"
                    value={currentComm.label || ''}
                    onChange={(e) => updateCommField('label', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Total Members Headcount (Optional override)</label>
                  <input
                    type="number"
                    value={currentComm.total_members || 0}
                    onChange={(e) => updateCommField('total_members', Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {currentComm && (
          <div style={{ marginTop: '2.5rem' }}>
            <div className="editor-section-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Members ({currentComm.members?.length || 0})</h3>
              <button className="btn btn-primary btn-sm" onClick={addMember}>+ Add Member</button>
            </div>

            <div className="members-list">
              {(currentComm.members || []).map((m: any, idx: number) => (
                <div
                  key={m.id || idx}
                  className={`member-card ${openSectionIdx === idx ? 'open' : ''}`}
                  data-index={idx}
                  draggable={draggableIdx === idx}
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  style={{ opacity: draggedIdx === idx ? 0.3 : 1 }}
                >
                  <div
                    className="mc-header"
                    onClick={(e) => {
                      // Only expand if they didn't click actions/inputs
                      if (!(e.target as HTMLElement).closest('.mc-actions') && !(e.target as HTMLElement).closest('.drag-handle')) {
                        setOpenSectionIdx(openSectionIdx === idx ? null : idx);
                      }
                    }}
                  >
                    <div
                      className="drag-handle"
                      onMouseDown={() => setDraggableIdx(idx)}
                      onMouseUp={() => setDraggableIdx(null)}
                      onTouchStart={() => handleTouchStart(idx)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{ cursor: 'grab', fontSize: '1.2rem', padding: '0 .5rem', userSelect: 'none', color: 'var(--mut)' }}
                    >
                      ⠿
                    </div>
                    <div className={`mc-av ${m.is_president ? '' : 'alt'}`}>{m.initial || 'M'}</div>
                    <div className="mc-info">
                      <div className="mc-name">{m.name || 'Unnamed Member'}</div>
                      <div className="mc-role">{m.role || 'Executive Member'}</div>
                    </div>
                    <div className="mc-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteMember(idx)} style={{ color: 'var(--red)' }}>✕</button>
                    </div>
                  </div>

                  <div className="mc-body">
                    <div className="mc-fields">
                      <div className="field">
                        <label>Member ID Slug (Unique)</label>
                        <input
                          type="text"
                          value={m.id || ''}
                          onChange={(e) => updateMemberField(idx, 'id', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Name</label>
                        <input
                          type="text"
                          value={m.name || ''}
                          onChange={(e) => updateMemberField(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Role</label>
                        <input
                          type="text"
                          value={m.role || ''}
                          onChange={(e) => updateMemberField(idx, 'role', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Display Role (Uppercase, e.g. // COORDINATOR)</label>
                        <input
                          type="text"
                          value={m.role_display || ''}
                          onChange={(e) => updateMemberField(idx, 'role_display', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Department / Year info</label>
                        <input
                          type="text"
                          value={m.department || ''}
                          onChange={(e) => updateMemberField(idx, 'department', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Avatar Initial</label>
                        <input
                          type="text"
                          maxLength={1}
                          value={m.initial || ''}
                          onChange={(e) => updateMemberField(idx, 'initial', e.target.value)}
                        />
                      </div>
                      <div className="field full">
                        <label>Bio (1-3 sentences)</label>
                        <textarea
                          value={m.bio || ''}
                          onChange={(e) => updateMemberField(idx, 'bio', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="toggle-row">
                      <div
                        className={`toggle ${m.is_president ? 'on' : ''}`}
                        onClick={() => updateMemberField(idx, 'is_president', !m.is_president)}
                      />
                      <label onClick={() => updateMemberField(idx, 'is_president', !m.is_president)}>
                        Is Committee President (Gets featured banner)
                      </label>
                    </div>

                    <div className="socials-section">
                      <div className="socials-label">Social Handles</div>
                      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {(m.socials || []).map((s: any, sIdx: number) => (
                          <div key={sIdx} style={{ background: 'var(--s3)', border: '1px solid var(--b2)', padding: '.3rem .6rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '.5rem', fontSize: '.75rem' }}>
                            <span style={{ color: 'var(--ac)' }}>{s.label}</span>
                            <button
                              onClick={() => deleteSocial(idx, sIdx)}
                              style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => addSocial(idx)}>+ Add Link</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 2. Projects Editor
  const renderProjectsEditor = () => {
    const list = db.projects || [];

    const addProject = () => {
      const newDb = { ...db };
      newDb.projects.unshift({
        id: `proj-${Date.now()}`,
        title: 'New Contribution Project',
        description: 'Detail your contribution here.',
        status: 'active',
        tags: ['TypeScript'],
        members: 'Author / Contributor',
        year: new Date().getFullYear().toString()
      });
      setDb(newDb);
      setOpenSectionIdx(0);
    };

    const updateProjField = (idx: number, field: string, val: any) => {
      const newDb = { ...db };
      newDb.projects[idx][field] = val;
      setDb(newDb);
    };

    const updateTags = (idx: number, val: string) => {
      const tags = val.split(',').map(t => t.trim()).filter(Boolean);
      updateProjField(idx, 'tags', tags);
    };

    const deleteProject = (idx: number) => {
      if (!confirm('Are you sure you want to delete this project?')) return;
      const newDb = { ...db };
      newDb.projects.splice(idx, 1);
      setDb(newDb);
      showToast('Project deleted');
    };

    return (
      <div>
        <div className="editor-section-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Project Entries ({list.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={addProject}>+ Add Project</button>
        </div>

        <div className="proj-list">
          {list.map((p: any, idx: number) => (
            <div
              key={p.id || idx}
              className={`proj-card-edit ${openSectionIdx === idx ? 'open' : ''} ${p.featured ? 'featured-card' : ''}`}
              data-index={idx}
              draggable={draggableIdx === idx}
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              style={{ opacity: draggedIdx === idx ? 0.3 : 1 }}
            >
              <div
                className="pc-header"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.mc-actions') && !(e.target as HTMLElement).closest('.drag-handle')) {
                    setOpenSectionIdx(openSectionIdx === idx ? null : idx);
                  }
                }}
              >
                <div
                  className="drag-handle"
                  onMouseDown={() => setDraggableIdx(idx)}
                  onMouseUp={() => setDraggableIdx(null)}
                  onTouchStart={() => handleTouchStart(idx)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ cursor: 'grab', fontSize: '1.2rem', padding: '0 .5rem', userSelect: 'none', color: 'var(--mut)' }}
                >
                  ⠿
                </div>
                <div className={`pc-status-dot dot-${p.status || 'active'}`}></div>
                <div className="pc-info">
                  <div className="pc-title">{p.title || 'Untitled Project'}</div>
                  <div className="pc-meta">{p.members} · {p.year}</div>
                </div>
                <div className="mc-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteProject(idx)} style={{ color: 'var(--red)' }}>✕</button>
                </div>
              </div>

              <div className="pc-body">
                <div className="pc-fields">
                  <div className="field">
                    <label>Project ID Slug</label>
                    <input
                      type="text"
                      value={p.id || ''}
                      onChange={(e) => updateProjField(idx, 'id', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Title</label>
                    <input
                      type="text"
                      value={p.title || ''}
                      onChange={(e) => updateProjField(idx, 'title', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Contributors / Authors</label>
                    <input
                      type="text"
                      value={p.members || ''}
                      onChange={(e) => updateProjField(idx, 'members', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select
                      value={p.status || 'active'}
                      onChange={(e) => updateProjField(idx, 'status', e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="research">Research</option>
                      <option value="publication">Publication</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Year</label>
                    <input
                      type="text"
                      value={p.year || ''}
                      onChange={(e) => updateProjField(idx, 'year', e.target.value)}
                    />
                  </div>
                  <div className="toggle-row" style={{ marginTop: '1.25rem' }}>
                    <div
                      className={`toggle ${p.featured ? 'on' : ''}`}
                      onClick={() => updateProjField(idx, 'featured', !p.featured)}
                    />
                    <label onClick={() => updateProjField(idx, 'featured', !p.featured)}>
                      Is Featured (Highlights card)
                    </label>
                  </div>
                  <div className="field">
                    <label>Code Repository URL</label>
                    <input
                      type="text"
                      value={p.link || ''}
                      onChange={(e) => updateProjField(idx, 'link', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Demo / DOI URL</label>
                    <input
                      type="text"
                      value={p.demo_link || ''}
                      onChange={(e) => updateProjField(idx, 'demo_link', e.target.value)}
                    />
                  </div>
                  <div className="field full">
                    <label>Description</label>
                    <textarea
                      value={p.description || ''}
                      onChange={(e) => updateProjField(idx, 'description', e.target.value)}
                    />
                  </div>
                  <div className="field full">
                    <label>Tech Tags (Comma separated, e.g. Python, pandas, Next.js)</label>
                    <input
                      type="text"
                      value={(p.tags || []).join(', ')}
                      onChange={(e) => updateTags(idx, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. Events Editor
  const renderEventsEditor = () => {
    const list = db.events || [];

    const addEvent = () => {
      const newDb = { ...db };
      newDb.events.unshift({
        id: `ev-${Date.now()}`,
        title: 'New Programming Contest',
        date: getTodayStr(),
        time: '2:30 PM',
        location: 'CU Computer Lab, Science Faculty',
        audience: 'Statistics Students',
        type: 'contest'
      });
      setDb(newDb);
      setOpenSectionIdx(0);
    };

    const updateEventField = (idx: number, field: string, val: any) => {
      const newDb = { ...db };
      newDb.events[idx][field] = val;
      setDb(newDb);
    };

    const deleteEvent = (idx: number) => {
      if (!confirm('Are you sure you want to delete this event?')) return;
      const newDb = { ...db };
      newDb.events.splice(idx, 1);
      setDb(newDb);
      showToast('Event removed');
    };

    return (
      <div>
        <div className="note-field">
          <label>Global Footer Notice (Displayed under events list on site)</label>
          <input
            type="text"
            value={db.note || ''}
            onChange={(e) => setDb({ ...db, note: e.target.value })}
            placeholder="e.g. Events are posted here one week in advance."
          />
        </div>

        <div className="sort-notice">// Events are dynamically sorted by date ascending on the live site.</div>

        <div className="editor-section-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Upcoming Events ({list.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={addEvent}>+ Add Event</button>
        </div>

        <div className="ev-list">
          {list.map((ev: any, idx: number) => {
            const dateObj = new Date(ev.date || '');
            const dayStr = isNaN(dateObj.getDate()) ? '?' : dateObj.getDate().toString();
            const monStr = isNaN(dateObj.getMonth()) ? '?' : dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
            
            return (
              <div
                key={ev.id || idx}
                className={`ev-card ${openSectionIdx === idx ? 'open' : ''}`}
                data-index={idx}
                draggable={draggableIdx === idx}
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                style={{ opacity: draggedIdx === idx ? 0.3 : 1 }}
              >
                <div
                  className="ev-header"
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('.mc-actions') && !(e.target as HTMLElement).closest('.drag-handle')) {
                      setOpenSectionIdx(openSectionIdx === idx ? null : idx);
                    }
                  }}
                >
                  <div
                    className="drag-handle"
                    onMouseDown={() => setDraggableIdx(idx)}
                    onMouseUp={() => setDraggableIdx(null)}
                    onTouchStart={() => handleTouchStart(idx)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ cursor: 'grab', fontSize: '1.2rem', padding: '0 .5rem', userSelect: 'none', color: 'var(--mut)' }}
                  >
                    ⠿
                  </div>
                  <div className="ev-hdate">
                    <div className="ev-hmon">{monStr}</div>
                    <div className="ev-hday">{dayStr}</div>
                  </div>
                  <div className="ev-hinfo">
                    <div className="ev-htitle">{ev.title || 'Untitled Event'}</div>
                    <div className="ev-hmeta">{ev.location} · {ev.time}</div>
                  </div>
                  <span className={`ev-type-tag tag-${ev.type || 'upcoming'}`}>{ev.type?.toUpperCase()}</span>
                  <div className="mc-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteEvent(idx)} style={{ color: 'var(--red)' }}>✕</button>
                  </div>
                </div>

                <div className="ev-body">
                  <div className="ev-fields">
                    <div className="field">
                      <label>Event ID Slug</label>
                      <input
                        type="text"
                        value={ev.id || ''}
                        onChange={(e) => updateEventField(idx, 'id', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Title</label>
                      <input
                        type="text"
                        value={ev.title || ''}
                        onChange={(e) => updateEventField(idx, 'title', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Type</label>
                      <select
                        value={ev.type || 'upcoming'}
                        onChange={(e) => updateEventField(idx, 'type', e.target.value)}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="workshop">Workshop</option>
                        <option value="contest">Contest</option>
                        <option value="seminar">Seminar</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Date</label>
                      <input
                        type="date"
                        value={ev.date || ''}
                        min={getTodayStr()}
                        onChange={(e) => {
                          const val = e.target.value;
                          const todayStr = getTodayStr();
                          if (!val) {
                            updateEventField(idx, 'date', todayStr);
                            return;
                          }
                          if (val < todayStr) {
                            showToast('Event date cannot be in the past', 'error');
                            updateEventField(idx, 'date', todayStr);
                          } else {
                            updateEventField(idx, 'date', val);
                          }
                        }}
                      />
                    </div>
                    <div className="field">
                      <label>Time info</label>
                      <input
                        type="text"
                        value={ev.time || ''}
                        onChange={(e) => updateEventField(idx, 'time', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Audience level / restrictions</label>
                      <input
                        type="text"
                        value={ev.audience || ''}
                        onChange={(e) => updateEventField(idx, 'audience', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Location / Room</label>
                      <input
                        type="text"
                        value={ev.location || ''}
                        onChange={(e) => updateEventField(idx, 'location', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Registration Link (Google Forms etc.)</label>
                      <input
                        type="text"
                        value={ev.register_link || ''}
                        onChange={(e) => updateEventField(idx, 'register_link', e.target.value)}
                      />
                    </div>
                    <div className="field full">
                      <label>View Details URL (Facebook post/LinkedIn etc.)</label>
                      <input
                        type="text"
                        value={ev.details_link || ''}
                        onChange={(e) => updateEventField(idx, 'details_link', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 4. Courses Editor
  const renderCoursesEditor = () => {
    const list = db.courses || [];

    const addCourse = () => {
      const newDb = { ...db };
      newDb.courses.unshift({
        id: `c-${Date.now()}`,
        title: 'Python Certification Course',
        provider: 'Statistics Programming Club',
        description: 'Learn programming fundamentals.',
        type: 'course',
        year: new Date().getFullYear().toString()
      });
      setDb(newDb);
      setOpenSectionIdx(0);
    };

    const updateCourseField = (idx: number, field: string, val: any) => {
      const newDb = { ...db };
      newDb.courses[idx][field] = val;
      setDb(newDb);
    };

    const deleteCourse = (idx: number) => {
      if (!confirm('Are you sure you want to delete this course?')) return;
      const newDb = { ...db };
      newDb.courses.splice(idx, 1);
      setDb(newDb);
      showToast('Course removed');
    };

    return (
      <div>
        <div className="editor-section-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Courses & Certifications ({list.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={addCourse}>+ Add Course</button>
        </div>

        <div id="courses-container">
          {list.map((c: any, idx: number) => (
            <div
              key={c.id || idx}
              className={`ach-card ${openSectionIdx === idx ? 'open' : ''}`}
              data-index={idx}
              draggable={draggableIdx === idx}
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              style={{ opacity: draggedIdx === idx ? 0.3 : 1 }}
            >
              <div
                className="ach-header"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.mc-actions') && !(e.target as HTMLElement).closest('.drag-handle')) {
                    setOpenSectionIdx(openSectionIdx === idx ? null : idx);
                  }
                }}
              >
                <div
                  className="drag-handle"
                  onMouseDown={() => setDraggableIdx(idx)}
                  onMouseUp={() => setDraggableIdx(null)}
                  onTouchStart={() => handleTouchStart(idx)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ cursor: 'grab', fontSize: '1.2rem', padding: '0 .5rem', userSelect: 'none', color: 'var(--mut)' }}
                >
                  ⠿
                </div>
                <div className="ach-medal">🎓</div>
                <div className="ach-hinfo">
                  <div className="ach-htitle">{c.title || 'Untitled Course'}</div>
                  <div className="ach-hmeta">{c.provider} · {c.year}</div>
                </div>
                <span className="current-tag" style={{ background: c.type === 'course' ? 'var(--bld)' : 'var(--pud)', color: c.type === 'course' ? 'var(--bl)' : 'var(--pu)', borderColor: 'transparent' }}>
                  {c.type?.toUpperCase()}
                </span>
                <div className="mc-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteCourse(idx)} style={{ color: 'var(--red)' }}>✕</button>
                </div>
              </div>

              <div className="ach-body">
                <div className="ach-fields">
                  <div className="field">
                    <label>Course ID Slug</label>
                    <input
                      type="text"
                      value={c.id || ''}
                      onChange={(e) => updateCourseField(idx, 'id', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Title</label>
                    <input
                      type="text"
                      value={c.title || ''}
                      onChange={(e) => updateCourseField(idx, 'title', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Provider</label>
                    <input
                      type="text"
                      value={c.provider || ''}
                      onChange={(e) => updateCourseField(idx, 'provider', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Type</label>
                    <select
                      value={c.type || 'course'}
                      onChange={(e) => updateCourseField(idx, 'type', e.target.value)}
                    >
                      <option value="course">Course</option>
                      <option value="certificate">Certificate</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Year</label>
                    <input
                      type="text"
                      value={c.year || ''}
                      onChange={(e) => updateCourseField(idx, 'year', e.target.value)}
                    />
                  </div>
                  <div className="toggle-row" style={{ marginTop: '1.25rem' }}>
                    <div
                      className={`toggle ${c.featured ? 'on' : ''}`}
                      onClick={() => updateCourseField(idx, 'featured', !c.featured)}
                    />
                    <label onClick={() => updateCourseField(idx, 'featured', !c.featured)}>
                      Is Featured (Highlights card)
                    </label>
                  </div>
                  <div className="field full">
                    <label>URL Link (Syllabus or details page)</label>
                    <input
                      type="text"
                      value={c.link || ''}
                      onChange={(e) => updateCourseField(idx, 'link', e.target.value)}
                    />
                  </div>
                  <div className="field full">
                    <label>Description</label>
                    <textarea
                      value={c.description || ''}
                      onChange={(e) => updateCourseField(idx, 'description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 5. Achievements Editor
  const renderAchievementsEditor = () => {
    const tally = db.tally || [];
    const list = db.achievements || [];

    const addTally = () => {
      const newDb = { ...db };
      newDb.tally.push({ value: '1', label: 'New Gold Medal' });
      setDb(newDb);
    };

    const updateTally = (tIdx: number, field: string, val: string) => {
      const newDb = { ...db };
      newDb.tally[tIdx][field] = val;
      setDb(newDb);
    };

    const removeTally = (tIdx: number) => {
      const newDb = { ...db };
      newDb.tally.splice(tIdx, 1);
      setDb(newDb);
    };

    const addAchievement = () => {
      const newDb = { ...db };
      newDb.achievements.unshift({
        title: 'Champion — Intra CU Contest',
        event: 'Chittagong University Coding Contest',
        category: 'Programming Contest',
        year: new Date().getFullYear().toString(),
        tier: 'gold',
        team_label: 'Team',
        team: 'Club Members'
      });
      setDb(newDb);
      setOpenSectionIdx(0);
    };

    const updateAchField = (idx: number, field: string, val: any) => {
      const newDb = { ...db };
      newDb.achievements[idx][field] = val;
      setDb(newDb);
    };

    const deleteAchievement = (idx: number) => {
      if (!confirm('Are you sure you want to delete this achievement?')) return;
      const newDb = { ...db };
      newDb.achievements.splice(idx, 1);
      setDb(newDb);
      showToast('Achievement entry removed');
    };

  const onTallyDragStart = (idx: number) => setDraggedTallyIdx(idx);
  const onTallyDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedTallyIdx === null || draggedTallyIdx === targetIdx) return;
    const newDb = { ...db };
    const list = [...newDb.tally];
    const draggedItem = list[draggedTallyIdx];
    list.splice(draggedTallyIdx, 1);
    list.splice(targetIdx, 0, draggedItem);
    newDb.tally = list;
    setDb(newDb);
    setDraggedTallyIdx(targetIdx);
  };
  const onTallyDragEnd = () => setDraggedTallyIdx(null);

    return (
      <div>
        {/* Medal Tally Strip */}
        <div className="committee-block open" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="editor-section-header">
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Medal Tally Strip (Top display bar on site)</h4>
            <button className="btn btn-secondary btn-sm" onClick={addTally}>+ Add Medal Box</button>
          </div>
          <div className="tally-grid">
            {tally.map((t: any, idx: number) => (
              <div 
                key={idx} 
                className="tally-card" 
                style={{ position: 'relative', cursor: 'grab', opacity: draggedTallyIdx === idx ? 0.4 : 1 }}
                draggable
                onDragStart={() => onTallyDragStart(idx)}
                onDragOver={(e) => onTallyDragOver(e, idx)}
                onDragEnd={onTallyDragEnd}
              >
                <button
                  onClick={() => removeTally(idx)}
                  style={{ position: 'absolute', top: '.5rem', right: '.5rem', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '.8rem' }}
                >
                  ✕
                </button>
                <div className="field">
                  <label>Value / Count</label>
                  <input
                    type="text"
                    value={t.value || ''}
                    onChange={(e) => updateTally(idx, 'value', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Label</label>
                  <input
                    type="text"
                    value={t.label || ''}
                    onChange={(e) => updateTally(idx, 'label', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements list */}
        <div className="editor-section-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Record Achievements ({list.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={addAchievement}>+ Add Achievement</button>
        </div>

        <div className="ach-list">
          {list.map((a: any, idx: number) => {
            const medals: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉', special: '🏆', community: '🎖️' };
            const emoji = medals[a.tier || 'gold'] || '🏆';
            return (
              <div
                key={idx}
                className={`ach-card ${openSectionIdx === idx ? 'open' : ''}`}
                data-index={idx}
                draggable={draggableIdx === idx}
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                style={{ opacity: draggedIdx === idx ? 0.3 : 1 }}
              >
                <div
                  className="ach-header"
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('.mc-actions') && !(e.target as HTMLElement).closest('.drag-handle')) {
                      setOpenSectionIdx(openSectionIdx === idx ? null : idx);
                    }
                  }}
                >
                  <div
                    className="drag-handle"
                    onMouseDown={() => setDraggableIdx(idx)}
                    onMouseUp={() => setDraggableIdx(null)}
                    onTouchStart={() => handleTouchStart(idx)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ cursor: 'grab', fontSize: '1.2rem', padding: '0 .5rem', userSelect: 'none', color: 'var(--mut)' }}
                  >
                    ⠿
                  </div>
                  <div className="ach-medal">{emoji}</div>
                  <div className="ach-hinfo">
                    <div className="ach-htitle">{a.title || 'Untitled Achievement'}</div>
                    <div className="ach-hmeta">{a.event} · {a.year}</div>
                  </div>
                  <span className="current-tag" style={{ textTransform: 'uppercase' }}>{a.tier}</span>
                  <div className="mc-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteAchievement(idx)} style={{ color: 'var(--red)' }}>✕</button>
                  </div>
                </div>

                <div className="ach-body">
                  <div className="ach-fields">
                    <div className="field">
                      <label>Title</label>
                      <input
                        type="text"
                        value={a.title || ''}
                        onChange={(e) => updateAchField(idx, 'title', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Competition Event</label>
                      <input
                        type="text"
                        value={a.event || ''}
                        onChange={(e) => updateAchField(idx, 'event', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Tier (Controls medal icon)</label>
                      <select
                        value={a.tier || 'gold'}
                        onChange={(e) => updateAchField(idx, 'tier', e.target.value)}
                      >
                        <option value="gold">🥇 Gold</option>
                        <option value="silver">🥈 Silver</option>
                        <option value="bronze">🥉 Bronze</option>
                        <option value="special">🏆 Special</option>
                        <option value="community">🎖️ Community</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Category</label>
                      <input
                        type="text"
                        value={a.category || ''}
                        onChange={(e) => updateAchField(idx, 'category', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Year</label>
                      <input
                        type="text"
                        value={a.year || ''}
                        onChange={(e) => updateAchField(idx, 'year', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Team Label prefix (e.g. Team, Authors, Member)</label>
                      <input
                        type="text"
                        value={a.team_label || ''}
                        onChange={(e) => updateAchField(idx, 'team_label', e.target.value)}
                      />
                    </div>
                    <div className="field full">
                      <label>Names of Members / team name</label>
                      <input
                        type="text"
                        value={a.team || ''}
                        onChange={(e) => updateAchField(idx, 'team', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // MAIN CORE RENDERING
  // ----------------------------------------------------

  const renderActiveEditorForm = () => {
    switch (activeType) {
      case 'executives': return renderExecutivesEditor();
      case 'projects': return renderProjectsEditor();
      case 'events': return renderEventsEditor();
      case 'courses': return renderCoursesEditor();
      case 'achievements': return renderAchievementsEditor();
    }
  };

  return (
    <div className={`admin-page-root ${collapsed ? 'sb-closed' : ''}`}>
      {/* Decorative Glow elements */}
      <div className="glow-tl" />
      <div className="glow-br" />

      {/* Sidebar Navigation */}
      <nav className={`admin-sb ${collapsed ? 'col' : ''}`}>
        <div className="asbh">
          <div className="asbh-top">
            <div className="logo" style={{ fontFamily: 'var(--fd)', fontSize: '1.4rem', fontWeight: 'bold' }}>
              Statistics<span style={{ color: 'var(--ac)' }}>.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div id="theme-toggle" onClick={toggleTheme} style={{ cursor: 'pointer' }} title="Toggle Theme">
                <div className="theme-switch">
                  <div className="switch-thumb">
                    {theme === 'dark' ? (
                      <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                      </svg>
                    ) : (
                      <span style={{ fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>☀️</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="asb-toggle" onClick={() => setCollapsed(!collapsed)} title="Toggle Sidebar">
                {collapsed ? '›' : '‹'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.3rem' }}>
            <div className="admin-badge">ADMIN PANEL</div>
          </div>
        </div>

        <div className="asbn">
          {Object.entries(TYPE_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveType(key as EditorType)}
              className={`asb-item ${activeType === key ? 'active' : ''}`}
            >
              <span className="asbi">
                {key === 'executives' ? '{}' : key === 'projects' ? '⬡' : key === 'events' ? '›_' : key === 'courses' ? '◈' : '★'}
              </span>
              <span className="asbt">{config.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="asbf">
          <Link href="/" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
            ← Back to Site
          </Link>
        </div>
      </nav>

      {/* Mobile Top Navbar */}
      <div className="admin-tn">
        <div className="atn-brand">
          <div className="logo" style={{ fontFamily: 'var(--fd)', fontSize: '1.4rem', fontWeight: 'bold' }}>
            Statistics<span style={{ color: 'var(--ac)' }}>.</span>
          </div>
          <div className="admin-badge">ADMIN</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div onClick={toggleTheme} style={{ cursor: 'pointer' }} title="Toggle Theme">
            <div className="theme-switch">
              <div className="switch-thumb">
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <span style={{ fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>☀️</span>
                )}
              </div>
            </div>
          </div>
          <button className="atn-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`admin-mm ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="amm-content">
          {Object.entries(TYPE_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setActiveType(key as EditorType);
                setMobileMenuOpen(false);
              }}
              className={`amm-item ${activeType === key ? 'active' : ''}`}
            >
              <span className="amm-i">
                {key === 'executives' ? '{}' : key === 'projects' ? '⬡' : key === 'events' ? '›_' : key === 'courses' ? '◈' : '★'}
              </span>
              <span>{config.title}</span>
            </button>
          ))}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--b)', paddingTop: '1.5rem' }}>
            <Link href="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              ← Exit Editor
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className={`main ${collapsed ? 'col' : ''}`}>
        <div className="editor-panel" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '2.5rem 1.5rem', overflowY: 'visible', borderRight: 'none' }}>
          
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--b)', paddingBottom: '1.25rem', marginBottom: '2rem', marginTop: 'calc(var(--atn-h) - 40px)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="section-title" style={{ margin: 0, fontSize: '1.8rem' }}>
                  <span className="eyebrow">DATABASE WRITER</span>
                  {TYPE_CONFIGS[activeType].title}
                </h1>
                <p style={{ color: 'var(--mut)', fontSize: '.85rem', marginTop: '.4rem' }}>
                  {TYPE_CONFIGS[activeType].desc}
                </p>
              </div>
            </div>

            <div className="topbar-actions">
              <label className={`btn btn-secondary btn-sm ${jsonError ? 'disabled' : ''}`} style={{ pointerEvents: jsonError ? 'none' : 'auto', opacity: jsonError ? 0.5 : 1, margin: 0 }}>
                📂 Load
                <input type="file" accept=".json" onChange={handleFileUpload} disabled={!!jsonError} style={{ display: 'none' }} />
              </label>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
                disabled={!!jsonError}
                style={{ opacity: jsonError ? 0.5 : 1 }}
              >
                📋 Copy
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExport}
                disabled={!!jsonError}
                style={{ opacity: jsonError ? 0.5 : 1 }}
              >
                ⬇ Export
              </button>
              {isDev && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveToDisk}
                  disabled={!!jsonError}
                  style={{ opacity: jsonError ? 0.5 : 1 }}
                >
                  💾 Save
                </button>
              )}
            </div>
          </div>

          {!db ? (
            <div className="load-screen" style={{ minHeight: 'auto', padding: '1rem 0' }}>
              {loading ? (
                <div style={{ color: 'var(--mut)', padding: '2rem 0', fontFamily: 'var(--fm)' }}>// Fetching database resource...</div>
              ) : (
                <div className="load-card" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                  <div className="load-icon">📂</div>
                  <h2>Load Database Schema</h2>
                  <p>Drag and drop a compatible `{TYPE_CONFIGS[activeType].file}` file here, or select load to search locally.</p>
                  <label className="dropzone">
                    Click to browse files or drop it here
                    <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  <div className="load-divider">
                    <span>OR</span>
                  </div>
                  <button className="btn btn-primary btn-new-db" onClick={() => setDb(getEmptyData(activeType))}>
                    Initialize Clean Database
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {jsonError && (
                <div className="debugger-banner" style={{ background: 'var(--redd)', border: '1px solid rgba(248,113,113,.25)', borderRadius: '8px', padding: '.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '.6rem', fontSize: '.78rem', color: 'var(--red)', fontFamily: 'var(--fm)', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '1rem', lineHeight: '1' }}>⚠️</span>
                  <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{jsonError}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--b)', paddingBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '.5rem', background: 'var(--s2)', padding: '4px', borderRadius: '24px', border: '1px solid var(--b2)' }}>
                  <button 
                    onClick={() => { if (isEditMode) toggleEditMode(); }} 
                    className={`btn btn-sm ${!isEditMode ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderRadius: '20px', border: 'none', background: !isEditMode ? 'var(--ac)' : 'transparent', color: !isEditMode ? '#000' : 'var(--mut)' }}
                  >
                    🎨 GUI Editor
                  </button>
                  <button 
                    onClick={() => { if (!isEditMode) toggleEditMode(); }} 
                    className={`btn btn-sm ${isEditMode ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderRadius: '20px', border: 'none', background: isEditMode ? 'var(--ac)' : 'transparent', color: isEditMode ? '#000' : 'var(--mut)' }}
                  >
                    ✏️ JSON Editor
                  </button>
                </div>

                {isEditMode && (
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      title="Undo"
                      style={{ padding: '.35rem .65rem', minWidth: 'auto', opacity: undoStack.length === 0 ? 0.5 : 1 }}
                    >
                      ↩️
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      title="Redo"
                      style={{ padding: '.35rem .65rem', minWidth: 'auto', opacity: redoStack.length === 0 ? 0.5 : 1 }}
                    >
                      ↪️
                    </button>
                  </div>
                )}
              </div>

              {isEditMode ? (
                <div className="editor-wrapper" style={{ display: 'flex', flex: 1, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: '8px', overflow: 'hidden', minHeight: '600px' }}>
                  <div className="gutter" style={{ width: '45px', background: 'var(--s)', borderRight: '1px solid var(--b)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '.7rem 0', userSelect: 'none', overflowY: 'hidden' }}>
                    {editorText.split('\n').map((_, i) => (
                      <div
                        key={i}
                        className={`gutter-line ${errorLine === i + 1 ? 'error' : ''}`}
                        style={{
                          fontFamily: 'var(--fm)',
                          fontSize: '.75rem',
                          lineHeight: '1.5rem',
                          textAlign: 'center',
                          color: errorLine === i + 1 ? 'var(--red)' : 'var(--mut)',
                          fontWeight: errorLine === i + 1 ? 'bold' : 'normal',
                          background: errorLine === i + 1 ? 'rgba(248,113,113,.15)' : 'transparent',
                          cursor: errorLine === i + 1 ? 'help' : 'default'
                        }}
                        title={errorLine === i + 1 ? jsonError || 'Syntax Error Here' : undefined}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <textarea
                    className="editor-textarea"
                    value={editorText}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    placeholder="Type JSON structure here..."
                    spellCheck={false}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--txt)',
                      fontFamily: 'var(--fm)',
                      fontSize: '.85rem',
                      lineHeight: '1.5rem',
                      padding: '.7rem 1rem',
                      resize: 'vertical',
                      whiteSpace: 'pre',
                      overflowX: 'auto',
                      overflowY: 'auto',
                      minHeight: '600px'
                    }}
                  />
                </div>
              ) : (
                renderActiveEditorForm()
              )}
            </>
          )}
        </div>
      </main>

      {/* Animated toast status notifications */}
      {toastMsg && (
        <div className="toast-wrap">
          <div className={`toast ${toastMsg.type}`}>
            <span>{toastMsg.type === 'success' ? '✓' : '⚡'}</span>
            <div>{toastMsg.text}</div>
          </div>
        </div>
      )}
    </div>
  );
}
