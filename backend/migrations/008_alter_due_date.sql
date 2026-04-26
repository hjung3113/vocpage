-- A2: due_date 타입 수정 (timestamptz → date)
-- SLA 준수율 계산은 날짜 단위 비교이므로 date 타입이 의미상 정확
ALTER TABLE vocs ALTER COLUMN due_date TYPE date USING due_date::date;
