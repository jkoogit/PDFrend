# 인증 테이블: auth_identities

- 테이블ID: `TB_AUTH_IDENTITY`
- 관련 대장: [테이블 관리대장](../00_테이블관리대장.md)

| 컬럼ID | 컬럼명 | 타입 | pk | nullable | 그룹코드 | 용어ID | 도메인 | 설명 |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| C001 | auth_id | bigint | Y | N |  | T0002 | D0002 id_num | 인증 식별자(PK) |
| C002 | provider_cd | varchar(10) |  | N |  | - | D0006 cd_10 | 제공자 코드 |
| C003 | provider_key_val | varchar(500) |  | N |  | - | D0021 val_v500 | 제공자 키값 |
| C004 | channel_cd | varchar(10) |  | N |  | - | D0006 cd_10 | 인증 채널 코드 |
| C005 | hpno | varchar(11) |  | Y |  | - | D0029 hpno_v11 | 휴대폰번호 |
| C006 | verify_yn | boolean |  | N |  | T0005 | D0012 yn | 검증 여부 |
| C007 | verified_dtm | timestamp |  | Y |  | T0005 | D0013 dtm | 검증일시 |
| C008 | reg_system_cd | varchar(10) |  | N |  | T0006 | D0006 cd_10 | 등록시스템 코드 |
| C009 | reg_user_id | varchar(100) |  | N |  | T0007 | D0007 text_100 | 등록자 |
| C010 | reg_dtm | timestamp |  | N |  | T0008 | D0013 dtm | 등록일시 |
| C011 | mod_system_cd | varchar(10) |  | N |  | T0009 | D0006 cd_10 | 수정시스템 코드 |
| C012 | mod_user_id | varchar(100) |  | N |  | T0010 | D0007 text_100 | 수정자 |
| C013 | mod_dtm | timestamp |  | N |  | T0011 | D0013 dtm | 수정일시 |
