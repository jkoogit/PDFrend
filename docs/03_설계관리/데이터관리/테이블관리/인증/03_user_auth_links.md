# 인증 테이블: user_auth_links

- 테이블ID: `TB_AUTH_LINK`
- 관련 대장: [테이블 관리대장](../00_테이블관리대장.md)

| 컬럼ID | 컬럼명 | 타입 | pk | nullable | 그룹코드 | 용어ID | 도메인 | 설명 |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| C001 | link_id | bigint | Y | N |  | T0002 | D0002 id_num | 링크 식별자(PK) |
| C002 | user_id | uuid |  | N |  | T0001 | D0001 uuid | 회원 FK |
| C003 | auth_id | bigint |  | N |  | T0002 | D0002 id_num | 인증수단 FK |
| C004 | primary_yn | boolean |  | N |  | T0004 | D0012 yn | 대표 연락처 여부 |
| C005 | link_status_cd | varchar(10) |  | N | AUTH_STATUS | T0003 | D0006 cd_10 | 링크 상태 코드 |
| C006 | linked_dtm | timestamp |  | N |  | T0003 | D0013 dtm | 연결일시 |
| C007 | unlinked_dtm | timestamp |  | Y |  | T0003 | D0013 dtm | 해제일시 |
| C008 | reg_system_cd | varchar(10) |  | N |  | T0006 | D0006 cd_10 | 등록시스템 코드 |
| C009 | reg_user_id | varchar(100) |  | N |  | T0007 | D0007 text_100 | 등록자 |
| C010 | reg_dtm | timestamp |  | N |  | T0008 | D0013 dtm | 등록일시 |
| C011 | mod_system_cd | varchar(10) |  | N |  | T0009 | D0006 cd_10 | 수정시스템 코드 |
| C012 | mod_user_id | varchar(100) |  | N |  | T0010 | D0007 text_100 | 수정자 |
| C013 | mod_dtm | timestamp |  | N |  | T0011 | D0013 dtm | 수정일시 |
