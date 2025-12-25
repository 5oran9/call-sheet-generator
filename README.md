# Call Sheet Generator

시나리오(대본) 텍스트를 기반으로 촬영 준비에 필요한 정보를 구조화하여 **Scene List를 생성**하고,
\n향후 **Call Sheet까지 확장**하는 것을 목표로 하는 프로젝트입니다.

현재 버전에서는 **Scene List 생성 및 엑셀 출력**까지 구현되어 있습니다.

---

## 1) Project Goal

### Current
- 시나리오 텍스트 기반 Scene List 생성
- Scene 단위 정보 구조화
- Scene List 엑셀(.xlsx) 출력

### Future
- Scene List → 촬영 일정 자동 배치
- 제약 조건을 반영한 Call Sheet 생성

---

## 2) Features

### Scene List (Implemented)
- 씬 번호
- 장소
- 시간대 (낮 / 밤 / 새벽 / 해질무렵 등)
- 등장 인물
- 씬 요약

### Excel Export
- Scene List 엑셀 출력
- 열 너비 자동 조정
- 헤더 정렬 및 테두리 적용

---

## 3) Tech Stack
- Frontend: Next.js
- Excel Export: xlsx-js-style

---

## 4) Installation & Run

```bash
pnpm install
pnpm dev
```

```text
http://localhost:3000
```

---

## 5) Usage Flow
1. 시나리오 텍스트 입력
2. Scene List 생성
3. 결과 확인
4. 엑셀 파일 다운로드

---

## 6) Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

- Scene 분석 및 확장 기능을 담당하는 백엔드 API 주소
- 로컬 FastAPI 서버 또는 Colab Ngrok URL 사용

---

## 7) Colab / Backend (Experimental)

콜시트 생성 단계에서는 Python 기반 분석 서버를 사용합니다.

### Stack
- Google Colab
- FastAPI
- Ngrok

### Responsibility
- 시나리오 텍스트 파싱
- Scene 단위 구조화 데이터 생성
- Scene List → 촬영 일정 → Call Sheet 변환 로직 (예정)

### Code Management
🔗 Notebook Link : https://colab.research.google.com/drive/1gNO6JiMahHIMBXYs3T0Dt0nreWTu7Ewx?usp=sharing
- Colab 노트북은 실험 및 프로토타입 용도로 사용
- 메인 레포에서는 API 인터페이스 중심으로 관리
- 추후 backend 레포 분리 예정

---

## 8) Roadmap (Call Sheet)
- Scene → 촬영 일정 자동 배치
- 주 52시간 근무 기준 시간 제약 반영
- 점심 / 저녁 시간 고려
- 로케이션 간 이동 시간 반영
- 등장 인원 분배 및 중복 최소화
- 날씨 / 지도 API 연동
- 최종 Call Sheet 엑셀 출력

---

## 9) License
TBD
