# 매장 지출 관리 앱 — 작업 정리

> **프로젝트:** `store-expense-app`  
> **매장:** 제주은희네해장국광명GIDC  
> **작성자:** 홍혜기, 홍성미, 손선애  
> **최종 갱신:** 2026-07-16

---

## 1. 프로젝트 개요

3명이 모바일로 함께 쓰는 **매장 지출 관리 PWA**입니다. 60대 사용자를 포함해 누구나 쉽게 입력·조회할 수 있도록 큰 글씨·큰 버튼 UI를 적용했습니다.

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일 | Tailwind CSS 4 |
| 백엔드 | Supabase (PostgreSQL + Realtime + Storage) |
| 배포 | GitHub → Vercel 자동 배포 |
| 월 예산 | 1,000만 원 (`NEXT_PUBLIC_MONTHLY_BUDGET`) |

---

## 2. 구현된 기능

### 입력 탭
- 오늘 날짜 자동 지출 등록
- 작성자 선택 (홍혜기 / 홍성미 / 손선애)
- 카테고리 카드 (식자재, 공과금, 인건비, 기타)
- 금액 직접 입력 + 단축 버튼 (+1천 ~ +100만)
- 메모 (선택)
- **사진 첨부** (선택, 카메라/갤러리)
- 월 예산 신호등 게이지 (초록/노랑/빨강)
- 등록 후 자동으로 조회 탭 이동

### 조회 탭
- 연 / 월 / 일 달력·기간 탐색
- 작성자·카테고리 필터, 검색
- 카테고리별 합계 (클릭 필터)
- 도넛·막대 그래프 (recharts)
- 지출 목록 → 수정·삭제(휴지통)
- **첨부 사진** 목록 아이콘 + 상세 모달에서 확대 보기
- **엑셀 저장** (지출내역 / 카테고리합계 / 그래프 시트)
- **인쇄** (HTML 팝업)
- **복원** (휴지통, 90일 이내 soft delete)

### 공통
- Supabase Realtime 동기화
- PWA manifest (홈 화면 추가 가능)
- 사용자 필터 (전체 / 개인별)

---

## 3. 데이터베이스

### `expenses` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| date | DATE | 지출일 |
| category | TEXT | 식자재/공과금/인건비/기타 |
| amount | NUMERIC | 금액 (원) |
| memo | TEXT | 메모 |
| created_by | TEXT | 작성자 |
| created_at | TIMESTAMPTZ | 등록 시각 |
| deleted_at | TIMESTAMPTZ | soft delete |
| photo_url | TEXT | 첨부 사진 URL |

### 마이그레이션
| 파일 | 내용 |
|------|------|
| `001_update_users.sql` | 작성자 이름 변경 |
| `002_soft_delete.sql` | `deleted_at` 컬럼 |
| `003_expense_photos.sql` | `photo_url` + Storage 버킷 |

### Storage
- 버킷: `expense-photos` (public, 5MB, jpeg/png/webp/heic)

---

## 4. 주요 파일 구조

```
src/
├── app/
│   ├── page.tsx          # 메인 (탭·CRUD 오케스트레이션)
│   ├── layout.tsx        # 폰트·PWA 메타
│   └── globals.css       # 전역 스타일·시니어 UX
├── components/
│   ├── ExpenseForm.tsx   # 지출 입력 + 사진
│   ├── ExpenseList.tsx   # 목록
│   ├── ExpenseModal.tsx  # 수정·삭제·사진 보기
│   ├── AnalyticsCalendar.tsx
│   ├── BudgetGauge.tsx
│   ├── ExpenseCharts.tsx
│   ├── ExportButtons.tsx
│   ├── TrashModal.tsx
│   └── TabNav.tsx
└── lib/
    ├── constants.ts
    ├── exportExcel.ts    # exceljs 엑셀 내보내기
    ├── chartData.ts
    ├── filterExpenses.ts
    └── supabase/
        ├── client.ts
        ├── expenses.ts
        ├── storage.ts    # 사진 업로드
        └── types.ts
supabase/
├── schema.sql
└── migrations/
docs/
├── WORK_SUMMARY.md       # 이 문서
└── SBOM.json             # 소프트웨어 구성 명세
```

---

## 5. 해결한 이슈

| 이슈 | 해결 |
|------|------|
| 엑셀 저장 `lab()` 색상 오류 | SVG 직접 캡처로 html2canvas 우회, 그래프 실패 시에도 시트 1·2 저장 |
| GitHub PAT workflow 권한 | CI 워크플로 제거, Vercel 빌드로 대체 |
| 복원 버튼 위치 | 입력 탭 제거, 조회 탭만 표시 |

---

## 6. 60대+ UX 개선 (2026-07-16)

| 영역 | 변경 |
|------|------|
| 전역 | 본문 20px, 줄간격 1.6, 포커스 링 강화 |
| 확대 | 핀치 줌 허용 (이전: 확대 차단) |
| 하단 탭 | `지출 입력` / `내역 조회`, 높이 80px, 선택 시 파란 배경 |
| 버튼 | 최소 높이 72px (4.5rem), ring-2 테두리 |
| 예산 게이지 | 금액 4xl, 진행바 두께 증가 |
| 토스트 | 4초 표시, xl 글씨, 넓은 영역 |
| 달력 | 날짜 셀·월 카드 크기 확대 |
| 검색 | placeholder 단순화, 입력 xl |

---

## 7. 배포·운영

```bash
# 로컬 개발
npm run dev

# 릴리스 (커밋 + push)
npm run release -- "변경 설명"
```

### 환경 변수 (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MONTHLY_BUDGET=10000000
```

### Supabase 수동 작업
- `003_expense_photos.sql` 실행 (사진 기능)

---

## 8. 테스트 데이터

| 스크립트 | 내용 |
|----------|------|
| `scripts/seed-jan-may-2026.mjs` | 2026년 1~5월 210건 |
| `scripts/seed-june-2026.mjs` | 2026년 6월 |

---

## 9. 향후 선택 과제

- PWA Service Worker·오프라인 캐시
- Supabase Auth (사용자별 권한)
- 6월 중복 시드 데이터 정리
- `xlsx` 패키지 미사용 시 제거 (exceljs로 통일)
