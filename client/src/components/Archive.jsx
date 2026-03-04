import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaLock, FaTrash, FaUndo } from "react-icons/fa";
import NoteContext from "../context/notes/noteContext";

export default function Archive(props) {
    const { showAlert } = props;
    const context = useContext(NoteContext);
    const { deleteNote, getNotes } = context;
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [unlocked, setUnlocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [archivedNotes, setArchivedNotes] = useState([]);
    const [error, setError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNote, setNewNote] = useState({ title: "", description: "", tag: "" });
    const descriptionRef = useRef(null);
    const [selectedNotes, setSelectedNotes] = useState(new Set());

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        // Always require password each time Archive is opened
        setUnlocked(false);
        setLoading(false);
    }, []);

    const loadArchivedNotes = () => {
        const archived = JSON.parse(localStorage.getItem("archivedNotes") || "[]");
        setArchivedNotes(archived);
        setSelectedNotes(new Set());
    };

    const handleCreateArchivedNote = async (e) => {
        e.preventDefault();

        if (!newNote.title || !newNote.description) {
            showAlert("Title and description are required", "red");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/notes/addnote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": localStorage.getItem("token"),
                },
                body: JSON.stringify({
                    title: newNote.title,
                    description: newNote.description,
                    tag: newNote.tag,
                }),
            });
            const data = await response.json();
            const savedNote = data.saveNotes || data;

            // Add to archived notes storage
            const existing = JSON.parse(localStorage.getItem("archivedNotes") || "[]");
            const updated = [...existing, savedNote];
            localStorage.setItem("archivedNotes", JSON.stringify(updated));
            setArchivedNotes(updated);

            // Notify other views (Home, Calendar) to hide this note
            window.dispatchEvent(new Event("archiveUpdated"));

            setNewNote({ title: "", description: "", tag: "" });
            setShowAddModal(false);
            showAlert("Archived note created", "teal");
        } catch (err) {
            console.error("Error creating archived note:", err);
            showAlert("Failed to create archived note", "red");
        }
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

    const handleUnarchive = () => {
        if (selectedNotes.size === 0) {
            showAlert("Please select notes to remove from archive", "red");
            return;
        }

        const remaining = archivedNotes.filter(note => !selectedNotes.has(note._id));
        localStorage.setItem("archivedNotes", JSON.stringify(remaining));
        setArchivedNotes(remaining);
        setSelectedNotes(new Set());
        window.dispatchEvent(new Event("archiveUpdated"));
        showAlert("Selected notes removed from archive", "teal");
    };

    const handlePermanentDelete = async () => {
        if (selectedNotes.size === 0) {
            showAlert("Please select notes to delete", "red");
            return;
        }

        if (!confirm("Are you sure you want to permanently delete the selected archived notes?")) {
            return;
        }

        try {
            for (const noteId of selectedNotes) {
                await deleteNote(noteId);
            }

            const remaining = archivedNotes.filter(note => !selectedNotes.has(note._id));
            localStorage.setItem("archivedNotes", JSON.stringify(remaining));
            setArchivedNotes(remaining);
            setSelectedNotes(new Set());

            window.dispatchEvent(new Event("archiveUpdated"));
            await getNotes();

            showAlert("Selected archived notes permanently deleted", "teal");
        } catch (err) {
            console.error("Error deleting archived notes:", err);
            showAlert("Failed to delete some archived notes", "red");
        }
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

    const handleUnlock = async (e) => {
        e.preventDefault();
        setError("");

        const email = localStorage.getItem("userEmail");
        if (!email) {
            setError("We couldn't find your email in this browser. Please log out and log back in.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            const json = await response.json();

            if (!json.success) {
                setError("Incorrect password. Please try again.");
                return;
            }

            // Password verified – keep existing auth token, just unlock archive view
            setUnlocked(true);
            setPassword("");
            loadArchivedNotes();
            showAlert("Archive unlocked", "teal");
        } catch (err) {
            console.error("Error verifying password:", err);
            setError("Something went wrong. Please try again.");
        }
    };

    if (loading) {
        return null;
    }

    return (
        <main className="bg-gray-50 min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            <FaArrowLeft /> Back to Notes
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Archive</h1>
                    </div>
                </div>

                {!unlocked ? (
                    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FaLock className="text-gray-700" />
                            <h2 className="text-xl font-bold text-gray-900">Unlock Archive</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter your account password to view your archived notes. This adds an extra layer of privacy
                            on top of your login.
                        </p>
                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                                Unlock
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Archived Notes</h2>
                                    {selectedNotes.size > 0 && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {selectedNotes.size} selected
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedNotes.size > 0 && (
                                        <>
                                            <button
                                                onClick={handleUnarchive}
                                                className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-xs font-medium"
                                            >
                                                <FaUndo /> Remove from Archive
                                            </button>
                                            <button
                                                onClick={handlePermanentDelete}
                                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium"
                                            >
                                                <FaTrash /> Delete Permanently
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                    >
                                        New Archived Note
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {archivedNotes.length > 0 ? (
                                    archivedNotes.map((note, index) => (
                                        <div
                                            key={note._id || index}
                                            className={`rounded-lg p-6 border bg-gray-50 cursor-pointer hover:shadow ${
                                                ["border-yellow-500 bg-yellow-50", "border-red-500 bg-red-50", "border-blue-500 bg-blue-50"][
                                                    index % 3
                                                ]
                                            } ${selectedNotes.has(note._id) ? "ring-2 ring-blue-500" : ""}`}
                                            onClick={() => toggleNoteSelection(note._id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-gray-900 flex-1 pr-2">{note.title}</h3>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 mt-1 cursor-pointer"
                                                    checked={selectedNotes.has(note._id)}
                                                    onChange={() => toggleNoteSelection(note._id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-700 mb-4 line-clamp-3">{note.description}</p>
                                            <div className="flex justify-between items-center">
                                                {note.tag && (
                                                    <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                                                        {note.tag}
                                                    </span>
                                                )}
                                                {note.date && (
                                                    <span className="text-xs text-gray-600">
                                                        {new Date(note.date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <p className="text-gray-500 text-lg">You don't have any archived notes yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add Archived Note Modal */}
                        {showAddModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 h-[80vh] flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900">New Archived Note</h2>
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <form onSubmit={handleCreateArchivedNote} className="flex-1 flex flex-col space-y-4">
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
                                                    placeholder="e.g. Private, Personal"
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
                    </>
                )}
            </div>
        </main>
    );
}

