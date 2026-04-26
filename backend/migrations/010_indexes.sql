-- A6: 인덱스 배치 마이그레이션 (20건 중 vector 제외 19건)

-- vocs
CREATE INDEX ON vocs (status) WHERE deleted_at IS NULL;
CREATE INDEX ON vocs (system_id);
CREATE INDEX ON vocs (menu_id);
CREATE INDEX ON vocs (assignee_id);
CREATE INDEX ON vocs (author_id);
CREATE INDEX ON vocs (created_at);
CREATE INDEX ON vocs (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX ON vocs (priority, status) WHERE deleted_at IS NULL;
CREATE INDEX ON vocs (deleted_at) WHERE deleted_at IS NOT NULL;

-- voc_history
CREATE INDEX ON voc_history (voc_id);
CREATE INDEX ON voc_history (changed_at);

-- voc_internal_notes (요구사항 명시 partial index)
CREATE INDEX ON voc_internal_notes (voc_id) WHERE deleted_at IS NULL;

-- voc_payload_history (요구사항 명시 복합 인덱스)
CREATE INDEX ON voc_payload_history (voc_id, submitted_at DESC);

-- voc_payload_reviews
CREATE INDEX ON voc_payload_reviews (voc_id);

-- comments
CREATE INDEX ON comments (voc_id);

-- attachments
CREATE INDEX ON attachments (voc_id);

-- notifications (30초 폴링 unread-count + 30일 만료 배치)
CREATE INDEX ON notifications (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX ON notifications (created_at);

-- voc_tags
CREATE INDEX ON voc_tags (tag_id);

-- vocs(embedding) HNSW 인덱스는 NextGen 도입 시 별도 마이그레이션
