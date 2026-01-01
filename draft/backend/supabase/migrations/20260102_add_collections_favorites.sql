-- Migration: Add Collections, Tags, Notes, and Ratings tables
-- Date: 2026-01-02
-- Database: PostgreSQL (Supabase)

-- Collections table for organizing analyses
CREATE TABLE IF NOT EXISTS collections (
    collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#8B5CF6',
    icon VARCHAR(10) DEFAULT '📁',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for analyses in collections (many-to-many)
CREATE TABLE IF NOT EXISTS analysis_collections (
    analysis_id TEXT NOT NULL,
    collection_id UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (analysis_id, collection_id),
    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE
);

-- Tags table for categorization
CREATE TABLE IF NOT EXISTS tags (
    tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, name)
);

-- Junction table for analysis tags (many-to-many)
CREATE TABLE IF NOT EXISTS analysis_tags (
    analysis_id TEXT NOT NULL,
    tag_id UUID NOT NULL,
    tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (analysis_id, tag_id),
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

-- Notes table for analysis annotations
CREATE TABLE IF NOT EXISTS analysis_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table for star ratings
CREATE TABLE IF NOT EXISTS analysis_ratings (
    rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (analysis_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_collections_analysis_id ON analysis_collections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_collections_collection_id ON analysis_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_tags_analysis_id ON analysis_tags(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_tags_tag_id ON analysis_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_analysis_notes_analysis_id ON analysis_notes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_ratings_analysis_id ON analysis_ratings(analysis_id);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view their own collections" ON collections
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own collections" ON collections
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own collections" ON collections
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own tags" ON tags
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own tags" ON tags
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tags" ON tags
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tags" ON tags
    FOR DELETE USING (auth.uid()::text = user_id);

-- Allow all authenticated users to manage their analysis associations
CREATE POLICY "Users can manage analysis collections" ON analysis_collections
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage analysis tags" ON analysis_tags
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own notes" ON analysis_notes
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own notes" ON analysis_notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notes" ON analysis_notes
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own notes" ON analysis_notes
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own ratings" ON analysis_ratings
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own ratings" ON analysis_ratings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own ratings" ON analysis_ratings
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own ratings" ON analysis_ratings
    FOR DELETE USING (auth.uid()::text = user_id);
