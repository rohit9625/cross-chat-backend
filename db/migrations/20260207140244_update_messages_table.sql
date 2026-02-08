-- migrate:up
CREATE TYPE translation_state AS ENUM (
  'IDLE',
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

ALTER TABLE messages
  ADD COLUMN auto_translate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN translation_status translation_state NOT NULL DEFAULT 'IDLE',
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD CONSTRAINT messages_translation_state_guard
    CHECK (
      auto_translate = true
      OR translation_status = 'IDLE'
    );

-- migrate:down
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_translation_state_guard,
  DROP COLUMN IF EXISTS translation_status,
  DROP COLUMN IF EXISTS auto_translate,
  DROP COLUMN IF EXISTS updated_at;

DROP TYPE IF EXISTS translation_state;
