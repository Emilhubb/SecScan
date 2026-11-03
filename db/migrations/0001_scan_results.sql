CREATE TABLE IF NOT EXISTS scan_results (
  id uuid PRIMARY KEY,
  user_id text,
  url text NOT NULL,
  scanned_at timestamptz NOT NULL,
  duration_ms integer NOT NULL CHECK (duration_ms >= 0),
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  grade text NOT NULL,
  report_key text,
  redirect_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  findings jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scan_results_user_scanned_at_idx
  ON scan_results (user_id, scanned_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS report_key text;
