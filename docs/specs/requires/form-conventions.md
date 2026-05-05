# Form / Validation Conventions

**When to read:** RHF + Zod 폼 작성, schema 파일 위치, 서버 에러 매핑 규칙이 필요할 때

> Frontend 폼·검증 정본 문서.

---

## §13.1 도구

```
폼 상태     React Hook Form
검증        Zod (zodResolver 사용)
resolver    hook 내부에서 선언 (컴포넌트에 직접 쓰지 않음)
```

---

## §13.2 Schema 위치 규칙

| Schema 종류                  | 위치                                                   |
| ---------------------------- | ------------------------------------------------------ |
| API 계약 schema (FE+BE 공용) | `shared/contracts/{domain}/{subject}.schema.ts`        |
| UI-only 필드 extension       | `features/{feature}/model/{action}-{entity}.schema.ts` |

UI-only 예시: `confirmPassword`, `agreeToTerms` 등 BE로 전송하지 않는 필드.  
`features` schema는 `shared/contracts` schema를 `extend`/`merge`해서 사용.

```ts
// features/voc-create/model/create-voc.schema.ts
import { vocCreateSchema } from '@contracts/voc/voc-create.schema';
export const createVocFormSchema = vocCreateSchema.extend({
  // UI-only fields if any
});
```

---

## §13.3 파일명 규칙

```
{action}-{entity}.schema.ts          create-voc.schema.ts, update-voc.schema.ts
{action}-{entity}.default-values.ts  create-voc.default-values.ts
use{Action}{Entity}Form.ts            useCreateVocForm.ts
```

feature 내 schema가 여러 개인 경우: 파일당 schema export 1개.

---

## §13.4 feature 구조

```
features/voc-create/
├─ model/
│  ├─ create-voc.schema.ts        (UI-only extension)
│  ├─ create-voc.default-values.ts
│  └─ useCreateVocForm.ts
├─ ui/
│  └─ CreateVocForm.tsx
└─ api/
   └─ voc-create.api.ts
```

---

## §13.5 Form Hook 반환 Shape

```ts
// useCreateVocForm.ts 표준 반환
return {
  form, // UseFormReturn<Schema>
  onSubmit, // (e: FormEvent) => void
  isSubmitting, // boolean
};
```

---

## §13.6 서버 에러 매핑

```ts
// mutation onError 내부
if (err.status === 422 && err.fieldErrors) {
  Object.entries(err.fieldErrors).forEach(([field, message]) => {
    form.setError(field as keyof Schema, { type: 'server', message });
  });
} else {
  toast.error(err.message);
}
```

---

## §13.7 원칙

```
폼 validation    컴포넌트 내부에 직접 흩뿌리지 않는다
schema           별도 파일 분리 (컴포넌트 파일 내 inline 금지)
defaultValues    별도 파일 분리
제출 후 동작     hook에서 관리 (리셋·redirect·toast 포함)
URL filter 폼    URL이 canonical; defaultValues = URL parse 결과
```
