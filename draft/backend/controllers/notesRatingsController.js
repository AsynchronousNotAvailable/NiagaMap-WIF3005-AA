const supabase = require('../supabase/supabase_client');

/**
 * Get note for an analysis
 */
const getAnalysisNote = async (req, res) => {
    try {
        const { analysisId } = req.params;
        
        const { data, error } = await supabase
            .from('analysis_notes')
            .select('*')
            .eq('analysis_id', analysisId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }
        
        res.json({ note: data || null });
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
};

/**
 * Create or update note for an analysis
 */
const upsertAnalysisNote = async (req, res) => {
    try {
        const { analysisId, userId } = req.params;
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Note content is required' });
        }
        
        // Check if note exists
        const { data: existing } = await supabase
            .from('analysis_notes')
            .select('note_id')
            .eq('analysis_id', analysisId)
            .single();
        
        if (existing) {
            // Update existing note
            const { error } = await supabase
                .from('analysis_notes')
                .update({ content })
                .eq('note_id', existing.note_id);
            
            if (error) throw error;
            
            res.json({ message: 'Note updated successfully' });
        } else {
            // Create new note
            const { data, error } = await supabase
                .from('analysis_notes')
                .insert([{
                    analysis_id: analysisId,
                    user_id: userId,
                    content
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            res.status(201).json({ noteId: data.note_id, message: 'Note created successfully' });
        }
    } catch (error) {
        console.error('Error upserting note:', error);
        res.status(500).json({ error: 'Failed to save note' });
    }
};

/**
 * Delete note for an analysis
 */
const deleteAnalysisNote = async (req, res) => {
    try {
        const { analysisId } = req.params;
        
        const { error } = await supabase
            .from('analysis_notes')
            .delete()
            .eq('analysis_id', analysisId);
        
        if (error) throw error;
        
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
};

/**
 * Get rating for an analysis
 */
const getAnalysisRating = async (req, res) => {
    try {
        const { analysisId, userId } = req.params;
        
        const { data, error } = await supabase
            .from('analysis_ratings')
            .select('*')
            .eq('analysis_id', analysisId)
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }
        
        res.json({ rating: data || null });
    } catch (error) {
        console.error('Error fetching rating:', error);
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
};

/**
 * Set rating for an analysis
 */
const setAnalysisRating = async (req, res) => {
    try {
        const { analysisId, userId } = req.params;
        const { rating } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        // Check if rating exists
        const { data: existing } = await supabase
            .from('analysis_ratings')
            .select('rating_id')
            .eq('analysis_id', analysisId)
            .eq('user_id', userId)
            .single();
        
        if (existing) {
            // Update existing rating
            const { error } = await supabase
                .from('analysis_ratings')
                .update({ rating })
                .eq('rating_id', existing.rating_id);
            
            if (error) throw error;
            
            res.json({ message: 'Rating updated successfully' });
        } else {
            // Create new rating
            const { data, error } = await supabase
                .from('analysis_ratings')
                .insert([{
                    analysis_id: analysisId,
                    user_id: userId,
                    rating
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            res.status(201).json({ ratingId: data.rating_id, message: 'Rating created successfully' });
        }
    } catch (error) {
        console.error('Error setting rating:', error);
        res.status(500).json({ error: 'Failed to set rating' });
    }
};

/**
 * Delete rating for an analysis
 */
const deleteAnalysisRating = async (req, res) => {
    try {
        const { analysisId, userId } = req.params;
        
        const { error } = await supabase
            .from('analysis_ratings')
            .delete()
            .eq('analysis_id', analysisId)
            .eq('user_id', userId);
        
        if (error) throw error;
        
        res.json({ message: 'Rating deleted successfully' });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({ error: 'Failed to delete rating' });
    }
};

module.exports = {
    getAnalysisNote,
    upsertAnalysisNote,
    deleteAnalysisNote,
    getAnalysisRating,
    setAnalysisRating,
    deleteAnalysisRating
};
