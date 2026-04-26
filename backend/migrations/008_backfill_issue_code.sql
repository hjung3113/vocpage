-- 008: issue_code 백필 — sequence_no가 NULL인 기존 VOC 행에 대해 트리거 로직을 재현하여 채번
-- 트리거 WHEN (NEW.sequence_no IS NULL) 조건으로 인해 ON CONFLICT DO NOTHING 시드 재실행 시
-- 기존 행의 issue_code/sequence_no가 채워지지 않는 문제를 해결합니다.

DO $$
DECLARE
  v_rec  record;
  v_year int;
  v_seq  int;
  v_slug text;
BEGIN
  FOR v_rec IN
    SELECT id, system_id, created_at
    FROM vocs
    WHERE sequence_no IS NULL
    ORDER BY created_at, id
  LOOP
    v_year := EXTRACT(YEAR FROM v_rec.created_at)::int;

    INSERT INTO voc_sequence_counters (system_id, year, last_seq)
    VALUES (v_rec.system_id, v_year, 1)
    ON CONFLICT (system_id, year)
    DO UPDATE SET last_seq = voc_sequence_counters.last_seq + 1
    RETURNING last_seq INTO v_seq;

    SELECT slug INTO v_slug FROM systems WHERE id = v_rec.system_id;

    UPDATE vocs
    SET
      sequence_no = v_seq,
      issue_code  = UPPER(v_slug) || '-' || LPAD(v_year::text, 4, '0') || '-' || LPAD(v_seq::text, 4, '0')
    WHERE id = v_rec.id;
  END LOOP;
END;
$$;
