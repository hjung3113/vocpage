# validators/ 레이어는 현재 비어있어도 유지한다

`backend/src/validators/voc.ts`가 현재 `shared/contracts/voc`를 그대로 재-export만 하더라도 삭제하지 않는다.

## Context

YAGNI 원칙대로라면 레버리지가 0인 파일은 삭제 대상이다. 그러나 `backend/src/CLAUDE.md`가 `validators/`를 *"zod-to-Express 어댑터 — schemas는 shared/contracts에, BE 전용 규칙은 여기"*로 명시적으로 선언하고 있다. 이 심(seam)은 팀이 설계 비용을 이미 지불한 문서화된 아키텍처다.

## Decision

유지한다. 이 레이어의 용도는 다음이다:

- `shared/contracts`는 FE(react-hook-form)와 BE가 공유 — FE 전용 필드나 FE transform이 섞임
- BE 전용 검증(서버사이드 trim, whitespace 정규화, DB uniqueness preflight, 파일 크기 제한 등)은 이 어댑터에 추가한다
- `shared/contracts`를 오염시키지 않고 BE 전용 규칙을 둘 공식 위치가 필요하다

## Considered Options

**삭제 후 필요 시 재생성:** 30초면 되는 기계적 작업. 그러나 재생성 타이밍을 놓치면 개발자가 `shared/contracts`에 BE 전용 로직을 추가하는 잘못된 선택을 하게 된다.

**유지 (채택):** 선언된 아키텍처 경계를 보존. 첫 BE 전용 검증 규칙이 추가될 때 자연스럽게 채워진다. Wave 1.7 BE 단계(파일 첨부 포함)에서 multipart 검증이 이 레이어에 가장 먼저 들어올 것으로 예상한다.
