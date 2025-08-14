import React, { useEffect, useState, useMemo, useRef } from "react";
import "./Favourites.css";
import { Heart, Search, X } from "lucide-react";
import { MotionNoteCard } from "../components/MotionWrappers";
import noFavsImage from '../assets/No_Favs.png';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3001/api';

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

    const displayValue = options.find(o => o.value === value)?.label || 'Select...';

    return (
        <div className={`custom-select-wrapper ${isOpen ? 'open' : ''}`} ref={wrapperRef}>
            <div className="select-display" onClick={() => setIsOpen(!isOpen)}>
                <span>{displayValue}</span>
                <span className="select-arrow">▾</span>
            </div>
            {isOpen && (
                <div className="select-menu">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`select-option ${option.value === value ? 'selected' : ''}`}
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

function Favourites() {
    const [favouriteNotes, setFavouriteNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewingNote, setViewingNote] = useState(null);
    const navigate = useNavigate();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchFavouriteNotes = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please log in to see your favourites.");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notes/favorites`, {
                headers: getAuthHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                toast.error("Session expired. Please log in again.");
                navigate('/login');
                return;
            }

            const data = await response.json();
            setFavouriteNotes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch favourites:", error);
            toast.error("Could not load favourites.");
            setFavouriteNotes([]);
        }
    };

    useEffect(() => {
        fetchFavouriteNotes();
        const handleFocus = () => fetchFavouriteNotes();
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const categoryFilterOptions = useMemo(() => {
        const categories = new Set(favouriteNotes.map(note => note.category).filter(Boolean));
        return ['All', ...Array.from(categories)].map(c => ({ 
            value: c, 
            label: c.charAt(0).toUpperCase() + c.slice(1) 
        }));
    }, [favouriteNotes]);

    const filteredAndSortedNotes = useMemo(() => {
        return favouriteNotes
            .filter(note => {
                const categoryMatch = activeCategory === 'All' || note.category === activeCategory;
                const searchMatch = !searchTerm || 
                    (note.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (note.content && note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(searchTerm.toLowerCase())));
                return categoryMatch && searchMatch;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [favouriteNotes, activeCategory, searchTerm]);

    const handleCardClick = (e, note) => {
        if (e.target.closest('button')) {
            return;
        }
        setViewingNote(note);
    };

    return (
        <div className="favs-body">
            <div className="favs-header">
                <h1>Favourites</h1>
                <div className="notes-controls">
                    <div className="search-bar-container">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search in Favourites..."
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
            </div>

            <div className="favs-grid">
                {filteredAndSortedNotes.length > 0 ? (
                    filteredAndSortedNotes.map((note) => (
                        <MotionNoteCard 
                            className={`note-card category-${note.category || 'default'}`} 
                            key={note.id} 
                            onClick={(e) => handleCardClick(e, note)}
                        >
                            <h3>{note.title}</h3>
                            <div 
                                className="note-content-preview" 
                                dangerouslySetInnerHTML={{ __html: note.content }} 
                            />
                            <div className="note-card-footer">
                                <div className="note-card-meta">
                                    {note.category && <span className="favs-category">{note.category.replace(/-/g, ' ')}</span>}
                                    <span className="note-card-date">
                                        {new Date(note.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="favs-actions">
                                    <Heart fill="#e00" color="#e00" size={18} />
                                </div>
                            </div>
                        </MotionNoteCard>
                    ))
                ) : (
                    filteredAndSortedNotes.length === 0 && searchTerm ? (
                        <p className="favs-empty">No favourites match your search.</p>
                    ) : (
                        <div className="empty-favs-container">
                            <img src={noFavsImage} alt="No favourites yet" className="empty-favs-image" />
                        </div>
                    )
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

export default Favourites;
