# 인증 테이블: users

- 테이블ID: `TB_AUTH_USER`
- 관련 대장: [테이블 관리대장](../00_테이블관리대장.md)

| 컬럼ID | 컬럼명 | 타입 | pk | nullable | 그룹코드 | 용어ID | 도메인 | 설명 |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| C001 | user_id | uuid | Y | N |  | T0001 | D0001 uuid | 회원 식별자(PK) |
| C002 | email_addr | varchar(500) |  | Y |  | T0001 | D0010 text_500 | 이메일(UNIQUE) |
| C003 | user_nm | varchar(100) |  | Y |  | - | D0007 text_100 | 표시명 |
| C004 | status_cd | varchar(10) |  | N | USER_STATUS | T0003 | D0006 cd_10 | 회원 상태 코드 |
| C005 | reg_system_cd | varchar(10) |  | N |  | T0006 | D0006 cd_10 | 등록시스템 코드 |
| C006 | reg_user_id | varchar(100) |  | N |  | T0007 | D0007 text_100 | 등록자 |
| C007 | reg_dtm | timestamp |  | N |  | T0008 | D0013 dtm | 등록일시 |
| C008 | mod_system_cd | varchar(10) |  | N |  | T0009 | D0006 cd_10 | 수정시스템 코드 |
| C009 | mod_user_id | varchar(100) |  | N |  | T0010 | D0007 text_100 | 수정자 |
| C010 | mod_dtm | timestamp |  | N |  | T0011 | D0013 dtm | 수정일시 |
