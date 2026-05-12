# 06. 로컬 개발 환경 설정 - VS Code

## 1. 개요
본 문서는 **Visual Studio Code (VS Code)**를 사용하여 PDFrend 프로젝트를 개발하기 위한 최적의 설정 가이드를 제공합니다.

## 2. 추천 확장 도구 (Extensions)
- **ESLint**: 코드 스타일 및 오류 체크
- **Prettier**: 코드 포맷터
- **TypeScript Nightly**: 최신 TypeScript 지원
- **Error Lens**: 코드 오류를 인라인으로 표시
- **GitLens**: Git 이력 관리 및 시각화
- **Thunder Client** (또는 Postman): API 테스트 도구

## 3. 프로젝트 설정 (`.vscode/settings.json`)
프로젝트 루트에 `.vscode/settings.json` 파일을 생성하고 다음 설정을 추가하는 것을 권장합니다.

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 4. 실행 및 디버깅 (`.vscode/launch.json`)
`F5` 키를 눌러 바로 디버깅을 시작할 수 있도록 설정합니다.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 5. 터미널 활용
- `Ctrl + \`` (백틱)을 눌러 통합 터미널을 열고 `npm run dev`를 실행합니다.
