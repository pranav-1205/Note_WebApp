import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NoteContext from "../context/notes/noteContext";
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Calendar(props) {
    const { showAlert } = props;
    const context = useContext(NoteContext);
    const { notes, getNotes } = context;
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [notesGroupedByDate, setNotesGroupedByDate] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate("/login");
            return;
        }
        getNotes();
    }, []);

    // Helper to rebuild the grouped notes, excluding trashed and archived ones
    const rebuildNotesGroupedByDate = () => {
        const trashNotes = JSON.parse(localStorage.getItem('trashNotes') || '[]');
        const trashedIds = new Set(trashNotes.map(note => note._id));

        const archivedNotes = JSON.parse(localStorage.getItem('archivedNotes') || '[]');
        const archivedIds = new Set(archivedNotes.map(note => note._id));

        const grouped = {};
        notes
            .filter(note => !trashedIds.has(note._id) && !archivedIds.has(note._id))
            .forEach(note => {
                if (note.date) {
                    const date = new Date(note.date).toLocaleDateString();
                    if (!grouped[date]) {
                        grouped[date] = [];
                    }
                    grouped[date].push(note);
                }
            });
        setNotesGroupedByDate(grouped);
    };

    useEffect(() => {
        rebuildNotesGroupedByDate();
    }, [notes]);

    useEffect(() => {
        const handleTrashOrArchiveUpdated = () => {
            rebuildNotesGroupedByDate();
        };

        window.addEventListener('trashUpdated', handleTrashOrArchiveUpdated);
        window.addEventListener('archiveUpdated', handleTrashOrArchiveUpdated);
        return () => {
            window.removeEventListener('trashUpdated', handleTrashOrArchiveUpdated);
            window.removeEventListener('archiveUpdated', handleTrashOrArchiveUpdated);
        };
    }, [notes]);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const hasNotesOnDate = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString();
        return notesGroupedByDate[dateStr] ? true : false;
    };

    const getNotesForDate = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString();
        return notesGroupedByDate[dateStr] || [];
    };

    const handleDateClick = (day) => {
        if (hasNotesOnDate(day)) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString();
            setSelectedDate(dateStr);
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return (
        <main className="bg-gray-50 min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <FaArrowLeft /> Back to Notes
                    </button>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Calendar View</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        {/* Month Header */}
                        <div className="flex justify-between items-center mb-6">
                            <button 
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <FaChevronLeft />
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <button 
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <FaChevronRight />
                            </button>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {dayNames.map(day => (
                                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-2">
                            {days.map((day, idx) => {
                                const dateStr = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString() : null;
                                const isSelected = selectedDate === dateStr;
                                
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleDateClick(day)}
                                        className={`aspect-square p-2 rounded-lg border-2 flex flex-col items-center justify-center text-sm cursor-pointer transition ${
                                            day === null
                                                ? "bg-gray-50 border-gray-100"
                                                : hasNotesOnDate(day)
                                                ? isSelected 
                                                    ? "border-blue-600 bg-blue-600 font-bold text-white shadow-lg"
                                                    : "border-blue-500 bg-blue-50 hover:bg-blue-100 font-bold text-blue-900"
                                                : "border-gray-200 bg-white hover:bg-gray-50"
                                        }`}
                                    >
                                        {day && (
                                            <>
                                                <span className="font-semibold">{day}</span>
                                                {hasNotesOnDate(day) && (
                                                    <span className={`text-xs px-1 rounded mt-1 ${isSelected ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
                                                        {getNotesForDate(day).length}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes for Selected Date */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {selectedDate ? `Notes on ${selectedDate}` : "Select a date to view notes"}
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedDate ? (
                                notesGroupedByDate[selectedDate] && notesGroupedByDate[selectedDate].length > 0 ? (
                                    notesGroupedByDate[selectedDate].map((note, idx) => (
                                        <div
                                            key={note._id}
                                            className={`p-4 rounded-lg border-l-4 ${
                                                ["border-yellow-500 bg-yellow-50", "border-red-500 bg-red-50", "border-blue-500 bg-blue-50"][
                                                    idx % 3
                                                ]
                                            }`}
                                        >
                                            <p className="font-bold text-gray-900">{note.title}</p>
                                            <p className="text-sm text-gray-700 mt-2">{note.description}</p>
                                            {note.tag && (
                                                <div className="mt-2">
                                                    <span className="inline-block bg-gray-600 text-white text-xs px-2 py-1 rounded">
                                                        {note.tag}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-6">No notes on this date</p>
                                )
                            ) : (
                                <p className="text-gray-400 text-center py-12">Click on a date with notes to view them</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
