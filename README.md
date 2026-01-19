# Workout Data

운동 기록 및 추적을 위한 Next.js 웹 애플리케이션

## 기술 스택

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Database**: Supabase
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI**: Framer Motion, Lucide React

## 주요 기능

- 운동 세션 기록 및 관리
- 주간 운동 목표 설정 및 진행도 추적
- 스플릿 설정 및 주간 스케줄 관리
- 운동 히스토리 조회
- 운동 분석 및 통계

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
app/
  ├── components/     # 재사용 가능한 컴포넌트
  ├── stores/         # Zustand 상태 관리
  ├── workout/        # 운동 페이지
  └── profile/        # 프로필 페이지
lib/
  └── supabase.ts     # Supabase 클라이언트 설정
```
