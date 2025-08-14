import React, { useEffect, useState, useRef } from "react";
import "./Trash.css";
import toast from 'react-hot-toast';
import { MotionNoteCard } from "../components/MotionWrappers";
import { RotateCcw as RestoreIcon, X, Trash2 as DeletePermanentlyIcon } from "lucide-react";
import Lottie from 'lottie-react';
import clearAllAnimation from '../assets/Delete_all.json';
import noTrashImage from '../assets/No_Trash.png';

const API_BASE_URL = 'http://localhost:3001/api';

function Trash() {
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [viewingNote, setViewingNote] = useState(null);
  const lottieRef = useRef(null);


  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchTrashedNotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/trash`, { headers: getAuthHeaders() });
      const data = await response.json();
      setTrashedNotes(data);
    } catch (error) {
      console.error("Failed to fetch trashed notes:", error);
      toast.error("Could not load trash.");
    }
  };

  useEffect(() => {
    fetchTrashedNotes();
    const handleFocus = () => fetchTrashedNotes();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const restoreNote = async (idToRestore) => {
    try {
      await fetch(`${API_BASE_URL}/notes/${idToRestore}/restore`, { 
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      setTrashedNotes(trashedNotes.filter(n => n.id !== idToRestore));
      toast.success('Note restored!', { icon: <RestoreIcon size={18} stroke="#6F916B" /> });
    } catch (error) {
      console.error("Failed to restore note:", error);
      toast.error("Could not restore note.");
    }
  };

  const deletePermanently = async (idToDelete) => {
    try {
      await fetch(`${API_BASE_URL}/notes/${idToDelete}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setTrashedNotes(trashedNotes.filter(n => n.id !== idToDelete));
      toast.error('Note permanently deleted.');
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Could not delete note permanently.");
    }
  };

  const emptyTrash = async (toastId) => {
    try {
      await fetch(`${API_BASE_URL}/notes/trash/empty`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setTrashedNotes([]);
      toast.dismiss(toastId);
      toast('Trash emptied.', {
        icon: <RestoreIcon style={{ width: 20, height: 20 }} />,
        style: {
          border: '1px solid #ddd', padding: '8px 16px', color: '#6A4B42',
          backgroundColor: '#fffaf5', fontWeight: 500, fontFamily: 'Inter, sans-serif'
        }
      });
    } catch (error) {
      console.error("Failed to empty trash:", error);
      toast.error("Could not empty trash.");
    }
  };

  const handleClearAllTrash = () => {
    toast.custom((t) => (
      <div className="custom-toast-container">
        <span>Are you sure you want to empty the trash? This cannot be undone.</span>
        <div className="custom-toast-actions">
          <button className="confirm-btn" onClick={() => emptyTrash(t.id)}>Confirm</button>
          <button className="cancel-btn" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ));
  };

  const handleCardClick = (e, note) => {
    if (e.target.closest('button')) {
      return;
    }
    setViewingNote(note);
  };

  return (
    <div className="trash-body">
      <div className="trash-header">
        <h1>Trash</h1>
        {trashedNotes.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAllTrash} aria-label="Empty trash">
            <Lottie
              lottieRef={lottieRef}
              animationData={clearAllAnimation}
              loop={false}
              autoplay={false}
            />
          </button>
        )}
      </div>

      <div className="trash-grid">
        {trashedNotes.length > 0 ? (
          trashedNotes.map((note) => (
            <MotionNoteCard 
              className={`note-card category-${note.category || 'default'}`} 
              key={note.id} 
              onClick={(e) => handleCardClick(e, note)}
            >
              <h3>{note.title}</h3>
              <div className="note-content-preview" dangerouslySetInnerHTML={{ __html: note.content }} />
              <div className="note-card-footer">
                <div className="note-card-meta">
                  {note.category && <span className="trash-category">{note.category}</span>}
                  <span className="note-card-date">
                    {new Date(note.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="trash-actions">
                  <button
                    className="restore-btn"
                    onClick={() => restoreNote(note.id)}
                    aria-label={`Restore note: ${note.title ? note.title : note.content.substring(0, 20)}...`}
                  >
                    <RestoreIcon size={18} />
                  </button>
                  <button
                    className="delete-permanently-btn"
                    onClick={() => deletePermanently(note.id)}
                    aria-label={`Delete permanently: ${note.title ? note.title : note.content.substring(0, 20)}...`}
                  >
                    <DeletePermanentlyIcon size={20} />
                  </button>
                </div>
              </div>
            </MotionNoteCard>
          ))
        ) : (
          <div className="empty-trash-container">
            <img src={noTrashImage} alt="Trash is empty" className="empty-trash-image" />
          </div>
        )}
      </div>

      {viewingNote && (
        <div className="modal-overlay" onClick={() => setViewingNote(null)}>
          <div className="view-note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-note-header">
              <h2 className="view-note-title">{viewingNote.title || "Note"}</h2>
              <button className="view-note-close-btn" onClick={() => setViewingNote(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="view-note-meta">
              <span className="view-note-category">{viewingNote.category?.replace(/-/g, ' ') || ''}</span>
              <span className="view-note-date">
                {new Date(viewingNote.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
            {viewingNote.tags && viewingNote.tags.length > 0 && (
              <div className="tags-list">
                {viewingNote.tags.map(tag => <span key={tag} className="tag-pill">#{tag}</span>)}
              </div>
            )}
            <div className="view-note-body" dangerouslySetInnerHTML={{ __html: viewingNote.content }}/>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trash;
