## 요약 (Why + What)

<!-- 이 PR이 무엇을 하고 왜 필요한지 한두 줄로 작성 -->

## 체크리스트 (Phase 8 §7 강제 4 항목)

- [ ] runtime fetch / `<script src="https://...">` 추가 0건
- [ ] CDN URL (Google Fonts, jsDelivr, unpkg, Tailwind play 등) 0건
- [ ] telemetry / analytics 산출물 0건
- [ ] 폰트·아이콘·MSW worker self-host 유지, `package-lock.json` 커밋 포함
- [ ] frontend/public/fonts/{Pretendard-Variable,D2Coding}.woff2 자기호스팅 바이너리 커밋 완료 (또는 별도 follow-up issue 링크)

## 검증 명령

```
npm run -w frontend typecheck
npm run -w backend typecheck
npm run -w frontend build
# lint result (Wave 0-11 이후)
# MSW /health 수동 확인 (Wave 0+)
```

## 관련 spec / plan

<!-- 관련 docs/specs/ 경로 또는 phase-N.md 섹션 -->

## 스크린샷 / 시각 회귀

<!-- UI PR일 때만 — before/after 캡처 -->
