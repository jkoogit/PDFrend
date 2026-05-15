# 인증 테이블: auth_events

- 테이블ID: `TB_AUTH_EVENT`
- 관련 대장: [테이블 관리대장](../00_테이블관리대장.md)

| 컬럼ID | 컬럼명 | 타입 | pk | nullable | 그룹코드 | 용어ID | 도메인 | 설명 |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| C001 | event_id | bigint | Y | N |  | T0012 | D0002 id_num | 이벤트 식별자(PK) |
| C002 | user_id | uuid |  | Y |  | T0001 | D0001 uuid | 회원 FK |
| C003 | auth_id | bigint |  | Y |  | T0002 | D0002 id_num | 인증수단 FK |
| C004 | event_type_cd | varchar(10) |  | N | AUTH_EVENT_TYPE | T0012 | D0006 cd_10 | 이벤트 유형 |
| C005 | event_result_cd | varchar(10) |  | N | AUTH_EVENT_RESULT | T0012 | D0006 cd_10 | 결과(success/fail) |
| C006 | event_reason_cd | varchar(10) |  | Y |  | T0013 | D0006 cd_10 | 사유 코드 |
| C007 | event_meta_cntn | jsonb |  | Y |  | T0012 | D0014 json | 부가 메타정보 |
| C008 | reg_system_cd | varchar(10) |  | N |  | T0006 | D0006 cd_10 | 등록시스템 코드 |
| C009 | reg_user_id | varchar(100) |  | N |  | T0007 | D0007 text_100 | 등록자 |
| C010 | reg_dtm | timestamp |  | N |  | T0008 | D0013 dtm | 등록일시 |
| C011 | mod_system_cd | varchar(10) |  | N |  | T0009 | D0006 cd_10 | 수정시스템 코드 |
| C012 | mod_user_id | varchar(100) |  | N |  | T0010 | D0007 text_100 | 수정자 |
| C013 | mod_dtm | timestamp |  | N |  | T0011 | D0013 dtm | 수정일시 |
