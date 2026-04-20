# full template

현재 env-setup 수준의 완전한 Claude Code 환경. standard + 스킬 안내 + 문서 구조 포함.

**Status:** ✅ V5 Full Template

## 포함 내용

```
full/
└── .claude/
    ├── CLAUDE.md      # standard + skills 섹션 + docs 구조 안내
    └── settings.json  # block-destructive hook (~/.claude/hooks/ 참조)
```

## CLAUDE.md 주요 내용 (standard 대비 추가)

- 문서 일관성 규칙 (spec ↔ plan 동기화)
- Skills 안내: `/onboard-project`, `/setup-docs-structure` 실행 방법
- Diátaxis 문서 구조 참고 (tutorials/how-to/reference/explanation/adr/internal)

## 언제 사용할까요?

`onboard-project` 스킬 complexity score 7-10: 멀티 언어/모노레포, 팀/공개 프로젝트, 문서화 요구.

**적합한 경우:**
- 공개 오픈소스 프로젝트
- 팀 협업 또는 리뷰가 있는 프로젝트
- 체계적인 문서 구조가 필요한 경우
- 이 env-setup 자체와 같은 방법론 프로젝트

## 사용법

```bash
~/.claude/install.sh /path/to/your-project
# → .claude/settings.json 자동 생성

cp templates/full/.claude/CLAUDE.md /path/to/your-project/.claude/
# 플레이스홀더 수동 치환: vocpage, unknown 등

# 스킬 설치 (선택):
cp -r harness/skills/onboard-project ~/.claude/skills/
cp -r harness/skills/setup-docs-structure ~/.claude/skills/
```

## 참고

- 스킬 설계: `harness/skills/onboard-project/SKILL.md`
- 문서 구조 스킬: `harness/skills/setup-docs-structure/SKILL.md`
- V5 통합 설계: `docs/specs/2026-04-18-v5-unified-design.md`
