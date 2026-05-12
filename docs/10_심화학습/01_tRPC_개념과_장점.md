# 심화 학습: tRPC (TypeScript Remote Procedure Call)

## 1. tRPC란 무엇인가?
tRPC는 API 스키마(Swagger 등)를 별도로 정의하지 않고도, 서버의 TypeScript 타입을 클라이언트에서 그대로 사용할 수 있게 해주는 도구입니다. "Remote Procedure Call"이라는 이름처럼, 멀리 떨어진 서버의 함수를 마치 내 로컬 함수처럼 호출하는 것이 핵심입니다.

## 2. 왜 PDFrend에 도입했는가?
1. **타입 안전성 (Type Safety)**: 서버에서 API 응답 형식을 바꾸면, 클라이언트 코드에서 즉시 빨간 줄(에러)이 뜹니다. 런타임 에러를 획기적으로 줄여줍니다.
2. **생산성**: API 문서를 따로 만들거나 관리할 필요가 없습니다. 코드가 곧 문서가 됩니다.
3. **자동 완성**: 클라이언트에서 API를 호출할 때, 서버에 정의된 함수명과 파라미터가 IDE에서 자동 완성됩니다.

## 3. 핵심 용어 정리
- **Procedure**: 서버에 정의된 하나의 API 함수 (Query 또는 Mutation)
- **Router**: 여러 Procedure를 묶어주는 그룹
- **Context**: 모든 Procedure가 공통으로 접근할 수 있는 데이터 (예: 현재 로그인한 사용자 정보)

## 4. 학습 팁
- REST API의 `GET`은 tRPC의 `query`와 매칭됩니다.
- REST API의 `POST/PATCH/DELETE`는 tRPC의 `mutation`과 매칭됩니다.
