-- migrate:up
CREATE TABLE translation_jobs (
  id BIGSERIAL PRIMARY KEY,

  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,

  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  text TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'PENDING',
  attempt INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,

  locked_at TIMESTAMP,
  last_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (message_id, target_language)
);

CREATE INDEX idx_translation_jobs_status
ON translation_jobs (status, locked_at);

-- migrate:down
DROP TABLE translation_jobs;
