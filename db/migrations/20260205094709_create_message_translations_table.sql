-- migrate:up
CREATE TABLE IF NOT EXISTS message_translations (
  id SERIAL PRIMARY KEY,
  message_id INT REFERENCES messages(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  provider TEXT DEFAULT 'lingo.dev',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (message_id, language)
);

-- migrate:down
DROP TABLE message_translations;
