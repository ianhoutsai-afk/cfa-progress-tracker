CREATE TABLE progress_state (
 user_id TEXT PRIMARY KEY NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,
 state_json TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
