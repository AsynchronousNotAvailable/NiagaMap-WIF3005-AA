import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from "../api/api";

const NotesModal = ({ analysis, userId, onClose, darkMode = false }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchNote();
    }, [analysis.analysisId]);

    const fetchNote = async () => {
        try {
            const response = await api.get(`/api/analyses/${analysis.analysisId}/note`);
            if (response.data.note) {
                setContent(response.data.note.content);
            }
        } catch (error) {
            console.error('Error fetching note:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) {
            showToast('Note cannot be empty', 'warning');
            return;
        }

        setSaving(true);
        try {
            await api.post(`/api/analyses/${analysis.analysisId}/note/${userId}`, { content });
            showToast('Note saved successfully!', 'success');
            onClose(true); // Pass true to indicate note was saved
        } catch (error) {
            console.error('Error saving note:', error);
            showToast('Failed to save note', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;

        setSaving(true);
        try {
            await api.delete(`/api/analyses/${analysis.analysisId}/note`);
            showToast('Note deleted successfully!', 'success');
            onClose(true);
        } catch (error) {
            console.error('Error deleting note:', error);
            showToast('Failed to delete note', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: darkMode ? '#1a1a2e' : '#fff',
                    borderRadius: 24,
                    padding: 32,
                    width: '100%',
                    maxWidth: 600,
                    maxHeight: '80vh',
                    overflow: 'auto',
                    border: `1px solid ${darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h2
                        style={{
                            fontSize: 22,
                            fontWeight: 600,
                            marginBottom: 8,
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        📝 Analysis Notes
                    </h2>
                    <p style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {analysis.referencePoint?.name || 'Analysis'}
                    </p>
                </div>

                {/* Textarea */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <div
                            style={{
                                display: 'inline-block',
                                width: 32,
                                height: 32,
                                border: '3px solid rgba(139, 92, 246, 0.2)',
                                borderTop: '3px solid #8B5CF6',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }}
                        />
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add your notes about this analysis..."
                        disabled={saving}
                        style={{
                            width: '100%',
                            minHeight: 200,
                            padding: 16,
                            borderRadius: 12,
                            border: `2px solid ${darkMode ? 'rgba(139, 92, 246, 0.2)' : '#e2e8f0'}`,
                            background: darkMode ? '#252540' : '#f8fafc',
                            color: darkMode ? '#f1f5f9' : '#1e293b',
                            fontSize: 14,
                            lineHeight: 1.6,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            transition: 'all 0.25s ease',
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#8B5CF6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = darkMode ? 'rgba(139, 92, 246, 0.2)' : '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            flex: 1,
                            padding: 14,
                            borderRadius: 12,
                            background: darkMode ? '#252540' : '#f1f5f9',
                            color: darkMode ? '#f1f5f9' : '#64748b',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.5 : 1,
                            transition: 'all 0.25s ease',
                        }}
                    >
                        Cancel
                    </button>
                    {content && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            style={{
                                padding: '14px 20px',
                                borderRadius: 12,
                                background: 'transparent',
                                color: '#ef4444',
                                border: '2px solid rgba(239, 68, 68, 0.3)',
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.5 : 1,
                                transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={(e) => !saving && (e.target.style.background = '#ef4444', e.target.style.color = '#fff')}
                            onMouseLeave={(e) => !saving && (e.target.style.background = 'transparent', e.target.style.color = '#ef4444')}
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !content.trim()}
                        style={{
                            flex: 1,
                            padding: 14,
                            borderRadius: 12,
                            background: saving || !content.trim()
                                ? darkMode ? '#252540' : '#e2e8f0'
                                : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                            color: saving || !content.trim()
                                ? darkMode ? '#64748b' : '#94a3b8'
                                : '#fff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: saving || !content.trim() ? 'not-allowed' : 'pointer',
                            boxShadow: saving || !content.trim() ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                            transition: 'all 0.25s ease',
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default NotesModal;
