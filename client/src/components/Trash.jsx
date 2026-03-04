import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NoteContext from "../context/notes/noteContext";
import { FaArrowLeft, FaTrash, FaUndo } from "react-icons/fa";

export default function Trash(props) {
    const { showAlert } = props;
    const context = useContext(NoteContext);
    const { deleteNote, getNotes } = context;
    const navigate = useNavigate();
    const [trashNotes, setTrashNotes] = useState([]);
    const [selectedNotes, setSelectedNotes] = useState(new Set());

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate("/login");
            return;
        }
        loadTrashNotes();
    }, []);

    const loadTrashNotes = () => {
        const trash = JSON.parse(localStorage.getItem('trashNotes') || '[]');
        setTrashNotes(trash);
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

    const handlePermanentDelete = async () => {
        if (selectedNotes.size === 0) {
            showAlert("Please select notes to delete", "red");
            return;
        }

        // Delete from database
        for (const noteId of selectedNotes) {
            await deleteNote(noteId);
        }

        // Remove from trash
        const updated = trashNotes.filter(note => !selectedNotes.has(note._id));
        localStorage.setItem('trashNotes', JSON.stringify(updated));
        setTrashNotes(updated);
        setSelectedNotes(new Set());
        showAlert(`${selectedNotes.size} note(s) permanently deleted`, "teal");

        // notify other views to update and refresh main notes list
        window.dispatchEvent(new Event('trashUpdated'));
        await getNotes();
    };

    const handleRestore = () => {
        if (selectedNotes.size === 0) {
            showAlert("Please select notes to restore", "red");
            return;
        }

        const notesToRestore = trashNotes.filter(note => selectedNotes.has(note._id));
        const updated = trashNotes.filter(note => !selectedNotes.has(note._id));
        
        localStorage.setItem('trashNotes', JSON.stringify(updated));
        setTrashNotes(updated);
        setSelectedNotes(new Set());
        showAlert(`${notesToRestore.length} note(s) restored`, "teal");
        window.dispatchEvent(new Event('trashUpdated'));
    };

    const handleEmptyTrash = async () => {
        if (trashNotes.length === 0) {
            showAlert("Trash is already empty", "blue");
            return;
        }

        if (confirm("Are you sure you want to permanently delete all notes in trash?")) {
            // Delete all trash notes from database
            for (const note of trashNotes) {
                await deleteNote(note._id);
            }
            
            localStorage.setItem('trashNotes', JSON.stringify([]));
            setTrashNotes([]);
            setSelectedNotes(new Set());
            showAlert("Trash emptied", "teal");
            window.dispatchEvent(new Event('trashUpdated'));
            await getNotes();
        }
    };

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
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Trash</h1>
                    </div>
                    {trashNotes.length > 0 && (
                        <button 
                            onClick={handleEmptyTrash}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                        >
                            <FaTrash /> Empty Trash
                        </button>
                    )}
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                            {trashNotes.length} note{trashNotes.length !== 1 ? 's' : ''} in trash
                            {selectedNotes.size > 0 && (
                                <span className="ml-4 text-blue-600 font-semibold">
                                    {selectedNotes.size} selected
                                </span>
                            )}
                        </span>
                        {selectedNotes.size > 0 && (
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleRestore}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                >
                                    <FaUndo /> Restore
                                </button>
                                <button 
                                    onClick={handlePermanentDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                    <FaTrash /> Delete Permanently
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trashNotes.length > 0 ? (
                        trashNotes.map((note) => (
                            <div
                                key={note._id}
                                className={`rounded-lg p-6 cursor-pointer hover:shadow-lg transition border-2 ${
                                    selectedNotes.has(note._id)
                                        ? "border-red-500 bg-opacity-75"
                                        : "border-transparent"
                                } ${
                                    ["bg-yellow-200", "bg-red-200", "bg-blue-300"][
                                        trashNotes.indexOf(note) % 3
                                    ]
                                }`}
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
                            <FaTrash className="mx-auto text-4xl text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">Trash is empty</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
