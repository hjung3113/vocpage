# 외부 마스터 연동 명세

> 상태: 2026-04-24 확정 (설비 마스터 MSSQL 스키마 TBD)
> 연관 스펙: `requirements.md §16.3`

## 1. 마스터 3종 개요

| 마스터          | 원천      | Refresh 대상 | 커버 필드                                          |
| --------------- | --------- | ------------ | -------------------------------------------------- |
| 설비 마스터     | MSSQL     | O            | `equipment`, `maker`, `model`, `process`           |
| DB 마스터       | MSSQL     | O            | `related_db_tables`, `related_jobs`, `related_sps` |
| 프로그램 마스터 | JSON 파일 | X            | `related_programs`                                 |

## 2. 필드-마스터 매핑

| `structured_payload` 필드 | 마스터          | 검증 여부 |
| ------------------------- | --------------- | --------- |
| `equipment`               | 설비 마스터     | O         |
| `maker`                   | 설비 마스터     | O         |
| `model`                   | 설비 마스터     | O         |
| `process`                 | 설비 마스터     | O         |
| `related_programs`        | 프로그램 마스터 | O         |
| `related_db_tables`       | DB 마스터       | O         |
| `related_jobs`            | DB 마스터       | O         |
| `related_sps`             | DB 마스터       | O         |

## 3. 설비 마스터

**원천**: MSSQL (현재 운영 DB)
**Refresh**: atomic swap 대상 (`§16.3`)

**캐시 구조**:

```json
{
  "equipment": ["설비A", "설비B"],
  "maker": ["메이커X"],
  "model": ["모델-123"],
  "process": ["공정1"]
}
```

**MSSQL 스키마**: **TBD** — 담당자 자료 수집 후 확정.

**구현 stub**: 스키마 확정 전까지 `config/masters/equipment-stub.json` 파일 읽기로 대체.
확정 후 로더 함수 1개만 MSSQL 쿼리로 교체 (나머지 코드 변동 없음).

## 4. DB 마스터

**원천**: MSSQL
**Refresh**: atomic swap 대상 (`§16.3`)

**캐시 구조**:

```json
{
  "db_tables": ["테이블명1", "테이블명2"],
  "jobs": ["잡명1", "잡명2"],
  "sps": ["SP명1", "SP명2"]
}
```

**MSSQL 쿼리**:

| 필드        | 쿼리                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| `db_tables` | `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME` |
| `jobs`      | `SELECT name FROM msdb.dbo.sysjobs ORDER BY name`                      |
| `sps`       | `SELECT name FROM sys.procedures ORDER BY name`                        |

> `jobs` 쿼리는 SQL Server Agent 접근 권한 필요. `msdb` DB에 접근 가능한 계정 사용.

## 5. 프로그램 마스터

**원천**: `config/masters/programs.json`
**Refresh**: 불가 — 서버 재시작으로 대체. API refresh 대상 **제외**.

**파일 형식**:

```json
["ProgramA", "ProgramB", "ProgramC"]
```

**변경 절차**: 파일 수정 → 서버 재시작. 변경 빈도 매우 낮음.
**NextGen 승격 조건**: 관리 필요성 실측 후 MSSQL 기반 전환 재논의.

## 6. Refresh API `sources` 구조

`POST /api/admin/masters/refresh` 응답:

```json
{
  "swapped": true,
  "loaded_at": "<timestamp>",
  "sources": {
    "equipment": { "loaded_at": "<timestamp>" },
    "db": { "loaded_at": "<timestamp>" }
  }
}
```

> `program`은 부팅 시 고정 로드. refresh 대상 아님 — 응답에 포함하지 않음.

## 7. 설비 마스터 TBD 기간 구현 전략

설비 마스터 MSSQL 스키마 확정 전 전체 구현 unblock을 위해 stub 사용:

- `config/masters/equipment-stub.json` — 더미 데이터로 채운 stub 파일
- 로더 함수 인터페이스는 실 구현과 동일하게 유지
- 스키마 확정 시 로더 함수 1개만 교체 → 나머지 코드(캐시·swap·검증 로직) 변동 없음

## 8. Cold Start 시나리오 (스냅샷 파일 미존재)

최초 배포 또는 스냅샷 파일이 아직 생성되지 않은 상태에서 BE 부팅 시:

- **동작**: 기동 실패 없이 계속 진행 (A안 채택). 외부 마스터 메모리를 빈 상태로 초기화.
- **검증 결과**: 모든 외부 마스터 필드를 `unverified`로 판정 → `review_status='unverified'` 동반.
- **UI 배지**: Manager/Admin 화면에 **"콜드 스타트 모드"** 배지 노출 (스냅샷 모드 배지와 구분).
- **해제 조건**: 수동 Refresh 성공 후 스냅샷 파일 생성 시 배지 자동 해제.
