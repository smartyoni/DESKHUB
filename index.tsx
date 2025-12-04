import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Briefcase,
  FolderOpen,
  Plus,
  Save,
  Trash2,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
  Check,
  Pencil,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  CalendarDays,
  Calendar,
  Lock,
  Unlock,
  MoreVertical,
  ChevronLeft
} from "lucide-react";

// --- Types ---

interface Bookmark {
  id: string;
  zoneIndex: number; // 0-3
  name: string;
  url: string;
  color?: string; // Hex code for background color
}

interface ZoneConfig {
  index: number;
  name: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  order: number;
}

interface Project {
  id: string;
  title: string;
  status: "Ready" | "InProgress" | "Done";
  deadline: string;
  checklist: ChecklistItem[]; 
  createdAt: string;
}

interface ArchiveCategory {
  id: string;
  name: string;
}

interface ArchiveItem {
  id: string;
  categoryId: string;
  title: string;
  content: string;
}

interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  summary1?: string; // Key Task 1
  summary2?: string; // Key Task 2
  summary3?: string; // Key Task 3
  checklist?: ChecklistItem[]; // New field
  createdAt: string;
}

// --- Initial Data (Mocking SQLite) ---

const INITIAL_ZONES: ZoneConfig[] = [
  { index: 0, name: "ZONE 1" },
  { index: 1, name: "ZONE 2" },
  { index: 2, name: "ZONE 3" },
  { index: 3, name: "ZONE 4" },
];

const INITIAL_BOOKMARKS: Bookmark[] = Array.from({ length: 48 }).map((_, i) => ({
  id: `bm-${i}`,
  zoneIndex: Math.floor(i / 12),
  name: "바로가기",
  url: "https://www.google.com",
}));

// --- Utilities ---

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
};

// --- Components ---

const MobileHeader = ({ 
  onMenuClick,
  currentTime 
}: { 
  onMenuClick: () => void;
  currentTime: { dateString: string; dayOfWeek: string };
}) => {
  return (
    <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20 sticky top-0 h-[50px]">
      <div className="flex items-center">
          <button onClick={onMenuClick} className="flex items-center text-slate-600 hover:text-slate-900">
              <Menu size={24} />
          </button>
      </div>
      <div className="text-[11px] tracking-tight text-slate-500 font-medium whitespace-nowrap">
        <span className="text-red-500 font-bold">{currentTime.dateString}</span>
        <span className="text-blue-500 font-bold ml-1">{currentTime.dayOfWeek}</span>
      </div>
    </div>
  );
};

const MobileBottomNav = ({ 
    mode, 
    setMode 
}: { 
    mode: 'project' | 'archive' | 'journal', 
    setMode: (m: 'project' | 'archive' | 'journal') => void 
}) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-[60px] z-30 pb-safe">
            <button 
                onClick={() => setMode('project')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mode === 'project' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <Briefcase size={20} />
                <span className="text-[10px] font-medium">프로젝트</span>
            </button>
            <button 
                onClick={() => setMode('archive')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mode === 'archive' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <FolderOpen size={20} />
                <span className="text-[10px] font-medium">자료실</span>
            </button>
            <button 
                onClick={() => setMode('journal')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${mode === 'journal' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <Calendar size={20} />
                <span className="text-[10px] font-medium">TODAY</span>
            </button>
        </div>
    );
};

const GlobalHeader = ({ 
  zones, 
  bookmarks, 
  onUpdateBookmark, 
  onUpdateZoneName 
}: { 
  zones: ZoneConfig[], 
  bookmarks: Bookmark[], 
  onUpdateBookmark: (bm: Bookmark) => void,
  onUpdateZoneName: (index: number, name: string) => void
}) => {
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // Zone Theme Colors
  const zoneThemes = [
    { bg: "bg-sky-50", text: "text-sky-900", border: "border-sky-100", btnBase: "bg-sky-200", btnHover: "hover:bg-sky-300", badge: "bg-sky-100 text-sky-700" },
    { bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-100", btnBase: "bg-emerald-200", btnHover: "hover:bg-emerald-300", badge: "bg-emerald-100 text-emerald-700" },
    { bg: "bg-orange-50", text: "text-orange-900", border: "border-orange-100", btnBase: "bg-orange-200", btnHover: "hover:bg-orange-300", badge: "bg-orange-100 text-orange-700" },
    { bg: "bg-violet-50", text: "text-violet-900", border: "border-violet-100", btnBase: "bg-violet-200", btnHover: "hover:bg-violet-300", badge: "bg-violet-100 text-violet-700" },
  ];

  return (
    <header className="hidden md:block bg-white shadow-sm z-10 border-b border-slate-200">
      <div className="grid grid-cols-4 divide-x divide-slate-200">
        {zones.map((zone, zIdx) => {
           const theme = zoneThemes[zIdx % zoneThemes.length];
           return (
            <div key={zone.index} className={`p-2 ${theme.bg}`}>
              <div className="mb-2 px-1">
                {editingZoneIndex === zIdx ? (
                  <input
                    type="text"
                    defaultValue={zone.name}
                    autoFocus
                    onBlur={(e) => {
                      onUpdateZoneName(zIdx, e.target.value);
                      setEditingZoneIndex(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                         onUpdateZoneName(zIdx, e.currentTarget.value);
                         setEditingZoneIndex(null);
                      }
                    }}
                    className="text-xs font-bold w-full bg-white border border-slate-300 rounded px-1 py-0.5"
                  />
                ) : (
                  <h3 
                    onClick={() => setEditingZoneIndex(zIdx)}
                    className={`text-xs font-bold uppercase ${theme.text} cursor-pointer hover:bg-white/50 rounded px-1 py-0.5 transition-colors w-fit`}
                  >
                    {zone.name}
                  </h3>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {bookmarks
                  .filter((b) => b.zoneIndex === zone.index)
                  .sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]))
                  .map((bm) => {
                    const isCustomColor = !!bm.color;
                    const bgColorStyle = isCustomColor ? { backgroundColor: bm.color } : undefined;
                    const bgClass = isCustomColor ? '' : `${theme.btnBase} ${theme.btnHover}`;
                    const textClass = "text-slate-700"; 

                    return (
                      <a
                        key={bm.id}
                        href={bm.url.startsWith("http") ? bm.url : `https://${bm.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`block h-8 rounded text-[10px] font-medium flex items-center justify-center text-center px-1 truncate transition-colors shadow-sm ${bgClass} ${textClass}`}
                        style={bgColorStyle}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setEditingBookmark(bm);
                        }}
                      >
                        {bm.name}
                      </a>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {editingBookmark && (
        <BookmarkEditModal 
          bookmark={editingBookmark} 
          zones={zones}
          onClose={() => setEditingBookmark(null)} 
          onSave={onUpdateBookmark} 
        />
      )}
    </header>
  );
};

const BookmarkEditModal = ({ 
  bookmark, 
  zones,
  onClose, 
  onSave 
}: { 
  bookmark: Bookmark, 
  zones: ZoneConfig[],
  onClose: () => void, 
  onSave: (bm: Bookmark) => void 
}) => {
  const [name, setName] = useState(bookmark.name);
  const [url, setUrl] = useState(bookmark.url);
  const [zoneIndex, setZoneIndex] = useState(bookmark.zoneIndex);
  const [color, setColor] = useState(bookmark.color || "");

  const colors = [
    "#bae6fd", // sky-200
    "#fbbf24", // amber-400
    "#86efac", // green-300
    "#d8b4fe", // purple-300
    "#fca5a5", // red-300
    "#fde047", // yellow-300
    "#a7f3d0", // emerald-200
    "#fef08a", // yellow-200
    ""         // default
  ];

  const handleSave = () => {
    onSave({ ...bookmark, name, url, zoneIndex, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold mb-4 text-slate-800">북마크 수정</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">이름 (8글자 이내):</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value.slice(0, 8))} 
              className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-right text-[10px] text-slate-400 mt-1">{name.length} / 8</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">URL:</label>
            <input 
              type="text" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">영역:</label>
            <select 
              value={zoneIndex} 
              onChange={(e) => setZoneIndex(Number(e.target.value))}
              className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {zones.map(z => (
                <option key={z.index} value={z.index}>{z.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">색상:</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded border ${color === c ? 'ring-2 ring-blue-500 ring-offset-1 border-slate-400' : 'border-slate-200'}`}
                  style={{ backgroundColor: c || '#f1f5f9' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded shadow-sm font-bold"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            취소
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-colors"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectList = ({ 
  projects, 
  selectedId, 
  onSelect, 
  onCreate, 
  onDelete 
}: { 
  projects: Project[], 
  selectedId: string | null, 
  onSelect: (id: string) => void, 
  onCreate: () => void,
  onDelete: (id: string) => void
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <button 
          onClick={onCreate}
          className="w-full py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-bold flex items-center justify-center transition-colors"
        >
          <Plus size={16} className="mr-1" />
          새 프로젝트 추가
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {projects.length === 0 && (
            <div className="text-center text-slate-400 py-10 text-sm">
                진행 중인 프로젝트가 없습니다.
            </div>
        )}
        {projects.map((p) => (
          <div 
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`group relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              selectedId === p.id 
                ? "bg-white border-blue-500 ring-1 ring-blue-500 z-10" 
                : "bg-white border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                p.status === "Ready" ? "bg-slate-100 text-slate-600" :
                p.status === "InProgress" ? "bg-blue-100 text-blue-600" :
                "bg-green-100 text-green-600"
              }`}>
                {p.status === "Ready" ? "준비" : p.status === "InProgress" ? "진행" : "완료"}
              </span>
              <span className="text-[10px] text-slate-400">{p.deadline}</span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1 truncate pr-6">{p.title}</h4>
            <div className="flex items-center justify-between mt-2">
                 <div className="flex items-center text-[10px] text-slate-500">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded-full mr-1">
                        {p.checklist.filter(i => i.isChecked).length}/{p.checklist.length}
                    </span>
                    <span>완료</span>
                 </div>
                 <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                    className="p-1.5 text-slate-300 hover:text-red-600 transition-colors rounded hover:bg-red-50 opacity-100"
                    title="프로젝트 삭제"
                >
                    <Trash2 size={14} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ArchiveList = ({ 
  categories, 
  items, 
  selectedItemId,
  onSelectCategory, 
  onSelectItem,
  onCreateCategory,
  onUpdateCategoryName,
  onCreateItem,
  onDeleteCategory,
  onDeleteItem
}: { 
  categories: ArchiveCategory[], 
  items: ArchiveItem[], 
  selectedItemId: string | null,
  onSelectCategory: (id: string) => void,
  onSelectItem: (id: string) => void,
  onCreateCategory: (name: string) => void,
  onUpdateCategoryName: (id: string, name: string) => void,
  onCreateItem: (categoryId: string) => void,
  onDeleteCategory: (id: string) => void,
  onDeleteItem: (id: string) => void
}) => {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [newCatName, setNewCatName] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const toggleCat = (id: string) => {
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  const handleCreateCategorySubmit = () => {
    if (newCatName.trim()) {
        onCreateCategory(newCatName.trim());
        setNewCatName("");
        setIsAddingCat(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-slate-200">
         {!isAddingCat ? (
            <button 
                onClick={() => setIsAddingCat(true)}
                className="w-full py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-bold flex items-center justify-center transition-colors"
            >
                <Plus size={16} className="mr-1" /> 새 카테고리 추가
            </button>
         ) : (
            <div className="flex items-center space-x-2 animate-in fade-in zoom-in duration-200">
                <input 
                    type="text" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="카테고리명"
                    autoFocus
                    className="flex-1 border border-blue-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateCategorySubmit();
                        if (e.key === 'Escape') setIsAddingCat(false);
                    }}
                />
                <button 
                    onClick={handleCreateCategorySubmit}
                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    <Check size={16} />
                </button>
                 <button 
                    onClick={() => setIsAddingCat(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                    <X size={16} />
                </button>
            </div>
         )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {categories.map((cat) => (
          <div key={cat.id} className="mb-2">
            <div 
              className="flex items-center justify-between p-2 rounded hover:bg-slate-100 cursor-pointer group"
              onClick={() => toggleCat(cat.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                {expandedCats.has(cat.id) ? <ChevronDown size={16} className="text-slate-400 mr-1 flex-shrink-0" /> : <ChevronRight size={16} className="text-slate-400 mr-1 flex-shrink-0" />}
                
                {editingCatId === cat.id ? (
                     <input
                        type="text"
                        defaultValue={cat.name}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                             onUpdateCategoryName(cat.id, e.target.value);
                             setEditingCatId(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onUpdateCategoryName(cat.id, e.currentTarget.value);
                                setEditingCatId(null);
                            }
                        }}
                        className="text-sm font-bold bg-white border border-blue-300 rounded px-1 py-0.5 w-full mr-2"
                     />
                ) : (
                    <span className="font-bold text-slate-700 text-sm truncate">{cat.name}</span>
                )}
                <span className="ml-2 text-[10px] bg-slate-200 text-slate-500 px-1.5 rounded-full flex-shrink-0">
                  {items.filter(i => i.categoryId === cat.id).length}
                </span>
              </div>

               <div className="flex items-center space-x-1">
                   <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingCatId(cat.id);
                        }}
                        className="p-1 text-slate-300 hover:text-blue-500 opacity-100 transition-opacity"
                        title="이름 수정"
                   >
                       <Pencil size={14} />
                   </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory(cat.id);
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-100 transition-opacity"
                        title="카테고리 삭제"
                    >
                        <Trash2 size={14} />
                    </button>
               </div>
            </div>
            
            {expandedCats.has(cat.id) && (
              <div className="ml-6 border-l-2 border-slate-100 pl-2 mt-1 space-y-1">
                {items.filter(i => i.categoryId === cat.id).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    className={`text-sm py-1.5 px-2 rounded cursor-pointer flex justify-between items-center group transition-colors ${
                      selectedItemId === item.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 transition-opacity"
                    >
                        <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => onCreateItem(cat.id)}
                  className="text-xs text-blue-500 hover:text-blue-700 py-1 px-2 flex items-center mt-1"
                >
                  <Plus size={12} className="mr-1" /> 자료 추가하기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const JournalList = ({ 
  journals, 
  selectedId, 
  onSelect, 
  onCreate 
}: { 
  journals: JournalEntry[], 
  selectedId: string | null, 
  onSelect: (id: string) => void, 
  onCreate: () => void 
}) => {
  // Group journals by Month
  const groupedJournals = journals.reduce((acc, journal) => {
    const date = new Date(journal.date);
    const key = `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(journal);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  // Sort months descending
  const sortedMonths = Object.keys(groupedJournals).sort((a, b) => b.localeCompare(a));

  // Sort entries within month descending
  sortedMonths.forEach(key => {
    groupedJournals[key].sort((a, b) => b.date.localeCompare(a.date));
  });

  // State for accordion toggles (default open: current month)
  const currentMonthKey = `${new Date().getFullYear()}년 ${String(new Date().getMonth() + 1).padStart(2, '0')}월`;
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set([currentMonthKey]));

  const toggleMonth = (month: string) => {
    const next = new Set(expandedMonths);
    if (next.has(month)) next.delete(month);
    else next.add(month);
    setExpandedMonths(next);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <button 
          onClick={onCreate}
          className="w-full py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-bold flex items-center justify-center transition-colors"
        >
          <Plus size={16} className="mr-1" />
          일지 추가
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sortedMonths.map(month => (
          <div key={month} className="mb-4">
            <div 
              onClick={() => toggleMonth(month)}
              className="flex items-center text-xs font-bold text-slate-500 mb-2 cursor-pointer hover:text-slate-700 px-2"
            >
              {expandedMonths.has(month) ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
              {month}
            </div>
            
            {expandedMonths.has(month) && (
              <div className="space-y-2">
                {groupedJournals[month].map(journal => {
                  const isToday = journal.date === todayStr;
                  const dateObj = new Date(journal.date);
                  const dayStr = dateObj.getDate().toString().padStart(2, '0');
                  const days = ['일', '월', '화', '수', '목', '금', '토'];
                  const dayOfWeek = days[dateObj.getDay()];

                  return (
                    <div
                      key={journal.id}
                      onClick={() => onSelect(journal.id)}
                      className={`
                        cursor-pointer p-3 rounded-lg border transition-all text-sm
                        ${selectedId === journal.id 
                          ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                        }
                        ${isToday ? 'border-l-4 border-l-blue-500' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                          {dayStr}일 ({dayOfWeek})
                        </span>
                        {isToday && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">TODAY</span>
                        )}
                      </div>
                      <div className="text-slate-500 text-xs truncate">
                        {journal.content.split('\n')[0] || "내용 없음"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
         {sortedMonths.length === 0 && (
            <div className="text-center text-slate-400 py-10 text-sm">
                작성된 일지가 없습니다.
            </div>
        )}
      </div>
    </div>
  );
};

const ProjectDetail: React.FC<{ 
  project: Project, 
  onSave: (p: Project) => void,
  currentTime: { dateString: string; dayOfWeek: string };
}> = ({ 
  project, 
  onSave, 
  currentTime 
}) => {
  const [title, setTitle] = useState(project.title);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(project.checklist || []);
  const [newItemText, setNewItemText] = useState("");
  
  // Confirmation Modal for Deletion
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId(),
      text: newItemText.trim(),
      isChecked: false,
      order: checklist.length
    };
    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    setNewItemText("");
    
    // Auto Update project (Optional, but good UX)
    onSave({ ...project, title, checklist: updatedChecklist });
  };
  
  const handleToggleItem = (itemId: string) => {
    const updatedChecklist = checklist.map(item => {
        if (item.id === itemId) {
            return { ...item, isChecked: !item.isChecked };
        }
        return item;
    });
    
    updatedChecklist.sort((a, b) => {
        if (a.isChecked === b.isChecked) {
            return a.order - b.order;
        }
        return a.isChecked ? 1 : -1;
    });

    setChecklist(updatedChecklist);
    onSave({ ...project, title, checklist: updatedChecklist });
  };

  const handleDeleteItemClick = (itemId: string) => {
      setDeletingItemId(itemId);
      setDeleteConfirmOpen(true);
  };

  const confirmDeleteItem = () => {
    if (deletingItemId) {
        const updatedChecklist = checklist.filter(item => item.id !== deletingItemId);
        setChecklist(updatedChecklist);
        onSave({ ...project, title, checklist: updatedChecklist });
        setDeleteConfirmOpen(false);
        setDeletingItemId(null);
    }
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
      const newChecklist = [...checklist];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newChecklist.length) {
          const itemA = newChecklist[index];
          const itemB = newChecklist[targetIndex];

          // Swap orders
          const tempOrder = itemA.order;
          itemA.order = itemB.order;
          itemB.order = tempOrder;
          
          // Re-sort to reflect new order
           newChecklist.sort((a, b) => {
                if (a.isChecked === b.isChecked) {
                    return a.order - b.order;
                }
                return a.isChecked ? 1 : -1;
            });
            
          setChecklist(newChecklist);
          onSave({ ...project, title, checklist: newChecklist });
      }
  };

  const handleUpdateItemText = (id: string, text: string) => {
      const updatedChecklist = checklist.map(item => item.id === id ? { ...item, text } : item);
      setChecklist(updatedChecklist);
      onSave({ ...project, title, checklist: updatedChecklist });
  };

  // Adjust textarea height
  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          onBlur={() => onSave({ ...project, title, checklist })} // Save on blur
          className="text-lg md:text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 flex-1 truncate"
        />
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-lg md:text-xl whitespace-nowrap hidden md:block">
            <span className="text-red-500 font-bold">{currentTime.dateString}</span>
            <span className="text-blue-500 font-bold ml-1">{currentTime.dayOfWeek}</span>
          </span>
          <button 
             onClick={() => onSave({ ...project, title, checklist })}
             className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
             title="저장"
          >
             <Save size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        {/* Input Area */}
        <div>
            <div className="flex items-center justify-between mb-2">
                 <h3 className="text-base font-bold text-emerald-700 border-l-4 border-emerald-500 pl-2">
                    체크리스트 <span className="text-slate-400 font-normal text-sm">({checklist.filter(i => i.isChecked).length}/{checklist.length})</span>
                 </h3>
            </div>
            
            <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <textarea 
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === 'Enter') handleAddItem();
                        }}
                        onInput={handleInputResize}
                        placeholder="새로운 항목 추가... (Ctrl+Enter로 추가, Shift+Enter로 줄바꿈)"
                        className="w-full border border-emerald-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm resize-none overflow-hidden min-h-[50px] pr-2 md:pr-10"
                        rows={1}
                    />
                    <CornerDownLeft size={16} className="absolute right-3 top-4 text-slate-300 hidden md:block" />
                </div>
                <button 
                    onClick={handleAddItem}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg w-10 md:w-auto md:px-4 flex items-center justify-center shadow-sm transition-colors h-[50px] self-start flex-shrink-0"
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>

        {/* List */}
        <div className="space-y-3">
             {checklist.map((item, index) => (
                 <div 
                    key={item.id} 
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                        item.isChecked 
                        ? 'bg-slate-50 border-slate-100' 
                        : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300'
                    }`}
                 >
                    <div className="pt-0.5">
                        <button
                            onClick={() => handleToggleItem(item.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                item.isChecked 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'bg-white border-slate-300 hover:border-emerald-500'
                            }`}
                        >
                            {item.isChecked && <Check size={14} />}
                        </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <textarea
                            value={item.text}
                            onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                            onInput={handleInputResize}
                            className={`w-full bg-transparent border-none p-0 focus:ring-0 resize-none overflow-hidden text-sm leading-relaxed ${
                                item.isChecked ? 'text-slate-400 line-through' : 'text-slate-800'
                            }`}
                            rows={1}
                            style={{ height: 'auto' }}
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                        />
                    </div>

                    {!item.isChecked && (
                        <div className="flex flex-row items-center gap-1 mt-1.5">
                             <button 
                                onClick={() => handleMoveItem(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30"
                             >
                                <ArrowUp size={14} />
                             </button>
                             <button 
                                onClick={() => handleMoveItem(index, 'down')}
                                // Disable down if next item is checked (since checked items are at bottom) or end of list
                                disabled={index === checklist.length - 1 || checklist[index+1]?.isChecked}
                                className="p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30"
                             >
                                <ArrowDown size={14} />
                             </button>
                             <button 
                                onClick={() => handleDeleteItemClick(item.id)}
                                className="p-1 text-slate-600 hover:text-red-600"
                             >
                                <Trash2 size={14} />
                             </button>
                        </div>
                    )}
                    {item.isChecked && (
                         <button 
                            onClick={() => handleDeleteItemClick(item.id)}
                            className="p-1 text-slate-600 hover:text-red-600 mt-1.5"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                 </div>
             ))}
        </div>
      </div>
      
      <ConfirmationModal 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteItem}
        title="항목 삭제"
        message="이 체크리스트 항목을 삭제하시겠습니까?"
      />
    </div>
  );
};

const ArchiveDetail: React.FC<{ 
  item: ArchiveItem, 
  onSave: (i: ArchiveItem) => void,
  currentTime: { dateString: string; dayOfWeek: string };
}> = ({ 
  item, 
  onSave,
  currentTime
}) => {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full flex flex-col">
       <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          className="text-lg font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 flex-1 truncate"
        />
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-lg whitespace-nowrap hidden md:block">
            <span className="text-red-500 font-bold">{currentTime.dateString}</span>
            <span className="text-blue-500 font-bold ml-1">{currentTime.dayOfWeek}</span>
          </span>
          <button 
             onClick={() => onSave({ ...item, title, content })}
             className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
          >
             <Save size={24} />
          </button>
        </div>
      </div>
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 w-full p-6 resize-none focus:outline-none text-slate-700 leading-relaxed"
        placeholder="자료 내용을 입력하세요..."
      />
    </div>
  );
};

const JournalDetail: React.FC<{
  journal: JournalEntry,
  onSave: (j: JournalEntry) => void,
  currentTime: { dateString: string; dayOfWeek: string };
}> = ({
  journal,
  onSave,
  currentTime
}) => {
  const [content, setContent] = useState(journal.content);
  const [s1, setS1] = useState(journal.summary1 || "");
  const [s2, setS2] = useState(journal.summary2 || "");
  const [s3, setS3] = useState(journal.summary3 || "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(journal.checklist || []);
  const [newItemText, setNewItemText] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Parse date for display
  const dateObj = new Date(journal.date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const date = dateObj.getDate();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[dateObj.getDay()];

  const handleSave = () => {
      onSave({ 
          ...journal, 
          content,
          summary1: s1,
          summary2: s2,
          summary3: s3,
          checklist
      });
  };
  
  // Checklist handlers (Identical to ProjectDetail)
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId(),
      text: newItemText.trim(),
      isChecked: false,
      order: checklist.length
    };
    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    setNewItemText("");
    onSave({ ...journal, content, summary1: s1, summary2: s2, summary3: s3, checklist: updatedChecklist });
  };
  
  const handleToggleItem = (itemId: string) => {
    const updatedChecklist = checklist.map(item => {
        if (item.id === itemId) {
            return { ...item, isChecked: !item.isChecked };
        }
        return item;
    });
    
    updatedChecklist.sort((a, b) => {
        if (a.isChecked === b.isChecked) {
            return a.order - b.order;
        }
        return a.isChecked ? 1 : -1;
    });

    setChecklist(updatedChecklist);
    onSave({ ...journal, content, summary1: s1, summary2: s2, summary3: s3, checklist: updatedChecklist });
  };

  const handleDeleteItemClick = (itemId: string) => {
      setDeletingItemId(itemId);
      setDeleteConfirmOpen(true);
  };

  const confirmDeleteItem = () => {
    if (deletingItemId) {
        const updatedChecklist = checklist.filter(item => item.id !== deletingItemId);
        setChecklist(updatedChecklist);
        onSave({ ...journal, content, summary1: s1, summary2: s2, summary3: s3, checklist: updatedChecklist });
        setDeleteConfirmOpen(false);
        setDeletingItemId(null);
    }
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
      const newChecklist = [...checklist];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newChecklist.length) {
          const itemA = newChecklist[index];
          const itemB = newChecklist[targetIndex];

          const tempOrder = itemA.order;
          itemA.order = itemB.order;
          itemB.order = tempOrder;
          
           newChecklist.sort((a, b) => {
                if (a.isChecked === b.isChecked) {
                    return a.order - b.order;
                }
                return a.isChecked ? 1 : -1;
            });
            
          setChecklist(newChecklist);
          onSave({ ...journal, content, summary1: s1, summary2: s2, summary3: s3, checklist: newChecklist });
      }
  };

  const handleUpdateItemText = (id: string, text: string) => {
      const updatedChecklist = checklist.map(item => item.id === id ? { ...item, text } : item);
      setChecklist(updatedChecklist);
      onSave({ ...journal, content, summary1: s1, summary2: s2, summary3: s3, checklist: updatedChecklist });
  };
  
  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-slate-800">{date}일</span>
          <span className="text-lg text-slate-500 font-medium">({dayName})</span>
          <span className="text-sm text-slate-400">{year}년 {month}월</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg whitespace-nowrap hidden md:block mr-2">
             <span className="text-red-500 font-bold">{currentTime.dateString}</span>
             <span className="text-blue-500 font-bold ml-1">{currentTime.dayOfWeek}</span>
          </span>
          <button
            onClick={handleSave}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            title="저장"
          >
            <Save size={24} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* 3-Column Summary Area */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/50 border-b border-slate-200">
            <textarea
                value={s1}
                onChange={(e) => setS1(e.target.value)}
                rows={2}
                className="w-full resize-none border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                placeholder="주차위치"
            />
            <textarea
                value={s2}
                onChange={(e) => setS2(e.target.value)}
                rows={2}
                className="w-full resize-none border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                placeholder="내용을 입력하세요"
            />
            <textarea
                value={s3}
                onChange={(e) => setS3(e.target.value)}
                rows={2}
                className="w-full resize-none border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                placeholder="내용을 입력하세요"
            />
        </div>

        {/* Checklist Section */}
        <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
                 <h3 className="text-base font-bold text-emerald-700 border-l-4 border-emerald-500 pl-2">
                    체크리스트 <span className="text-slate-400 font-normal text-sm">({checklist.filter(i => i.isChecked).length}/{checklist.length})</span>
                 </h3>
            </div>
            
            <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <textarea 
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === 'Enter') handleAddItem();
                        }}
                        onInput={handleInputResize}
                        placeholder="새로운 항목 추가... (Ctrl+Enter로 추가, Shift+Enter로 줄바꿈)"
                        className="w-full border border-emerald-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm resize-none overflow-hidden min-h-[50px] pr-2 md:pr-10"
                        rows={1}
                    />
                    <CornerDownLeft size={16} className="absolute right-3 top-4 text-slate-300 hidden md:block" />
                </div>
                <button 
                    onClick={handleAddItem}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg w-10 md:w-auto md:px-4 flex items-center justify-center shadow-sm transition-colors h-[50px] self-start flex-shrink-0"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="space-y-3">
                 {checklist.map((item, index) => (
                     <div 
                        key={item.id} 
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                            item.isChecked 
                            ? 'bg-slate-50 border-slate-100' 
                            : 'bg-white border-slate-200 shadow-sm hover:border-emerald-300'
                        }`}
                     >
                        <div className="pt-0.5">
                            <button
                                onClick={() => handleToggleItem(item.id)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    item.isChecked 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'bg-white border-slate-300 hover:border-emerald-500'
                                }`}
                            >
                                {item.isChecked && <Check size={14} />}
                            </button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <textarea
                                value={item.text}
                                onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                                onInput={handleInputResize}
                                className={`w-full bg-transparent border-none p-0 focus:ring-0 resize-none overflow-hidden text-sm leading-relaxed ${
                                    item.isChecked ? 'text-slate-400 line-through' : 'text-slate-800'
                                }`}
                                rows={1}
                                style={{ height: 'auto' }}
                                ref={(el) => {
                                    if (el) {
                                        el.style.height = 'auto';
                                        el.style.height = el.scrollHeight + 'px';
                                    }
                                }}
                            />
                        </div>

                        {!item.isChecked && (
                            <div className="flex flex-row items-center gap-1 mt-1.5">
                                 <button 
                                    onClick={() => handleMoveItem(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30"
                                 >
                                    <ArrowUp size={14} />
                                 </button>
                                 <button 
                                    onClick={() => handleMoveItem(index, 'down')}
                                    disabled={index === checklist.length - 1 || checklist[index+1]?.isChecked}
                                    className="p-1 text-slate-600 hover:text-blue-600 disabled:opacity-30"
                                 >
                                    <ArrowDown size={14} />
                                 </button>
                                 <button 
                                    onClick={() => handleDeleteItemClick(item.id)}
                                    className="p-1 text-slate-600 hover:text-red-600"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                            </div>
                        )}
                        {item.isChecked && (
                             <button 
                                onClick={() => handleDeleteItemClick(item.id)}
                                className="p-1 text-slate-600 hover:text-red-600 mt-1.5"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                     </div>
                 ))}
            </div>
        </div>

        {/* Main Content Area */}
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-6 resize-none focus:outline-none text-slate-700 leading-relaxed text-base min-h-[300px]"
            placeholder="오늘의 업무 일지를 작성하세요..."
        />
      </div>

      <ConfirmationModal 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteItem}
        title="항목 삭제"
        message="이 체크리스트 항목을 삭제하시겠습니까?"
      />
    </div>
  );
};

const Sidebar: React.FC<{ 
  mode: 'project' | 'archive' | 'journal', 
  setMode: (m: 'project' | 'archive' | 'journal') => void, 
  isOpen: boolean,
  onClose: () => void,
  children?: React.ReactNode 
}> = ({ 
  mode, 
  setMode,
  isOpen,
  onClose,
  children 
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
        />
      )}

      <div className={`
          flex flex-col bg-white border-r border-slate-200
          fixed top-0 bottom-[60px] left-0 w-[85%] max-w-[300px] z-50 transition-transform duration-300 ease-in-out
          md:h-full md:relative md:translate-x-0 md:w-[280px] md:z-auto md:inset-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          {/* Desktop Sidebar Header (Tabs) - Hidden on Mobile */}
          <div className="hidden md:flex border-b border-slate-200">
            <button 
              onClick={() => setMode('project')}
              className={`flex-1 py-3 text-sm font-bold flex flex-col items-center justify-center space-y-1 ${mode === 'project' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Briefcase size={18} />
              <span>프로젝트</span>
            </button>
            <button 
              onClick={() => setMode('archive')}
              className={`flex-1 py-3 text-sm font-bold flex flex-col items-center justify-center space-y-1 ${mode === 'archive' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <FolderOpen size={18} />
              <span>자료실</span>
            </button>
            <button 
              onClick={() => setMode('journal')}
              className={`flex-1 py-3 text-sm font-bold flex flex-col items-center justify-center space-y-1 ${mode === 'journal' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Calendar size={18} />
              <span>TODAY</span>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
    </>
  );
};

// --- Custom Hooks ---

const useCurrentTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000); // Update every second to catch minute changes
    return () => clearInterval(timer);
  }, []);

  const year = time.getFullYear();
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const day = String(time.getDate()).padStart(2, '0');
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[time.getDay()];

  return {
      dateString: `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`,
      dayOfWeek: `(${dayOfWeek})`
  };
};

// --- Main App Component ---

const App = () => {
  const [zones, setZones] = useState<ZoneConfig[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [archiveCats, setArchiveCats] = useState<ArchiveCategory[]>([]);
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  const [mode, setMode] = useState<'project' | 'archive' | 'journal'>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedArchiveItemId, setSelectedArchiveItemId] = useState<string | null>(null);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);

  // Mobile Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Confirmation Modal State (Global)
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'project' | 'category' | 'archiveItem' | 'journal', id: string } | null>(null);

  const currentTime = useCurrentTime();

  // Load Data
  useEffect(() => {
    try {
        const storedZones = localStorage.getItem("sbs_zones");
        if (storedZones) setZones(JSON.parse(storedZones));
        else setZones(INITIAL_ZONES);

        const storedBm = localStorage.getItem("sbs_bookmarks");
        if (storedBm) setBookmarks(JSON.parse(storedBm));
        else setBookmarks(INITIAL_BOOKMARKS);

        const storedProj = localStorage.getItem("sbs_projects");
        if (storedProj) {
            const parsed = JSON.parse(storedProj);
            if (Array.isArray(parsed)) setProjects(parsed);
            else setProjects([]);
        }

        const storedCats = localStorage.getItem("sbs_archive_cats");
        if (storedCats) setArchiveCats(JSON.parse(storedCats));

        const storedItems = localStorage.getItem("sbs_archive_items");
        if (storedItems) setArchiveItems(JSON.parse(storedItems));

        const storedJournals = localStorage.getItem("sbs_journals");
        if (storedJournals) setJournals(JSON.parse(storedJournals));

    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setProjects([]);
    }
  }, []);

  // Save Data
  useEffect(() => localStorage.setItem("sbs_zones", JSON.stringify(zones)), [zones]);
  useEffect(() => localStorage.setItem("sbs_bookmarks", JSON.stringify(bookmarks)), [bookmarks]);
  useEffect(() => localStorage.setItem("sbs_projects", JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem("sbs_archive_cats", JSON.stringify(archiveCats)), [archiveCats]);
  useEffect(() => localStorage.setItem("sbs_archive_items", JSON.stringify(archiveItems)), [archiveItems]);
  useEffect(() => localStorage.setItem("sbs_journals", JSON.stringify(journals)), [journals]);

  // --- Handlers ---

  const handleCreateProject = () => {
    const newProject: Project = {
      id: generateId(),
      title: "새 프로젝트",
      status: "Ready",
      deadline: new Date().toISOString().split("T")[0],
      checklist: [],
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setIsSidebarOpen(false);
  };

  const handleDeleteProjectClick = (id: string) => {
    setDeleteTarget({ type: 'project', id });
    setModalOpen(true);
  };
  
  // Journal Handlers
  const handleCreateJournal = () => {
    const today = new Date().toISOString().split('T')[0];
    const existing = journals.find(j => j.date === today);

    if (existing) {
        // Case 1: Already exists
        alert("오늘의 일지는 이미 생성되었습니다.");
        setSelectedJournalId(existing.id);
        setIsSidebarOpen(false);
    } else {
        // Case 2: Create new
        const newJournal: JournalEntry = {
            id: generateId(),
            date: today,
            content: "",
            summary1: "",
            summary2: "",
            summary3: "",
            checklist: [], // Initialize empty checklist
            createdAt: new Date().toISOString()
        };
        setJournals(prev => [newJournal, ...prev]);
        setSelectedJournalId(newJournal.id);
        setIsSidebarOpen(false);
    }
  };

  const handleConfirmDelete = () => {
      if (!deleteTarget) return;

      if (deleteTarget.type === 'project') {
          setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
          if (selectedProjectId === deleteTarget.id) {
            setSelectedProjectId(null);
          }
      } else if (deleteTarget.type === 'category') {
           setArchiveCats(prev => prev.filter(c => c.id !== deleteTarget.id));
           // Cascade delete items
           setArchiveItems(prev => prev.filter(i => i.categoryId !== deleteTarget.id));
           if (archiveItems.find(i => i.categoryId === deleteTarget.id && i.id === selectedArchiveItemId)) {
               setSelectedArchiveItemId(null);
           }
      } else if (deleteTarget.type === 'archiveItem') {
          setArchiveItems(prev => prev.filter(i => i.id !== deleteTarget.id));
          if (selectedArchiveItemId === deleteTarget.id) {
            setSelectedArchiveItemId(null);
          }
      } else if (deleteTarget.type === 'journal') {
          setJournals(prev => prev.filter(j => j.id !== deleteTarget.id));
          if (selectedJournalId === deleteTarget.id) {
            setSelectedJournalId(null);
          }
      }

      setModalOpen(false);
      setDeleteTarget(null);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
  };

  const handleCreateCategory = (name: string) => {
    const newCat: ArchiveCategory = { id: generateId(), name };
    setArchiveCats([...archiveCats, newCat]);
  };
  
  const handleUpdateCategoryName = (id: string, name: string) => {
      setArchiveCats(archiveCats.map(c => c.id === id ? { ...c, name } : c));
  };

  const handleDeleteCategoryClick = (id: string) => {
      setDeleteTarget({ type: 'category', id });
      setModalOpen(true);
  };

  const handleCreateArchiveItem = (catId: string) => {
    const newItem: ArchiveItem = {
      id: generateId(),
      categoryId: catId,
      title: "새 자료",
      content: "",
    };
    setArchiveItems([...archiveItems, newItem]);
    setSelectedArchiveItemId(newItem.id);
    setIsSidebarOpen(false);
  };
  
  const handleDeleteArchiveItemClick = (id: string) => {
      setDeleteTarget({ type: 'archiveItem', id });
      setModalOpen(true);
  };

  const handleUpdateArchiveItem = (updated: ArchiveItem) => {
    setArchiveItems(items => items.map(i => i.id === updated.id ? updated : i));
  };

  const handleUpdateJournal = (updated: JournalEntry) => {
    setJournals(prev => prev.map(j => j.id === updated.id ? updated : j));
  };

  const handleUpdateBookmark = (updatedBm: Bookmark) => {
    setBookmarks(bookmarks.map(b => b.id === updatedBm.id ? updatedBm : b));
  };

  const handleUpdateZoneName = (index: number, name: string) => {
    setZones(zones.map(z => z.index === index ? { ...z, name } : z));
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedArchiveItem = archiveItems.find(i => i.id === selectedArchiveItemId);
  const selectedJournal = journals.find(j => j.id === selectedJournalId);

  return (
    <>
        <MobileHeader 
            onMenuClick={() => setIsSidebarOpen(true)}
            currentTime={currentTime} 
        />
        <GlobalHeader 
            zones={zones} 
            bookmarks={bookmarks} 
            onUpdateBookmark={handleUpdateBookmark}
            onUpdateZoneName={handleUpdateZoneName}
        />

        <div className="flex-1 flex overflow-hidden h-full relative">
            <Sidebar 
                mode={mode} 
                setMode={setMode} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            >
                {mode === 'project' && (
                <ProjectList 
                    projects={projects} 
                    selectedId={selectedProjectId} 
                    onSelect={(id) => { setSelectedProjectId(id); setIsSidebarOpen(false); }} 
                    onCreate={handleCreateProject}
                    onDelete={handleDeleteProjectClick}
                />
                )}
                {mode === 'archive' && (
                <ArchiveList 
                    categories={archiveCats} 
                    items={archiveItems} 
                    selectedItemId={selectedArchiveItemId}
                    onSelectCategory={() => {}} 
                    onSelectItem={(id) => { setSelectedArchiveItemId(id); setIsSidebarOpen(false); }}
                    onCreateCategory={handleCreateCategory}
                    onUpdateCategoryName={handleUpdateCategoryName}
                    onCreateItem={handleCreateArchiveItem}
                    onDeleteCategory={handleDeleteCategoryClick}
                    onDeleteItem={handleDeleteArchiveItemClick}
                />
                )}
                {mode === 'journal' && (
                <JournalList 
                    journals={journals}
                    selectedId={selectedJournalId}
                    onSelect={(id) => { setSelectedJournalId(id); setIsSidebarOpen(false); }}
                    onCreate={handleCreateJournal}
                />
                )}
            </Sidebar>

            <main className="flex flex-1 bg-slate-50 p-4 h-full overflow-hidden flex-col pb-[60px] md:pb-4">
                {mode === 'project' ? (
                    selectedProject ? (
                        <ProjectDetail 
                            key={selectedProject.id} 
                            project={selectedProject} 
                            onSave={handleUpdateProject} 
                            currentTime={currentTime}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                        <p>프로젝트를 선택하거나 새로 만드세요.</p>
                        </div>
                    )
                ) : mode === 'archive' ? (
                    selectedArchiveItem ? (
                        <ArchiveDetail 
                            key={selectedArchiveItem.id} 
                            item={selectedArchiveItem} 
                            onSave={handleUpdateArchiveItem} 
                            currentTime={currentTime}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                        <p>자료를 선택하거나 새로 만드세요.</p>
                        </div>
                    )
                ) : (
                    selectedJournal ? (
                        <JournalDetail 
                            key={selectedJournal.id}
                            journal={selectedJournal}
                            onSave={handleUpdateJournal}
                            currentTime={currentTime}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                             <p>일지를 선택하거나 오늘의 일지를 작성하세요.</p>
                        </div>
                    )
                )}
            </main>
        </div>

        <MobileBottomNav mode={mode} setMode={(m) => {
            setMode(m);
            setIsSidebarOpen(true);
        }} />
        
        <ConfirmationModal 
            isOpen={modalOpen} 
            onClose={() => { setModalOpen(false); setDeleteTarget(null); }} 
            onConfirm={handleConfirmDelete}
            title={
                deleteTarget?.type === 'project' ? "프로젝트 삭제" : 
                deleteTarget?.type === 'category' ? "카테고리 삭제" : 
                deleteTarget?.type === 'archiveItem' ? "자료 삭제" : "삭제"
            }
            message={
                deleteTarget?.type === 'category' 
                ? "카테고리를 삭제하면 포함된 모든 자료도 함께 삭제됩니다. 계속하시겠습니까?" 
                : "정말로 삭제하시겠습니까?"
            }
        />
    </>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);