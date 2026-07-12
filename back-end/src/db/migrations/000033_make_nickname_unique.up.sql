WITH ranked_nicknames AS (
    SELECT
        id,
        TRIM(nickname) AS trimmed_nickname,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(nickname))
            ORDER BY created_at, id
        ) AS row_number
    FROM users
    WHERE nickname IS NOT NULL AND TRIM(nickname) <> ''
)
UPDATE users
SET nickname = SUBSTR((SELECT trimmed_nickname FROM ranked_nicknames WHERE ranked_nicknames.id = users.id), 1, 24)
    || '_'
    || SUBSTR(users.id, 1, 5)
WHERE id IN (
    SELECT id
    FROM ranked_nicknames
    WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_unique
ON users (LOWER(TRIM(nickname)))
WHERE nickname IS NOT NULL AND TRIM(nickname) <> '';