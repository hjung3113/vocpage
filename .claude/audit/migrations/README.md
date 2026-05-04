# Audit Schema Migrations

`registry_version`이 stats.json과 mismatch되면 audit는 **hard stop** (운영 후 마이그레이션 도구 출시 전까지는 warn-and-continue + suspension 권고).

## 마이그레이션 명세 형식

`vN-to-vN+1.md` 한 파일로:

```
## What changed
- registry.json 변경 사항 (필드 추가·이름 변경·삭제)
- stats.json items[*] 스키마 변경

## Manual migration steps
1. stats.json 백업: cp stats.json stats.json.v<N>.bak
2. <스크립트 또는 수동 변환 절차>
3. stats.json `version`/`registry_version` 갱신

## Validation
- jq -e '.version == <N+1>' stats.json
- 모든 items[*]가 신규 스키마 충족하는지 확인
```

## v1 → v2 (현재)

v1 stats.json은 빈 상태였으므로 마이그레이션 불필요. 신규 stats.json v2로 시작.
