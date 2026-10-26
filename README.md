# ✅ 시험 대비 To-Do 리스트

시험을 준비하는 학생이 날짜별 학습 계획을 세우고, 중요도와 진행률을 한눈에 관리할 수 있는 웹 앱입니다.

## 소개

다음 기능을 제공합니다.

- 목표 날짜와 중요도를 지정한 할 일 추가
- 완료 checkbox와 취소선 표시
- 전체 / 진행 중 / 완료 필터
- 완료 항목 비율을 반영한 실시간 진행률
- 할 일 수정 및 삭제
- `localStorage`를 이용한 새로고침 후 데이터 복원
- 빈 입력 차단, 긴 문장 줄바꿈, HTML 태그 입력의 문자열 처리

## 어떻게 만들었나요

PRD에서 사용자 흐름, 데이터 구조, 상태, 예외 처리, 완료 기준을 먼저 정의했습니다. 이후 같은 요구사항으로 Bootstrap 버전과 Tailwind 버전을 비교할 수 있도록 구현 방향을 나누고, 최종적으로 Tailwind CDN 버전을 `dev` 브랜치에 반영했습니다.

구현은 HTML5, Tailwind CSS CDN, Pure Vanilla JavaScript로 구성했습니다. Task 객체는 `id`, `text`, `priority`, `dueDate`, `isCompleted`, `createdAt` 필드를 사용하며, 목록이 변경될 때마다 `localStorage`에 저장합니다.

## Bootstrap vs Tailwind

| 비교 항목 | Bootstrap | Tailwind |
| --- | --- | --- |
| 스타일 방식 | 미리 만들어진 컴포넌트와 클래스 조합 | 작은 유틸리티 클래스를 HTML에서 직접 조합 |
| HTML class | `btn`, `form-control`, `row`, `col-*`처럼 컴포넌트 중심 | `rounded-xl`, `bg-pink-50`, `sm:grid-cols-*`처럼 상세 스타일 중심 |
| 반응형 처리 | Bootstrap grid와 responsive utility 사용 | `sm:`, `md:`, `lg:` breakpoint 클래스 사용 |
| 디자인 조정 | 기본 Bootstrap 스타일을 보완해야 함 | 색상, 간격, 상태 스타일을 즉시 조정 가능 |

최종 버전은 Tailwind를 선택했습니다. 핑크색 테마, 카드 상태, 모바일 레이아웃, 필터 버튼 상태를 별도의 대규모 CSS 작성 없이 빠르게 조정할 수 있었고, 화면의 시각적 개성을 더 분명하게 표현할 수 있었습니다.

## 실행 방법

저장소 루트에서 정적 서버를 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 [http://localhost:8000/](http://localhost:8000/)을 엽니다.

GitHub Pages 배포 주소는 저장소 소유자의 GitHub 사용자명에 따라 다음 형식입니다.

`https://<GitHub-사용자명>.github.io/26-w08-todo/`

## 커스터마이징한 부분

- 검은 배경 대신 연한 핑크색 배경과 흰색 카드 중심의 테마 적용
- 진행률 bar와 필터 버튼에 핑크 계열 상태 스타일 적용
- 삭제 버튼 클릭 시 바로 삭제하지 않고 확인 dialog 표시
- 완료 checkbox를 클릭하면 묶인 핑크 리본이 펼쳐지고 꽃가루가 퍼지는 축하 애니메이션 추가
- 긴 할 일 내용에 자동 줄바꿈과 `word-break` 적용
- 사용자 입력은 `textContent`와 DOM API로 렌더링해 `<script>`나 HTML 태그가 실행되지 않도록 처리
- 잘못된 `localStorage` 데이터와 저장 공간 접근 오류에 대한 복구 처리
