const supabase = require('../supabase/supabase_client');

/**
 * Get all tags for a user
 */
const getTags = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { data: tags, error } = await supabase
            .from('tags')
            .select(`
                *,
                analysis_tags(count)
            `)
            .eq('user_id', userId)
            .order('name');
        
        if (error) throw error;
        
        // Format with usage count
        const formattedTags = tags.map(t => ({
            ...t,
            usageCount: t.analysis_tags?.[0]?.count || 0
        }));
        
        res.json({ tags: formattedTags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
};

/**
 * Create a new tag
 */
const createTag = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, color } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Tag name is required' });
        }
        
        const { data, error } = await supabase
            .from('tags')
            .insert([{
                user_id: userId,
                name,
                color: color || '#3B82F6'
            }])
            .select()
            .single();
        
        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.status(400).json({ error: 'Tag name already exists' });
            }
            throw error;
        }
        
        res.status(201).json({ tagId: data.tag_id, message: 'Tag created successfully' });
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
};

/**
 * Update a tag
 */
const updateTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        const { name, color } = req.body;
        
        const { error } = await supabase
            .from('tags')
            .update({ name, color })
            .eq('tag_id', tagId);
        
        if (error) throw error;
        
        res.json({ message: 'Tag updated successfully' });
    } catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({ error: 'Failed to update tag' });
    }
};

/**
 * Delete a tag
 */
const deleteTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        
        const { error } = await supabase
            .from('tags')
            .delete()
            .eq('tag_id', tagId);
        
        if (error) throw error;
        
        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
};

/**
 * Add tag to analysis
 */
const addTagToAnalysis = async (req, res) => {
    try {
        const { analysisId, tagId } = req.params;
        
        // Check if already exists
        const { data: existing } = await supabase
            .from('analysis_tags')
            .select('*')
            .eq('analysis_id', analysisId)
            .eq('tag_id', tagId)
            .single();
        
        if (existing) {
            return res.status(400).json({ error: 'Tag already added to analysis' });
        }
        
        const { error } = await supabase
            .from('analysis_tags')
            .insert([{
                analysis_id: analysisId,
                tag_id: tagId
            }]);
        
        if (error) throw error;
        
        res.json({ message: 'Tag added to analysis' });
    } catch (error) {
        console.error('Error adding tag to analysis:', error);
        res.status(500).json({ error: 'Failed to add tag to analysis' });
    }
};

/**
 * Remove tag from analysis
 */
const removeTagFromAnalysis = async (req, res) => {
    try {
        const { analysisId, tagId } = req.params;
        
        const { error } = await supabase
            .from('analysis_tags')
            .delete()
            .eq('analysis_id', analysisId)
            .eq('tag_id', tagId);
        
        if (error) throw error;
        
        res.json({ message: 'Tag removed from analysis' });
    } catch (error) {
        console.error('Error removing tag from analysis:', error);
        res.status(500).json({ error: 'Failed to remove tag from analysis' });
    }
};

/**
 * Get tags for an analysis
 */
const getAnalysisTags = async (req, res) => {
    try {
        const { analysisId } = req.params;
        
        const { data, error } = await supabase
            .from('analysis_tags')
            .select(`
                tagged_at,
                tags (*)
            `)
            .eq('analysis_id', analysisId)
            .order('tagged_at', { ascending: false });
        
        if (error) throw error;
        
        // Flatten the response
        const tags = data.map(item => ({
            ...item.tags,
            taggedAt: item.tagged_at
        }));
        
        res.json({ tags });
    } catch (error) {
        console.error('Error fetching analysis tags:', error);
        res.status(500).json({ error: 'Failed to fetch analysis tags' });
    }
};

module.exports = {
    getTags,
    createTag,
    updateTag,
    deleteTag,
    addTagToAnalysis,
    removeTagFromAnalysis,
    getAnalysisTags
};
