-- migrate:up
CREATE TABLE IF NOT EXISTS chat_members (
  id SERIAL PRIMARY KEY,
  chat_id INT REFERENCES chats(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('MEMBER', 'ADMIN')) DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (chat_id, user_id)
);

-- migrate:down
DROP TABLE chat_members;
