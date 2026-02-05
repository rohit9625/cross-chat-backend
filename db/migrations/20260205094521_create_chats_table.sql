-- migrate:up
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  type TEXT CHECK (type IN ('DIRECT', 'GROUP')) DEFAULT 'DIRECT',
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW()
);

-- migrate:down
DROP TABLE chats;
