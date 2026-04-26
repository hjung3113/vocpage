-- A3: Sub-task 채번 인프라 — voc_subtask_counters 테이블
-- parent_voc_id별 마지막 순번을 추적, SELECT FOR UPDATE로 동시성 안전 보장
CREATE TABLE voc_subtask_counters (
  parent_voc_id uuid NOT NULL REFERENCES vocs(id) ON DELETE CASCADE PRIMARY KEY,
  last_seq       int  NOT NULL DEFAULT 0
);

-- A3: Sub-task 채번 트리거 함수
-- Sub-task ID = {parent-issue-code}-{N}, 삭제 후 번호 재사용 금지
CREATE OR REPLACE FUNCTION generate_subtask_seq()
RETURNS TRIGGER AS $$
DECLARE
  v_seq        int;
  v_parent_code text;
BEGIN
  -- parent_id가 있는 row(Sub-task)에만 적용
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 순번 카운터 행 잠금 후 증가 (race condition 방지)
  INSERT INTO voc_subtask_counters (parent_voc_id, last_seq)
  VALUES (NEW.parent_id, 1)
  ON CONFLICT (parent_voc_id)
  DO UPDATE SET last_seq = voc_subtask_counters.last_seq + 1
  RETURNING last_seq INTO v_seq;

  SELECT issue_code INTO v_parent_code FROM vocs WHERE id = NEW.parent_id;
  NEW.issue_code  := v_parent_code || '-' || v_seq;
  NEW.sequence_no := v_seq;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subtask_seq
  BEFORE INSERT ON vocs
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL AND NEW.issue_code IS NULL)
  EXECUTE FUNCTION generate_subtask_seq();

-- A4: Sub-task 1레벨 강제 트리거 — parent_id의 row가 이미 sub-task이면 오류
CREATE OR REPLACE FUNCTION enforce_subtask_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM vocs WHERE id = NEW.parent_id AND parent_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Sub-task는 최대 1레벨만 허용됩니다 (parent_id=% 는 이미 sub-task)', NEW.parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subtask_depth
  BEFORE INSERT OR UPDATE ON vocs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_subtask_depth();
