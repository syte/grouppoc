CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  age INT,
  country TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_groups (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

-- Configure how many users are needed for test --
\set user_count 40000

INSERT INTO groups (id, name) VALUES
  (uuid_generate_v4(), 'YoungAmerican'),
  (uuid_generate_v4(), 'American'),
  (uuid_generate_v4(), 'Senior')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (id, username, email, age, country)
SELECT
  uuid_generate_v4(),
  'par_' || gs,
  'par_' || gs || '@grouppoc.com',
  (random() * 70 + 10)::int,
  (ARRAY['USA', 'Canada', 'UK', 'Germany', 'France', 'India', 'Australia'])[floor(random()*7 + 1)]
FROM generate_series(1, :user_count) gs;

WITH user_group_assignments AS (
  SELECT
    u.id AS user_id,
    g.id AS group_id
  FROM
    users u
    INNER JOIN groups g ON
      (g.name = 'YoungAmerican' AND u.age < 30)
      OR (g.name = 'American' AND u.country = 'USA')
      OR (g.name = 'Senior' AND u.age > 60)
)
INSERT INTO user_groups (user_id, group_id)
SELECT user_id, group_id
FROM user_group_assignments
ON CONFLICT DO NOTHING;
