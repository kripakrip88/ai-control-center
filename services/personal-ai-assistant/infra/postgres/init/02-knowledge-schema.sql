-- ==========================================
-- Knowledge Hub Database Schema
-- ==========================================

\c knowledge;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Main Knowledge Table
-- ==========================================
CREATE TABLE IF NOT EXISTS knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source information
    source VARCHAR(50) NOT NULL,                    -- telegram, pocket, bookmarks, etc.
    source_id VARCHAR(255) NOT NULL,                -- unique ID from source

    -- Content
    raw_content TEXT NOT NULL,                      -- original content
    clean_content TEXT,                             -- cleaned/processed content
    summary TEXT,                                   -- AI-generated summary

    -- Classification
    topics TEXT[],                                  -- array of topics
    entities JSONB,                                 -- extracted entities
    importance DECIMAL(3,2) DEFAULT 0.5,           -- 0.0 to 1.0

    -- Embeddings
    embedding_id VARCHAR(100),                      -- reference to Qdrant vector

    -- Review system (spaced repetition)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reviewed TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    next_review_at TIMESTAMP,

    -- Metadata
    metadata JSONB,                                 -- flexible metadata from source
    status VARCHAR(20) DEFAULT 'processing',        -- processing, ready, archived

    -- Constraints
    UNIQUE(source, source_id)
);

-- Indexes
CREATE INDEX idx_knowledge_source ON knowledge(source);
CREATE INDEX idx_knowledge_status ON knowledge(status);
CREATE INDEX idx_knowledge_created_at ON knowledge(created_at DESC);
CREATE INDEX idx_knowledge_next_review ON knowledge(next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_knowledge_importance ON knowledge(importance DESC);
CREATE INDEX idx_knowledge_topics ON knowledge USING GIN(topics);
CREATE INDEX idx_knowledge_metadata ON knowledge USING GIN(metadata);

-- ==========================================
-- Topics Table (normalized)
-- ==========================================
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES topics(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topics_name ON topics(name);
CREATE INDEX idx_topics_parent ON topics(parent_id);

-- ==========================================
-- Entities Table
-- ==========================================
CREATE TABLE IF NOT EXISTS entities (
    id SERIAL PRIMARY KEY,
    knowledge_id UUID REFERENCES knowledge(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,              -- person, organization, location, etc.
    entity_value VARCHAR(255) NOT NULL,
    confidence DECIMAL(3,2),                       -- 0.0 to 1.0
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entities_knowledge ON entities(knowledge_id);
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_value ON entities(entity_value);

-- ==========================================
-- Review Schedule Table
-- ==========================================
CREATE TABLE IF NOT EXISTS review_schedule (
    id SERIAL PRIMARY KEY,
    knowledge_id UUID REFERENCES knowledge(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    result VARCHAR(20),                            -- reviewed, skipped, postponed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_schedule_knowledge ON review_schedule(knowledge_id);
CREATE INDEX idx_review_schedule_scheduled ON review_schedule(scheduled_at) WHERE completed_at IS NULL;

-- ==========================================
-- User Interactions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS user_interactions (
    id SERIAL PRIMARY KEY,
    knowledge_id UUID REFERENCES knowledge(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,         -- viewed, searched, reviewed, shared
    source VARCHAR(50),                            -- telegram, web, api
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interactions_knowledge ON user_interactions(knowledge_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_interactions_created ON user_interactions(created_at DESC);

-- ==========================================
-- Statistics View
-- ==========================================
CREATE OR REPLACE VIEW knowledge_stats AS
SELECT
    source,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'ready') as ready_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    AVG(importance) as avg_importance,
    COUNT(DISTINCT embedding_id) FILTER (WHERE embedding_id IS NOT NULL) as with_embeddings,
    MAX(created_at) as last_added
FROM knowledge
GROUP BY source;

-- ==========================================
-- Review Due Function
-- ==========================================
CREATE OR REPLACE FUNCTION get_reviews_due(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    id UUID,
    source VARCHAR,
    summary TEXT,
    topics TEXT[],
    days_since_last_review INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.source,
        k.summary,
        k.topics,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - k.last_reviewed))::INTEGER as days_since_last_review
    FROM knowledge k
    WHERE
        k.status = 'ready'
        AND k.next_review_at <= CURRENT_TIMESTAMP
    ORDER BY k.next_review_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Calculate Next Review Date Function
-- ==========================================
CREATE OR REPLACE FUNCTION calculate_next_review(review_count INTEGER)
RETURNS TIMESTAMP AS $$
DECLARE
    intervals INTEGER[] := ARRAY[3, 14, 45, 90];
    days_to_add INTEGER;
BEGIN
    IF review_count = 0 THEN
        days_to_add := intervals[1];
    ELSIF review_count < array_length(intervals, 1) THEN
        days_to_add := intervals[review_count + 1];
    ELSE
        days_to_add := intervals[array_length(intervals, 1)];
    END IF;

    RETURN CURRENT_TIMESTAMP + (days_to_add || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Trigger: Update Next Review Date
-- ==========================================
CREATE OR REPLACE FUNCTION update_next_review()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_reviewed IS NOT NULL THEN
        NEW.next_review_at := calculate_next_review(NEW.review_count);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_review
BEFORE UPDATE ON knowledge
FOR EACH ROW
WHEN (OLD.last_reviewed IS DISTINCT FROM NEW.last_reviewed)
EXECUTE FUNCTION update_next_review();

-- ==========================================
-- Initial Data
-- ==========================================

-- Insert common topics
INSERT INTO topics (name, description) VALUES
    ('AI', 'Artificial Intelligence and Machine Learning'),
    ('Programming', 'Software development and coding'),
    ('Business', 'Business and entrepreneurship'),
    ('Science', 'Scientific articles and research'),
    ('Health', 'Health and wellness'),
    ('Technology', 'Technology news and trends')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO n8n;
