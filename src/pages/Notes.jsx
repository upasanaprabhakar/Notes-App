import React, { useState, useEffect, useMemo, useRef } from "react";
import "./Notes.css";
import { CirclePlus, Heart, X, Search, FilePenLine, Trash2, Sparkles } from "lucide-react";
import { MotionNoteCard, MotionButton } from "../components/MotionWrappers";
import toast from "react-hot-toast";
import { CheckCheck as CheckCheckIcon } from "../assets/CheckCheck.tsx";
import { HeartHandshake as HeartHandshakeIcon } from "../assets/HeartHandshake.tsx";
import noNotesImage from "../assets/No_Notes.png";
import noSearchImage from "../assets/No_Search.png";
import TiptapEditor from "../components/TiptapEditor";
import { TagsInput } from "react-tag-input-component";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3001/api";

const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const displayValue = options.find((o) => o.value === value)?.label || "Select Category";

  return (
    <div className={`custom-select-wrapper ${isOpen ? "open" : ""}`} ref={wrapperRef}>
      <div className="select-display" onClick={() => setIsOpen(!isOpen)}>
        <span>{displayValue}</span>
        <span className="select-arrow">▾</span>
      </div>
      {isOpen && (
        <div className="select-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`select-option ${option.value === value ? "selected" : ""}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function Notes() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [aiResult, setAiResult] = useState({ type: null, content: "" });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

  const formRef = useRef(null);
  const aiMenuRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/user/me`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error("Could not fetch user data");
        const data = await response.json();
        setUsername(data.username);
        fetchNotes();
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };
    fetchUserData();
  }, [navigate]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error("Could not fetch notes");
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      setNotes([]);
    }
  };

  const handleOpenAddForm = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteCategory("");
    setTags([]);
    setIsFavorite(false);
    setShowAddNoteForm(true);
  };

  const handleOpenEditForm = (noteToEdit) => {
    setViewingNote(null);
    setEditingNoteId(noteToEdit.id);
    setNoteTitle(noteToEdit.title);
    setNoteContent(noteToEdit.content);
    setNoteCategory(noteToEdit.category);
    setTags(noteToEdit.tags || []);
    setIsFavorite(noteToEdit.isFavorite);
    setShowAddNoteForm(true);
  };

  const closeForm = () => {
    setShowAddNoteForm(false);
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteCategory("");
    setTags([]);
    setIsFavorite(false);
  };

  const closeViewModal = () => {
    setViewingNote(null);
    setAiResult({ type: null, content: "" });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) closeForm();
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) setIsAiMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formRef, aiMenuRef]);

  const handleSaveNote = async () => {
    if (!noteTitle.trim() && (!noteContent || noteContent.replace(/<[^>]+>/g, "").trim() === "")) {
      toast.error("Please enter a title or content for your note.");
      return;
    }
    const noteData = {
      title: noteTitle.trim(),
      content: noteContent,
      category: noteCategory || "default",
      tags,
      isFavorite,
    };
    const url = editingNoteId ? `${API_BASE_URL}/notes/${editingNoteId}` : `${API_BASE_URL}/notes`;
    const method = editingNoteId ? "PUT" : "POST";
    try {
      await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(noteData),
      });
      toast.success(editingNoteId ? "Note updated successfully!" : "Note added successfully!");
      fetchNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Could not save note.");
    }
    closeForm();
  };

  const moveToTrash = async (idToTrash) => {
    try {
      await fetch(`${API_BASE_URL}/notes/${idToTrash}/trash`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      fetchNotes();
      toast.error("Moved to Trash", { icon: <Trash2 size={20} stroke="#A86F80" /> });
    } catch (error) {
      console.error("Failed to move to trash:", error);
      toast.error("Could not move note to trash.");
    }
  };

  const toggleFavorite = async (idToToggle) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${idToToggle}/toggle-favorite`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const updatedNote = await response.json();
      fetchNotes();
      toast(updatedNote.isFavorite ? `Added to favourites.` : `Removed from favourites.`, {
        type: "info",
        icon: <HeartHandshakeIcon style={{ width: 20, height: 20 }} />,
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Could not update favorite status.");
    }
  };

  const handleAiAction = async (action) => {
    if (!viewingNote || !viewingNote.content) return;
    setIsAiLoading(true);
    setAiResult({ type: null, content: "" });
    setIsAiMenuOpen(false);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/${action}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: viewingNote.content }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          toast.error("Session expired. Please log in again.");
          navigate("/login");
          return;
        }
        throw new Error(`AI request failed: ${response.status}`);
      }
      const data = await response.json();
      if (action === "summarize") {
        setAiResult({ type: "Summary", content: data.summary });
      } else if (action === "action-items") {
        setAiResult({ type: "Action Items", content: data.actionItems });
      }
    } catch (error) {
      console.error(`AI ${action} failed:`, error);
      toast.error(`AI Assistant could not perform action.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const categoryFilterOptions = useMemo(() => {
    const categories = new Set(notes.map((note) => note.category).filter(Boolean));
    return ["All", ...Array.from(categories)].map((c) => ({
      value: c,
      label: c.charAt(0).toUpperCase() + c.slice(1),
    }));
  }, [notes]);

  const filteredAndSortedNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const categoryMatch = activeCategory === "All" || note.category === activeCategory;
        const plainContent = note.content ? note.content.replace(/<[^>]+>/g, "") : "";
        const tagString = note.tags ? note.tags.join(" ") : "";
        const searchableText = `${note.title} ${plainContent} ${tagString}`.toLowerCase();
        const searchMatch = !searchTerm || searchableText.includes(searchTerm.toLowerCase());
        return categoryMatch && searchMatch;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notes, activeCategory, searchTerm]);

  const handleCardClick = (e, note) => {
    if (e.target.closest("button")) return;
    setViewingNote(note);
    setAiResult({ type: null, content: "" });
  };

  const categoryOptions = [
    { value: "", label: "Select Category" },
    { value: "default", label: "General" },
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
    { value: "ideas", label: "Ideas" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h1>My Notes</h1>
        <span className="welcome-user">Welcome{username ? `, ${username}` : ""}</span>
      </div>

      <div className="notes-controls">
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search in Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sort-by-container">
          <span className="sort-by-label">Filter by</span>
          <CustomSelect
            value={activeCategory}
            onChange={setActiveCategory}
            options={categoryFilterOptions}
          />
        </div>
      </div>

      <div className="notes-grid">
        {filteredAndSortedNotes.map((note) => (
          <MotionNoteCard
            className={`note-card category-${note.category || "default"}`}
            key={note.id}
            onClick={(e) => handleCardClick(e, note)}
          >
            <h3>{note.title}</h3>
            <div className="note-card-body">
              <div
                className="note-content-preview"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
            <div className="note-card-footer">
              <div className="note-card-meta">
                {note.category && <span className="note-category">{note.category.replace(/-/g, " ")}</span>}
                <span className="note-card-date">
                  {new Date(note.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="note-actions">
                <button className="edit-btn" onClick={() => handleOpenEditForm(note)}>
                  <FilePenLine size={20} />
                </button>
                <button className="favorite-btn" onClick={() => toggleFavorite(note.id)}>
                  {note.isFavorite ? <Heart fill="#e00" color="#e00" size={20} /> : <Heart size={20} />}
                </button>
                <button className="delete-btn" onClick={() => moveToTrash(note.id)}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </MotionNoteCard>
        ))}
        {filteredAndSortedNotes.length === 0 && (
          notes.length > 0 && searchTerm ? (
            <div className="empty-search-container">
              <img src={noSearchImage} alt="No search results found" className="empty-search-image" />
            </div>
          ) : (
            <div className="empty-notes-container">
              <img src={noNotesImage} alt="A notebook and a pencil" className="empty-notes-image" />
            </div>
          )
        )}
      </div>

      <MotionButton className="fab-add-note-btn" onClick={handleOpenAddForm} title="Add New Note">
        <CirclePlus size={32} strokeWidth={2.5} />
      </MotionButton>

      {showAddNoteForm && (
        <div className="modal-overlay">
          <div className="add-note-form-container" ref={formRef}>
            <button className="close-form-btn" onClick={closeForm}>
              <X size={24} />
            </button>
            <div className="form-content-wrapper">
              <h2>{editingNoteId ? "Edit Note" : "Add A New Note..."}</h2>
              <input
                type="text"
                className="note-title-input"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <TiptapEditor content={noteContent} onChange={(newContent) => setNoteContent(newContent)} />
              <CustomSelect value={noteCategory} onChange={setNoteCategory} options={categoryOptions} />
              <label className="tags-label">Additional Tags</label>
              <TagsInput value={tags} onChange={setTags} name="tags" placeHolder="enter tags" />
              <div className="form-actions">
                <button className="add-fav-btn" onClick={() => setIsFavorite(!isFavorite)}>
                  {isFavorite ? <Heart fill="#e00" color="#e00" size={24} /> : <Heart size={24} />}
                </button>
                <MotionButton className="add-note-btn" onClick={handleSaveNote}>
                  <CheckCheckIcon style={{ width: 28, height: 28 }} />
                </MotionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingNote && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="view-note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-note-header">
              <h2 className="view-note-title">{viewingNote.title || "Note"}</h2>
              <button className="view-note-close-btn" onClick={closeViewModal}>
                <X size={24} />
              </button>
            </div>
            <div className="view-note-meta">
              <span className="view-note-category">{viewingNote.category?.replace(/-/g, " ") || ""}</span>
              <span className="view-note-date">
                {new Date(viewingNote.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {viewingNote.tags?.length > 0 && (
              <div className="tags-list">
                {viewingNote.tags.map((tag) => (
                  <span key={tag} className="tag-pill">#{tag}</span>
                ))}
              </div>
            )}
            <div className="view-note-body" dangerouslySetInnerHTML={{ __html: viewingNote.content }} />
            {aiResult.content && (
              <div className="summary-container">
                <h4>AI {aiResult.type}</h4>
                <p>{aiResult.content}</p>
              </div>
            )}
            <div className="view-note-actions">
              <div className="ai-assistant-container" ref={aiMenuRef}>
                <button
                  className="ai-assistant-btn"
                  onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                  disabled={isAiLoading}
                >
                  <Sparkles size={20}/> AI Assistant
                </button>
                {isAiMenuOpen && (
                  <div className="ai-menu">
                    <button onClick={() => handleAiAction("summarize")}>Summarize Note</button>
                    <button onClick={() => handleAiAction("action-items")}>Find Action Items</button>
                  </div>
                )}
              </div>
              <button
                className="view-note-edit-btn"
                onClick={() => handleOpenEditForm(viewingNote)}
              >
                <FilePenLine size={20} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
