import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function EditBookmarkModal({ bookmark, isOpen, onClose, onSave, collections }: any) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [collectionId, setCollectionId] = useState("");

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || "");
      setUrl(bookmark.url || "");
      setTags(bookmark.tags ? bookmark.tags.join(", ") : "");
      setCollectionId(bookmark.collection_id || "");
    }
  }, [bookmark]);

  if (!isOpen || !bookmark) return null;

  const handleSave = () => {
    onSave(bookmark.id, {
      title,
      url,
      tags: tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      collection_id: collectionId || null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4 text-slate-900">Edit Bookmark</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Tags (comma separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Collection</label>
            <select value={collectionId} onChange={e => setCollectionId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400">
              <option value="">No Collection</option>
              {collections.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg mt-2 hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
