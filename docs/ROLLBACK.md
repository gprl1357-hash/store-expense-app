# 긴급 롤백 가이드 (다매장 v1.4.0)

> **운영 URL:** https://store-expense-app.vercel.app  
> **안전한 직전 버전:** `v1.3.1` (`96b12ba`) — 다매장 배포 직전 Production

---

## 배포 전 확보된 복원 지점

| 항목 | 값 |
|------|-----|
| Git tag | `v1.3.1` |
| Commit | `96b12badfc6b3639c4c7a66b89cdbacfb5138493` |
| DB | `006_stores_and_card.sql` 적용됨 (되돌리기 어려움) |
| 롤백 호환 | `007_store_id_default_rollback.sql` — INSERT 기본값 `gwangmyeong-gidc` |

---

## A. 가장 빠른 방법 — Vercel Instant Rollback

1. https://vercel.com/dashboard → `store-expense-app` → **Deployments**
2. 문제 배포 바로 **이전** 배포(또는 `v1.3.1` 시점) 선택
3. **⋯ → Instant Rollback** (또는 Promote to Production)

확인: https://store-expense-app.vercel.app

> DB에 `store_id`가 이미 있으므로, **007 기본값**이 적용돼 있어야 v1.3.1 코드의 지출 등록이 깨지지 않습니다.

---

## B. Git으로 Production 되돌리기

```bash
cd /Users/hyekihong/store-expense-app
git fetch --tags
git checkout main
git reset --hard v1.3.1
./scripts/git-push.sh main   # 또는: git push --force-with-lease origin main
```

⚠️ `main` force push는 팀과 합의 후. 가능하면 **A안(Vercel Rollback)** 을 쓰세요.

태그로 재배포만 할 때:

```bash
git checkout v1.3.1
npx vercel --prod --yes
git checkout main
```

---

## C. DB는 롤백하지 않음 (원칙)

| 하면 안 되는 것 | 이유 |
|----------------|------|
| `stores` / `store_id` 컬럼 삭제 | 기존·신규 데이터 유실·앱 전체 장애 |
| 카테고리 CHECK에서 `카드` 제거 | 이미 `카드`로 저장된 행이 있으면 실패 |

데이터만 되돌릴 때: Slack/Storage 일일 백업 → `npm run backup:restore`

---

## D. 롤백 후 확인 (smoke)

- [ ] 메인 화면 로드
- [ ] 지출 1건 등록 (광명 기준)
- [ ] 내역 조회에 표시
- [ ] Slack 알림 (Webhook 사용 시)

다매장 UI가 사라지는 것이 정상입니다 (v1.3.1).

---

## E. 다시 v1.4.0으로 올리기

```bash
git checkout main
git reset --hard v1.4.0   # 또는 origin/main
./scripts/git-push.sh main
```

---

*작성: 2026-08-07 · v1.4.0 배포 대비*
