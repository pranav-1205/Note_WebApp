import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NoteContext from "../context/notes/noteContext";
import { FaPlus, FaCalendar, FaTrash, FaUser, FaBars, FaSignOutAlt, FaTimes, FaArchive } from "react-icons/fa";
import logo from "../assets/notemania-logo.png";

export default function Home(props) {
    const { showAlert } = props;
    const context = useContext(NoteContext);
    const { notes, getNotes, addNote, editNote } = context;
    const navigate = useNavigate();
    const [username, setUsername] = useState("User");
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [showHamburger, setShowHamburger] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNote, setNewNote] = useState({ title: "", description: "", tag: "" });
    const [selectedNotes, setSelectedNotes] = useState(new Set());
    const [trashedNoteIds, setTrashedNoteIds] = useState(new Set(
        JSON.parse(localStorage.getItem('trashNotes') || '[]').map(note => note._id)
    ));
    const [archivedNoteIds, setArchivedNoteIds] = useState(new Set(
        JSON.parse(localStorage.getItem('archivedNotes') || '[]').map(note => note._id)
    ));
    const [searchQuery, setSearchQuery] = useState("");
    const descriptionRef = useRef(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingNote, setEditingNote] = useState({ id: "", title: "", description: "", tag: "" });
    const editDescriptionRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate("/login");
                return;
            }
            
            try {
                const response = await fetch("http://localhost:8080/api/auth/getuser", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': token,
                    },
                });
                const json = await response.json();
                if (json.success && json.user) {
                    setUsername(json.user.name);
                }
                getNotes();
            } catch (error) {
                console.error('Error fetching user data:', error);
                showAlert("Error loading user data", "red");
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, []);

    useEffect(() => {
        const syncTrashedNoteIds = () => {
            const trashNotes = JSON.parse(localStorage.getItem('trashNotes') || '[]');
            setTrashedNoteIds(new Set(trashNotes.map(note => note._id)));
        };

        const syncArchivedNoteIds = () => {
            const archived = JSON.parse(localStorage.getItem('archivedNotes') || '[]');
            setArchivedNoteIds(new Set(archived.map(note => note._id)));
        };

        // Initial sync on mount
        syncTrashedNoteIds();
        syncArchivedNoteIds();

        // Listen for trash/archive updates from other views
        window.addEventListener('trashUpdated', syncTrashedNoteIds);
        window.addEventListener('archiveUpdated', syncArchivedNoteIds);
        return () => {
            window.removeEventListener('trashUpdated', syncTrashedNoteIds);
            window.removeEventListener('archiveUpdated', syncArchivedNoteIds);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        showAlert("Logged out successfully", "teal");
    };

    const handleAddNote = (e) => {
        e.preventDefault();
        if (!newNote.title || !newNote.description) {
            showAlert("Title and description are required", "red");
            return;
        }
        addNote(newNote.title, newNote.description, newNote.tag);
        setNewNote({ title: "", description: "", tag: "" });
        setShowAddModal(false);
        showAlert("Note created successfully", "teal");
    };

    const handleOpenEdit = (note) => {
        setEditingNote({
            id: note._id,
            title: note.title || "",
            description: note.description || "",
            tag: note.tag || "",
        });
        setShowEditModal(true);
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!editingNote.title || !editingNote.description) {
            showAlert("Title and description are required", "red");
            return;
        }

        await editNote(editingNote.id, editingNote.title, editingNote.description, editingNote.tag);
        setShowEditModal(false);
        showAlert("Note updated successfully", "teal");
    };

    const applyDescriptionFormat = (type) => {
        const textarea = descriptionRef.current;
        if (!textarea) return;

        const { selectionStart, selectionEnd, value } = textarea;
        const selectedText = value.substring(selectionStart, selectionEnd) || "";

        let before = value.substring(0, selectionStart);
        let after = value.substring(selectionEnd);
        let formatted = selectedText;

        if (type === "bold") {
            formatted = `**${selectedText || "bold text"}**`;
        } else if (type === "italic") {
            formatted = `*${selectedText || "italic text"}*`;
        } else if (type === "underline") {
            formatted = `__${selectedText || "underlined text"}__`;
        } else if (type === "bullet") {
            const text = selectedText || "list item";
            formatted = text
                .split("\n")
                .map(line => (line.trim() ? `- ${line}` : line))
                .join("\n");
        } else if (type === "numbered") {
            const text = selectedText || "list item";
            formatted = text
                .split("\n")
                .map((line, idx) => (line.trim() ? `${idx + 1}. ${line}` : line))
                .join("\n");
        }

        const newValue = before + formatted + after;
        const newCursorPos = before.length + formatted.length;

        setNewNote(prev => ({ ...prev, description: newValue }));

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
    };

    const applyEditDescriptionFormat = (type) => {
        const textarea = editDescriptionRef.current;
        if (!textarea) return;

        const { selectionStart, selectionEnd, value } = textarea;
        const selectedText = value.substring(selectionStart, selectionEnd) || "";

        let before = value.substring(0, selectionStart);
        let after = value.substring(selectionEnd);
        let formatted = selectedText;

        if (type === "bold") {
            formatted = `**${selectedText || "bold text"}**`;
        } else if (type === "italic") {
            formatted = `*${selectedText || "italic text"}*`;
        } else if (type === "underline") {
            formatted = `__${selectedText || "underlined text"}__`;
        } else if (type === "bullet") {
            const text = selectedText || "list item";
            formatted = text
                .split("\n")
                .map(line => (line.trim() ? `- ${line}` : line))
                .join("\n");
        } else if (type === "numbered") {
            const text = selectedText || "list item";
            formatted = text
                .split("\n")
                .map((line, idx) => (line.trim() ? `${idx + 1}. ${line}` : line))
                .join("\n");
        }

        const newValue = before + formatted + after;
        const newCursorPos = before.length + formatted.length;

        setEditingNote(prev => ({ ...prev, description: newValue }));

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
    };

    const toggleNoteSelection = (noteId) => {
        const updated = new Set(selectedNotes);
        if (updated.has(noteId)) {
            updated.delete(noteId);
        } else {
            updated.add(noteId);
        }
        setSelectedNotes(updated);
    };

    const handleMoveToTrash = () => {
        if (selectedNotes.size === 0) {
            showAlert("Please select notes to move to trash", "red");
            return;
        }

        // Store selected notes in localStorage for trash
        const trashNotes = notes.filter(note => selectedNotes.has(note._id));
        const existingTrash = JSON.parse(localStorage.getItem('trashNotes') || '[]');
        const updatedTrash = [...existingTrash, ...trashNotes];
        localStorage.setItem('trashNotes', JSON.stringify(updatedTrash));

        // Update trashed note IDs to remove from display
        const updated = new Set(trashedNoteIds);
        selectedNotes.forEach(noteId => updated.add(noteId));
        setTrashedNoteIds(updated);

        // notify other components
        window.dispatchEvent(new Event('trashUpdated'));

        // Clear selection
        setSelectedNotes(new Set());
        showAlert(`${trashNotes.length} note(s) moved to trash`, "teal");
    };

    const handleArchiveNotes = () => {
        if (selectedNotes.size === 0) {
            showAlert("Please select notes to archive", "red");
            return;
        }

        const notesToArchive = notes.filter(note => selectedNotes.has(note._id));
        const existingArchived = JSON.parse(localStorage.getItem('archivedNotes') || '[]');

        // Avoid duplicates by ID
        const existingIds = new Set(existingArchived.map(note => note._id));
        const merged = [
            ...existingArchived,
            ...notesToArchive.filter(note => !existingIds.has(note._id)),
        ];

        localStorage.setItem('archivedNotes', JSON.stringify(merged));
        const updatedArchivedIds = new Set(archivedNoteIds);
        notesToArchive.forEach(note => updatedArchivedIds.add(note._id));
        setArchivedNoteIds(updatedArchivedIds);

        window.dispatchEvent(new Event('archiveUpdated'));
        setSelectedNotes(new Set());
        showAlert(`${notesToArchive.length} note(s) archived`, "teal");
    };

    return (
        <main className="bg-gray-50 min-h-screen flex">
            {/* Sidebar */}
            <aside className="hidden md:flex w-40 bg-white border-r border-gray-200 p-6 flex-col gap-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                        <img
                            src={logo}
                            alt="NoteMania logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="text-sm font-bold text-gray-800 text-center">Note Mania</span>
                </div>

                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                >
                    <FaPlus /> Add new
                </button>

                <button 
                    onClick={() => navigate("/calendar")}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                >
                    <FaCalendar /> Calendar
                </button>

                <button 
                    onClick={() => navigate("/trash")}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                >
                    <FaTrash /> Trash
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">MY NOTES</h1>
                    <div className="flex items-center gap-4">
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="hidden sm:block px-4 py-2 bg-gray-200 rounded-full text-sm outline-none"
                        />
                        <div className="relative">
                            <div 
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded"
                                onClick={() => setShowMenu(!showMenu)}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                    <FaUser className="text-gray-600" />
                                </div>
                                <span className="hidden sm:inline text-sm font-medium text-gray-700">{username}</span>
                            </div>
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <FaSignOutAlt /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <FaBars 
                                onClick={() => setShowHamburger(!showHamburger)}
                                className="text-gray-600 cursor-pointer hover:text-gray-900 text-xl" 
                            />
                            {showHamburger && (
                                <div className="absolute right-0 mt-2 w-50 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <button 
                                        onClick={() => setShowAddModal(true)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-t-lg border-b"
                                    >
                                        <FaPlus /> Create New Note
                                    </button>
                                    <button 
                                        onClick={() => {
                                            navigate("/calendar");
                                            setShowHamburger(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 border-b"
                                    >
                                        <FaCalendar /> Calendar
                                    </button>
                                    <button 
                                        onClick={() => {
                                            navigate("/archive");
                                            setShowHamburger(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 border-b"
                                    >
                                        <FaArchive /> Archive
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                    >
                                        <FaSignOutAlt /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes toolbar */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        {selectedNotes.size > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                    {selectedNotes.size} selected
                                </span>
                                <button 
                                    onClick={handleArchiveNotes}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                                >
                                    <FaArchive /> Archive
                                </button>
                                <button 
                                    onClick={handleMoveToTrash}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                    <FaTrash /> Move to Trash
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notes Grid */}
                    {(() => {
                        const query = searchQuery.trim().toLowerCase();
                        const visibleNotes = notes.filter(note => {
                            if (trashedNoteIds.has(note._id)) return false;
                            if (archivedNoteIds.has(note._id)) return false;
                            if (!query) return true;
                            const title = (note.title || "").toLowerCase();
                            const description = (note.description || "").toLowerCase();
                            const tag = (note.tag || "").toLowerCase();
                            return (
                                title.includes(query) ||
                                description.includes(query) ||
                                tag.includes(query)
                            );
                        });

                        return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleNotes.length > 0 ? (
                            visibleNotes.map((note, index) => (
                                <div
                                    key={note._id}
                                    className={`rounded-lg p-6 cursor-pointer hover:shadow-lg transition border-2 ${
                                        selectedNotes.has(note._id)
                                            ? "border-red-500 bg-opacity-75"
                                            : "border-transparent"
                                    } ${
                                        ["bg-yellow-200", "bg-red-200", "bg-blue-300"][
                                            index % 3
                                        ]
                                    }`}
                                    onClick={() => handleOpenEdit(note)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-900 flex-1">{note.title}</h3>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 cursor-pointer"
                                            checked={selectedNotes.has(note._id)}
                                            onChange={() => toggleNoteSelection(note._id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">{note.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                                            {note.tag}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            {new Date(note.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500">
                                    {searchQuery.trim()
                                        ? "No notes match your search."
                                        : "No notes yet. Create one to get started!"}
                                </p>
                            </div>
                        )}
                        
                        {/* New Note Card */}
                        <div 
                            key="new-note-card"
                            onClick={() => setShowAddModal(true)}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition"
                        >
                            <span className="text-3xl text-gray-400 mb-2">+</span>
                            <p className="text-sm text-gray-600">New Note</p>
                        </div>
                    </div>
                        );
                    })()}
                </section>
            </div>

            {/* Add Note Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Create New Note</h2>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddNote} className="flex-1 flex flex-col space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={newNote.title}
                                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Note title"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tag
                                    </label>
                                    <input
                                        type="text"
                                        value={newNote.tag}
                                        onChange={(e) => setNewNote({ ...newNote, tag: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Work, Personal"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2 mb-2 border-b pb-2">
                                    <span className="text-sm font-medium text-gray-700 mr-2">Editor</span>
                                    <button
                                        type="button"
                                        onClick={() => applyDescriptionFormat("bold")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 font-semibold"
                                    >
                                        B
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyDescriptionFormat("italic")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 italic"
                                    >
                                        I
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyDescriptionFormat("underline")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 underline"
                                    >
                                        U
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyDescriptionFormat("bullet")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                                    >
                                        • List
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyDescriptionFormat("numbered")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                                    >
                                        1. List
                                    </button>
                                </div>
                                <textarea
                                    ref={descriptionRef}
                                    value={newNote.description}
                                    onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                                    className="w-full flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                                    placeholder="Start writing your note..."
                                    rows="12"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Note Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Note</h2>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateNote} className="flex-1 flex flex-col space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={editingNote.title}
                                        onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Note title"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tag
                                    </label>
                                    <input
                                        type="text"
                                        value={editingNote.tag}
                                        readOnly
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Tag cannot be changed after creation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2 mb-2 border-b pb-2">
                                    <span className="text-sm font-medium text-gray-700 mr-2">Editor</span>
                                    <button
                                        type="button"
                                        onClick={() => applyEditDescriptionFormat("bold")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 font-semibold"
                                    >
                                        B
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyEditDescriptionFormat("italic")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 italic"
                                    >
                                        I
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyEditDescriptionFormat("underline")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 underline"
                                    >
                                        U
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyEditDescriptionFormat("bullet")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                                    >
                                        • List
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyEditDescriptionFormat("numbered")}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                                    >
                                        1. List
                                    </button>
                                </div>
                                <textarea
                                    ref={editDescriptionRef}
                                    value={editingNote.description}
                                    onChange={(e) => setEditingNote(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                                    placeholder="Update your note..."
                                    rows="12"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
