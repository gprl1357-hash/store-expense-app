# Changelog

이 프로젝트의 모든 주요 변경은 이 파일에 기록합니다.  
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따릅니다.

**기록 형식:** `## [버전] - YYYY-MM-DD HH:MM:SS` (KST, 24시간)

---

## [Unreleased]

### Added
- (다음 배포 예정 항목)

---

## [1.2.0] - 2026-07-16 14:18:18

### Added
- 운영 관리 체계 문서 (`docs/OPS_MANAGEMENT.md`)
- Slack 백업 구성 제안 (`docs/SLACK_BACKUP_PROPOSAL.md`)
- GitHub Actions CI — `npm run build` 검증 (데이터·배포 변경 없음)
- `main` 브랜치 보호 설정 가이드 (`docs/BRANCH_PROTECTION.md`)
- feature 브랜치 워크플로 (`docs/CONTRIBUTING.md`)

---

## [1.1.1] - 2026-07-16 13:56:31

### Added
- 입력 탭 **날짜 선택** (달력 + 오늘/어제 단축 버튼)
- 어르신 사용 가이드 (`docs/사용가이드.md`)

### Changed
- LAN 개발 접속 (`allowedDevOrigins`, SSH 443 포트)
- Git push 자동화 스크립트 (`setup-git-auth.sh`, `git-push.sh`)

---

## [1.1.0] - 2026-07-16 12:17:34

### Added
- **조회** 탭: 달력, 카테고리 필터, 검색, 차트, 엑셀/인쇄
- **사진 첨부** (Supabase Storage, 조회 탭에서만 확인)
- 휴지통 soft delete 및 **복원** (조회 탭)
- 60대+ UI 개선 (큰 글씨·버튼, 핀치 줌)
- SBOM 및 작업 정리 문서

### Fixed
- 엑셀 저장 `lab()` 색상 오류 (SVG 캡처)

---

## [1.0.0] - 2026-07-15 23:00:24

### Added
- 지출 입력, 월 예산 게이지, Realtime 동기화
- Supabase + Vercel 배포
- PWA manifest

[Unreleased]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.2.0...main
[1.2.0]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/gprl1357-hash/store-expense-app/releases/tag/v1.0.0
