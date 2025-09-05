---
교재: 엔터프라이즈 리눅스 핵심 운영 가이드 vol.2
단원:
  - 2. SELinux
  - 3. DNS
filename: 2025-09-02-Linux-Admin-vol2-SELinux-DNS
title: "[250902][Linux Admin] SELinux, DNS"
categories:
  - TIL
comments: true
tags:
  - Linux
  - RHEL
  - infrastructure
  - SELinux
  - DNS
  - nmcli
toc: true
toc_sticky: true
---
## SELinux

### SELinux 모드
- Disabled모드 : 완전 비활성화
- Enforcing모드 : SELinux가 활성화 되어있지만, 정책 강제 o
	- 보안 검사대가 켜져 있고, 보안 검사를 강제한다.
- Permissive : SELinux가 활성화 되어있지만, 정책은 강제 x
	- 로그만 남기고, 모든 접근이 허용됨.
	- 즉, 보안 검사대가 켜져 있는데, 보안 검사대가 검사는 하지 않음. 전원만 켜져있음.
	- 문제가 생겼을 때, 어떤 정책 때문인지 로그 확인을 할 때 사용.

> 개발한 앱이 안 돌아갈 때의 트러블 슈팅할 체크리스트 중 하나가, SELinux정책이 강제되어 있는지 확인하는 것임

#### 실습
- 현재 SELinux 모드 확인
  ```
  [vagrant@user01 ~]$ getenforce
  Enforcing # 현재 상태는 활성화된 상태이다.
  ```
 - 현재 상태는 활성화된 상태이다.
 >RHEL은 SELinux가 기본적으로 켜져있다.
 
 - 현재 모드 **임시** 변경 (재부팅 시 다시 이전 설정으로 돌아감.)
    ```
    [vagrant@user01 ~]$ setenforce
    usage:  setenforce [ Enforcing | Permissive | 1 | 0 ]

    [vagrant@user01 ~]$ sudo setenforce 0
    [vagrant@user01 ~]$ getenforce
    Permissive
    ```
- set으로는 disabled 모드로 변경할 수 없다.

- 모드를 영구저장 하는 방법.
  ```
  [vagrant@user01 ~]$ sudo vi /etc/selinux/config
  ```
- /etc/selinux/config에 들어간 설정들은 반드시 재부팅을 해야 적용된다.
	- 왜 재부팅을 해야 할까?
		- SELinux는 리눅스 커널 모듈이므로, 부팅 초기에 정책이 로드되기 때문에, disabled로의 전환이나 설정 파일을 다시 읽히게 하려면 재부팅이 필요하다.
		- 서비스 설정을 변경했을 때 적용하기 위해 데몬을 재시작(`systemctl restart`) 했던 것처럼, SELinux 설정을 적용하기 위해 재부팅 필요.

- 최소 정책: targeted 정책의 변형으로 선택된 프로세스만 보호
### SELinux 컨텍스트
- **`-Z` 옵션**: SELinux 보안 컨텍스트를 표시/활용하라는 옵션

- 컨텍스트를 확인해보자.
  ```
  # 프로세스
  [vagrant@user01 ~]$ ps -Z -C httpd
  LABEL                               PID TTY          TIME CMD
  system_u:system_r:httpd_t:s0       3443 ?        00:00:00 httpd
  system_u:system_r:httpd_t:s0       3444 ?        00:00:00 httpd
  system_u:system_r:httpd_t:s0       3445 ?        00:00:00 httpd
  system_u:system_r:httpd_t:s0       3446 ?        00:00:00 httpd
  system_u:system_r:httpd_t:s0       3447 ?        00:00:00 httpd

  # 파일
  [vagrant@user01 ~]$ ls -Z /etc/passwd
  system_u:object_r:passwd_file_t:s0 /etc/passwd

  # 디렉토리
  [vagrant@user01 ~]$ ls -dZ /var/www/html
  system_u:object_r:httpd_sys_content_t:s0 /var/www/html
  ```

- 컨텍스트는 다음과 같은 형식을 띄고 있다.
  ```
  # 구성
  사용자 : 역할 : 유형 : 라벨

  # 예시 1
  system_u:object_r:httpd_sys_content_t:s0 /var/www/html

  # 예시 2
  unconfined_u:object_r:user_home_dir_t:s0 /home/vagrant
  ```
- 사용자(SELinux User)
	- 여기서의 사용자는, SELinux에서 갖고 있는 사용자 카테고리이다.
		- 절대로, 리눅스 사용자(ex| root, vagrant 등)가 아니다.
	- 아파치 웹 서버가 깔리면서 자동으로 설치됐으므로, 시스템이 설치했다는 의미의 system_u라벨이 붙은 것이다.
	- system_u가 접근 가능하다 등, 이렇게 제한 하는 의미가 아니다. 그냥 분류 라벨일 뿐이다.
- 역할(Role)
	- object_r: 파일이나 디렉토리
		- 모든 객체는 object_r이라는 동일한 역할을 가진다.
- 유형(Type)
	- 이거 보려고 컨텍스트 보는 것이다. 그만큼 중요.
	- httpd_sys_content_t :
		- httpd: Apache 웹 서버
		- sys: 시스템 레벨
		- content: 웹 콘텐츠
		- t: 타입
		- 종합하여, 아파치 웹 서버가 돌리는 시스템 레벨의 웹 콘텐츠이다.
- 보안레벨(level)
	- 일반 서버 환경에서는, 이 MLS 기능을 사용하지 않는다. (복잡도가 너무 커지기 때문에)
	- 그래서 타입 기반으로만 해도 충분하다.
	- 그래서 일반 서버에서는 `s0`만 뜰 것이다.

- 다른 파일의 컨텍스트도 확인해보자.
  ```
  [vagrant@user01 ~]$ sudo touch /var/www/html/fileA
  [vagrant@user01 ~]$ ls -Z /var/www/html/fileA
  unconfined_u:object_r:httpd_sys_content_t:s0 /var/www/html/fileA
  ```

- 사용자
	- `unconfined_u`: 사용자가 만들었어요.
- 타입
	- 상위 폴더의 타입이 상속 되었다.
> SELinux의 중요한 특징: 파일을 새로 만들 때, 상위 디렉토리의 타입을 상속 받는다.

- `/bin/passwd`
  ```
  [vagrant@user01 ~]$ ls -Z /bin/passwd
  system_u:object_r:passwd_exec_t:s0 /bin/passwd
  ```
- 타입
	- `exec`는 실행 파일임을 나타낸다.

- `/bin/passwd`을 `/var/www/html/`로 옮겨보자. (`-a` 옵션과 함께)
  ```
  system_u:object_r:passwd_exec_t:s0 /bin/passwd
  [vagrant@user01 ~]$ sudo cp -a /bin/passwd /var/www/html/fileB
  [vagrant@user01 ~]$ ls -Z /var/www/html/fileB
  system_u:object_r:passwd_exec_t:s0 /var/www/html/fileB
  ```
- cp의 -a는 모든 원본 파일의 속성을 유지한 채 복사한다.
- 따라서 SELinux의 타입(`passwd_exec_t`)이 유지된다.

- `/bin/passwd`을 `/var/www/html/`로 옮겨보자. (`-a` 옵션과 없이)
  ```
  [vagrant@user01 ~]$ sudo cp /bin/passwd /var/www/html/fileC
  [vagrant@user01 ~]$ ls -Z /var/www/html/fileC
  unconfined_u:object_r:httpd_sys_content_t:s0 /var/www/html/fileC
  ```
- `-a` 옵션이 없어서, 디렉토리의 기본 컨텍스트를 따라 타입(`httpd_sys_content_t`)이 설정된다.

---
#### `chcon` 실습
- `chcon`은 파일의 컨텍스트를 임시로 변경한다.

- test 파일을 만들고 타입을 바꾸어 보자.
  ```
  [vagrant@user01 ~]$ echo "test" > test
  [vagrant@user01 ~]$ ls -Z test
  unconfined_u:object_r:user_home_t:s0 test
  [vagrant@user01 ~]$ chcon -t httpd_sys_content_t test
  [vagrant@user01 ~]$ ls -Z test
  unconfined_u:object_r:httpd_sys_content_t:s0 test
  ```

---
- 실습을 위한 간단한 웹페이지 제작
  ```
  [vagrant@user01 ~]$ echo "SELinux Test Page" | sudo tee /var/www/html/index.html
  SELinux Test Page
  [vagrant@user01 ~]$ ls -Z /var/www/html/index.html
  unconfined_u:object_r:httpd_sys_content_t:s0 /var/www/html/index.html
  [vagrant@user01 ~]$ curl localhost
  SELinux Test Page

  # 호스트 PC에서 보기 위해 방화벽 설정
  [vagrant@user01 ~]$ sudo firewall-cmd --add-service=http
  success
  [vagrant@user01 ~]$ sudo firewall-cmd --list-services
  cockpit dhcpv6-client http ssh
  [vagrant@user01 ~]$ sudo firewall-cmd --add-service=http --permanent
  success
  ```

- 새로 파일 만들어보자.
  ```
  [vagrant@user01 ~]$ mkdir /tmp/webtest
  [vagrant@user01 ~]$ echo "Custom test" > /tmp/webtest/custom.html

  [vagrant@user01 ~]$ sudo cp /tmp/webtest/custom.html /var/www/html
  ```

- 컨텍스트 확인해보자.
  ```
  [vagrant@user01 ~]$ ls -Z /tmp/webtest/
  unconfined_u:object_r:user_tmp_t:s0 custom.html

  [vagrant@user01 ~]$ ls -dZ /var/www/html/
  system_u:object_r:httpd_sys_content_t:s0 /var/www/html/

  [vagrant@user01 ~]$ ls -Z /var/www/html/custom.html
  unconfined_u:object_r:httpd_sys_content_t:s0 /var/www/html/custom.html
  ```

- 컨텍스트를 변경해보자.
  ```
  [vagrant@user01 ~]$ sudo chcon -t user_tmp_t /var/www/html/custom.html
  [vagrant@user01 ~]$ ls -Z /var/www/html/custom.html
  unconfined_u:object_r:user_tmp_t:s0 /var/www/html/custom.html
  ```

- 컨텍스트를 바꾼 이 친구로 접속이 가능한지 확인해보자.
![[2025-09-02-1756781350251.png]]
- 권한이 없다며(`Forbidden`) 접속이 안된다.
- `user_tmp_t` 때문에 권한이 없는 것이다.

- 다시 설정을 돌려주자.
  ```
  [vagrant@user01 ~]$ sudo chcon -t httpd_sys_content_t /var/www/html/custom.html
  [vagrant@user01 ~]$ ls -Z /var/www/html/custom.html
  unconfined_u:object_r:httpd_sys_content_t:s0 /var/www/html/custom.html
  ```
- 그러면 페이지가 이제 잘 뜬다.
  ![[2025-09-02-1756782304806.png]]

---
### SELinux 정책 조회 실습

- 유용한 도구를 설치
  ```
  [vagrant@user01 ~]$ sudo yum install setools-console -y
  ```
- seinfo 라는 명령어를 사용할 수 있게 된다.

---
#### SELinux 부울(SELinux Boolean)
SELinux에서 시스템이 운영중일 때 정책의 동작을 변경할 수 있는 스위치 같은 기능

- 부울 조회
  ```
  # 전체 조회
  [vagrant@user01 ~]$ getsebool -a | less

  # 개별 조회
  [vagrant@user01 ~]$ getsebool httpd_can_network_connect
  httpd_can_network_connect --> off

  # grep 사용
  [vagrant@user01 ~]$ getsebool -a | grep httpd
  httpd_anon_write --> off
  httpd_builtin_scripting --> on
  httpd_can_check_spam --> off
  # ...생략
  ```

- 부울 관리
  ```
  [vagrant@user01 ~]$ sudo semanage boolean -l | less
  ```
- 엄청 많은 정책들을 볼 수 있다.

- 부울 활성화
  ```
  [vagrant@user01 ~]$ sudo setsebool httpd_can_network_connect on

  # 확인 방법 1
  [vagrant@user01 ~]$ getsebool httpd_can_network_connect
  httpd_can_network_connect --> on

  # 확인 방법 2
  [vagrant@user01 ~]$ sudo semanage boolean -l | grep httpd_can
  httpd_can_network_connect      (on   ,  off)  Allow HTTPD scripts and modules to connect to the network using TCP.
  ```
- 괄호 안에 앞에 값이 `on`으로 바뀌었다.
	- 괄호 안의 앞의 값은 현재 상태이고, 뒤의 값은 default 상태이다.


- 부울 영구 설정
  ```
  [vagrant@user01 ~]$ sudo setsebool -P httpd_can_network_connect on
  [vagrant@user01 ~]$ sudo semanage boolean -l | grep httpd_can
  httpd_can_network_connect      (on   ,   on)  Allow HTTPD scripts and modules to connect to the network using TCP.
  ```

- 한번에 영구 설정 `sudo semanage boolean -m --on`
  ```
  [vagrant@user01 ~]$ sudo semanage boolean -l | grep use_nfs_home_dirs
  use_nfs_home_dirs              (off  ,  off)  Support NFS home directories

  [vagrant@user01 ~]$ sudo semanage boolean -m --on use_nfs_home_dirs

  [vagrant@user01 ~]$ sudo semanage boolean -l | grep use_nfs_home_dirs
  use_nfs_home_dirs              (on   ,   on)  Support NFS home directories
  ```

---
#### SELinux 포트 레이블

- 포트 레이블 확인
  ```
  sudo semanage port -l | less

  # 다양한 기본 설정들을 볼 수 있다.
  [vagrant@user01 ~]$ sudo semanage port -l | grep http
  http_cache_port_t              tcp      8080, 8118, 8123, 10001-10010
  http_cache_port_t              udp      3130
  http_port_t                    tcp      80, 81, 443, 488, 8008, 8009, 8443, 9000
  ```
- 포트 등록
  ```
  [vagrant@user01 ~]$ sudo semanage port -a -t http_port_t -p tcp 82

  [vagrant@user01 ~]$ sudo semanage port -l | grep http_port_t
  http_port_t                    tcp      82, 80, 81, 443, 488, 8008, 8009, 8443, 9000
  ```
- 82번 포트가 추가된 것을 확인할 수 있다.

---
### 트러블 슈팅 중, 어느 문제인지 도저히 모를 때, SELinux가 문제인 경우가 많다.
- 이 경우, `setenforce 0`로 SELinux를 잠시 내리고(permissive모드로 변경하고), 테스트 이후 다시 `setenforce 1`로 켜보자.
- `sudo grep denied /var/log/audit/audit.log` 여기서 SELinux에 의해 거부된 로그를 확인하면 된다.

---
### ausearch 명령어
- audit daemon logs를 확인하는 쿼리 툴

  ```
  sudo ausearch -m avc --start recent

  # 로그를 읽기 편하게 분석해준다.
  sudo sealert -a /var/log/audit/audit.log
  ```
- sealert <- RHEL에 기본적으로 설치가 안되어 있다.
	- 설치 패키지 이름은 setroubleshoot-server

---
## DNS

면접 단골 질문
주소창에 google.com 치면 일어나는 일

#### DNS 정보 확인 실습
- 실습 준비 (왜 하지?)
  ```
  [vagrant@user01 ~]$ echo "nameserver 10.0.2.3" | sudo tee -a /etc/resolv.conf
  nameserver 10.0.2.3
  [vagrant@user01 ~]$ cat /etc/resolv.conf
  nameserver 10.0.2.3
  ```

#### 왜 10.0.2.3으로 설정하나?
> 10.0.2.3은 가상머신/에뮬레이터 환경에서 제공하는 “DNS 프록시” IP이다.
> 이 대역(10.0.2.0/24)은 에뮬레이터가 내부적으로 쓰는 사설망이고, 그중 **10.0.2.3을 “가상 라우터의 DNS”로 예약**해 둔다.
> 게스트(에뮬레이터 안의 OS)가 DNS를 10.0.2.3으로 질의하면, 가상 라우터가 **호스트 머신에 설정된 실제 DNS**(회사 DNS, ISP DNS, VPN DNS 등)로 대신 물어봐서 결과를 돌려준다.

#### DNS 도구 목록
- host
- nslookup
- dig

#### `host` 실습
- host: 기본적인 정보 표시, 빠른 확인에 적합
- host는 시스템의 dns서버를 자동으로 사용
	- 시스템의 dns서버는 `/etc/resolv.conf`에 저장되어 있음.

- 구글 조회
  ```
  [vagrant@user01 ~]$ host google.com
  google.com has address 142.250.199.110
  google.com has IPv6 address 2404:6800:4004:828::200e
  google.com mail is handled by 10 smtp.google.com.
  ```

- 네이버 조회
  ```
  [vagrant@user01 ~]$ host naver.com
  naver.com has address 223.130.192.247
  naver.com has address 223.130.200.236
  naver.com has address 223.130.200.219
  naver.com has address 223.130.192.248
  naver.com mail is handled by 10 mx1.naver.com.
  naver.com mail is handled by 10 mx3.naver.com.
  naver.com mail is handled by 10 mx2.naver.com.
  naver.com mail is handled by 20 mx4.mail.naver.com.
  naver.com mail is handled by 20 mx5.mail.naver.com.
  naver.com mail is handled by 20 mx6.mail.naver.com.
  ```
- 구글 조회와 다르게 여러 ip가 나온다.
	- 라우팅과 캐시 상태에 따라 다르게 나올 수 있다.

- 특정 레코드 타입도 가능하다.
  ```
  [vagrant@user01 ~]$ host -t NS google.com
  google.com name server ns4.google.com.
  google.com name server ns2.google.com.
  google.com name server ns1.google.com.
  google.com name server ns3.google.com.
  ```

- IP를 통해서 도메인을 찾는 역방향 조회도 가능하다.
  ```
  [vagrant@user01 ~]$ host 8.8.8.8
  8.8.8.8.in-addr.arpa domain name pointer dns.google.
  ```

- 모두 조회
  ```
  [vagrant@user01 ~]$ host 8.8.8.8
  8.8.8.8.in-addr.arpa domain name pointer dns.google.
  [vagrant@user01 ~]$ host -a google.com
  Trying "google.com"
  Trying "google.com"
  ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 25600
  ;; flags: qr rd ra; QUERY: 1, ANSWER: 9, AUTHORITY: 0, ADDITIONAL: 0

  ;; QUESTION SECTION:
  ;google.com.                    IN      ANY

  ;; ANSWER SECTION:
  google.com.             221     IN      MX      10 smtp.google.com.
  google.com.             50      IN      SOA     ns1.google.com. dns-admin.google.com. 801739453 900 900 1800 60
  google.com.             35      IN      AAAA    2404:6800:4005:814::200e
  google.com.             253     IN      A       142.250.198.110
  google.com.             7876    IN      HTTPS   1 . alpn="h2,h3"
  google.com.             73576   IN      NS      ns4.google.com.
  google.com.             73576   IN      NS      ns2.google.com.
  google.com.             73576   IN      NS      ns3.google.com.
  google.com.             73576   IN      NS      ns1.google.com.

  Received 236 bytes from 203.248.252.2#53 in 14 ms
  ```
- 보통 길게 조회할 때는 다른 명령어를 사용한다.

#### `nslookup` 실습
- 윈도우에서도 사용이 가능하다.
  ```
  [vagrant@user01 ~]$ nslookup google.com
  Server:         10.0.2.3
  Address:        10.0.2.3#53

  Non-authoritative answer:
  Name:   google.com
  Address: 142.251.42.142
  Name:   google.com
  Address: 2404:6800:4004:80f::200e
  ```
- Non-authoritative answer
	- 구글 메인 서버에 물어본 것이 아니라, 어딘가에서 캐시가 된 정보를 가져왔다는 것임.
		- 중간에 ISP/DNS 서버 등에서 가져왔다는 거임. 그래서 권위가 없는 답변이라고 하는 것.

- 다른 DNS서버에 요청도 가능.
  ```
  # Google DNS
  [vagrant@user01 ~]$ nslookup google.com 8.8.8.8
  Server:         8.8.8.8
  Address:        8.8.8.8#53

  Non-authoritative answer:
  Name:   google.com
  Address: 142.250.76.142
  Name:   google.com
  Address: 2404:6800:400a:80e::200e

  # Cloudflare DNS
  [vagrant@user01 ~]$ nslookup google.com 1.1.1.1
  Server:         1.1.1.1
  Address:        1.1.1.1#53

  Non-authoritative answer:
  Name:   google.com
  Address: 142.250.206.206
  Name:   google.com
  Address: 2404:6800:400a:805::200e
  ```

- 타입 지정해서 검색
  ```
  [vagrant@user01 ~]$ nslookup -type=NS google.com
  Server:         10.0.2.3
  Address:        10.0.2.3#53

  Non-authoritative answer:
  google.com      nameserver = ns2.google.com.
  google.com      nameserver = ns3.google.com.
  google.com      nameserver = ns4.google.com.
  google.com      nameserver = ns1.google.com.

  Authoritative answers can be found from:
  ns1.google.com  internet address = 216.239.32.10
  ns2.google.com  internet address = 216.239.34.10
  ns3.google.com  internet address = 216.239.36.10
  ns4.google.com  internet address = 216.239.38.10
  ns1.google.com  has AAAA address 2001:4860:4802:32::a
  ns2.google.com  has AAAA address 2001:4860:4802:34::a
  ns3.google.com  has AAAA address 2001:4860:4802:36::a
  ns4.google.com  has AAAA address 2001:4860:4802:38::a
  ```

#### `dig` 실습
- 상세하게 출력

- 기본 조회
  ```
  [vagrant@user01 ~]$ dig google.com

  ; <<>> DiG 9.16.23-RH <<>> google.com
  ;; global options: +cmd
  ;; Got answer:
  ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 16581
  ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

  ;; OPT PSEUDOSECTION:
  ; EDNS: version: 0, flags:; udp: 1232
  ; COOKIE: aa168dbd3bbfc7ce0100000068b6906792f78c1f36171e74 (good)
  ;; QUESTION SECTION:
  ;google.com.                    IN      A

  ;; ANSWER SECTION:
  google.com.             151     IN      A       142.251.42.142

  ;; Query time: 19 msec
  ;; SERVER: 10.0.2.3#53(10.0.2.3)
  ;; WHEN: Tue Sep 02 06:36:23 UTC 2025
  ;; MSG SIZE  rcvd: 83
  ```
- `;; QUESTION SECTION:` : 물어본 것
	- `;google.com.                    IN      A`
		- google.com의 A 레코드를 질의함.
- `;; ANSWER SECTION:` : 대답한 것
	- `google.com.             151     IN      A       142.251.42.142`
		- TTL이 151이다. (약 2분30초)
		- 이 시간 내에 다시 요청하면, 내 캐시를 사용하여 응답한다.
- `;; Query time: 19 msec` : 응답시간
- `;; SERVER: 10.0.2.3#53(10.0.2.3)` : DNS 서버

---
  
### DNS 서버 구성 
- 리눅스에서 가장 많이 사용되는 DNS 소프트웨어는 BIND이다

#### BIND 서버 구성 실습
- BIND 설치
  ```
  [vagrant@user01 ~]$ sudo yum install bind
  ```

- 설정 파일을 백업을 하나 만들어두고, 살펴보자.
  ```
  [vagrant@user01 ~]$ sudo cp /etc/named.conf /etc/named.conf.bak
  [vagrant@user01 ~]$ sudo vi /etc/named.conf
  ```

- 설정 변경 
  ```
  options {
          listen-on port 53 { any; }; # any로 변경
          listen-on-v6 port 53 { none; }; # none으로 변경
          directory       "/var/named";
          dump-file       "/var/named/data/cache_dump.db";
          statistics-file "/var/named/data/named_stats.txt";
          memstatistics-file "/var/named/data/named_mem_stats.txt";
          secroots-file   "/var/named/data/named.secroots";
          recursing-file  "/var/named/data/named.recursing";
          allow-query     { any; }; # any로 변경
  ```
- 모든 네트워크의 dns요청을 허용
- 모든 클라의 dns 쿼리 허용

- dns 서비스 시작
  ```
  [vagrant@user01 ~]$ sudo systemctl start named.service

  # 실행중인지 확인
  [vagrant@user01 ~]$ sudo systemctl status named.service
  ● named.service - Berkeley Internet Name Domain (DNS)
      Loaded: loaded (/usr/lib/systemd/system/named.service; disabled; preset: disabled)
      Active: active (running) since Tue 2025-09-02 07:16:55 UTC; 2min 9s ago
      Process: 5453 ExecStartPre=/bin/bash -c if [ ! "$DISABLE_ZONE_CHECKING" == "yes" ]; then /usr/sbin/named-checkconf >
      Process: 5455 ExecStart=/usr/sbin/named -u named -c ${NAMEDCONF} $OPTIONS (code=exited, status=0/SUCCESS)
    Main PID: 5456 (named)
        Tasks: 10 (limit: 12211)
      Memory: 22.9M
          CPU: 488ms
      CGroup: /system.slice/named.service
              └─5456 /usr/sbin/named -u named -c /etc/named.conf
  ```

- 방화벽 설정 (dns 열어주기 위해)
  ```
  [vagrant@user01 ~]$ sudo firewall-cmd --add-service=dns --permanent
  success
  [vagrant@user01 ~]$ sudo firewall-cmd --add-service=dns
  success
  [vagrant@user01 ~]$ sudo firewall-cmd --list-services
  cockpit dhcpv6-client dns http ssh
  ```

- `dig google.com` 우리 DNS 서버로 조회 한번 해보자. (실수함)
  ```
  [vagrant@user01 ~]$ dig google.com 192.168.56.11

  ; <<>> DiG 9.16.23-RH <<>> google.com 192.168.56.11
  ;; global options: +cmd
  ;; Got answer:
  ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 55705
  ;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

  ;; OPT PSEUDOSECTION:
  ; EDNS: version: 0, flags:; udp: 1232
  ; COOKIE: 71a46ce119dde54b0100000068b698af7befe911c9bac3dc (good)
  ;; QUESTION SECTION:
  ;google.com.                    IN      A

  ;; ANSWER SECTION:
  google.com.             138     IN      A       142.250.198.14

  ;; Query time: 49 msec
  ;; SERVER: 10.0.2.3#53(10.0.2.3)
  ;; WHEN: Tue Sep 02 07:11:44 UTC 2025
  ;; MSG SIZE  rcvd: 83

  ;; Got answer:
  ;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 63392
  ;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

  ;; OPT PSEUDOSECTION:
  ; EDNS: version: 0, flags:; udp: 1232
  ; COOKIE: 71a46ce119dde54b0100000068b698af8b052b6d8ccdd694 (good)
  ;; QUESTION SECTION:
  ;192.168.56.11.                 IN      A

  ;; AUTHORITY SECTION:
  .                       10797   IN      SOA     a.root-servers.net. nstld.verisign-grs.com. 2025090200 1800 900 604800 86400

  ;; Query time: 17 msec
  ;; SERVER: 10.0.2.3#53(10.0.2.3)
  ;; WHEN: Tue Sep 02 07:11:44 UTC 2025
  ;; MSG SIZE  rcvd: 145
  ```
- `status: NXDOMAIN` : non-existent domain으로, 해당 도메인이 없다는 뜻.
- `dig -h`로 사용법을 조회해보니, local서버 주소앞에는 @를 붙여야 함.
	- 즉, 올바른 방법은 `dig google.com @192.168.56.11`

- 올바른 방법으로 다시 조회회
  ```
  [vagrant@user01 ~]$ dig google.com @192.168.56.11

  ; <<>> DiG 9.16.23-RH <<>> google.com @192.168.56.11
  ;; global options: +cmd
  ;; Got answer:
  ;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 60746
  ;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 1

  ;; OPT PSEUDOSECTION:
  ; EDNS: version: 0, flags:; udp: 1232
  ; COOKIE: 5ca0f51679c32b420100000068b69a45228881c1b2bed4dc (good)
  ;; QUESTION SECTION:
  ;google.com.                    IN      A

  ;; Query time: 21 msec
  ;; SERVER: 192.168.56.11#53(192.168.56.11)
  ;; WHEN: Tue Sep 02 07:18:29 UTC 2025
  ;; MSG SIZE  rcvd: 67
  ```
- 우리가 생성한 DNS서버에서 조회를 시도하는 것을 확인할 수 있다.

---
#### 영역(Zone) 구성

- zone 파일 작성(`dns.example.zone`)
- 정방향 조회 영역 설정 파일 생성
  ```
  [vagrant@user01 ~]$ sudo vi /var/named/data/dns.example.zone
  ```
  ```
  $TTL 86400
  @ IN SOA ns.dns.example. admin.dns.example. (
                  2024040801 ; Serial
                  3600       ; Refresh (1시간)
                  1800       ; Retry (30분)
                  604800     ; Expire (1주일)
                  86400 )    ; Minimum TTL (1일)

  ; 네임서버 설정
  @       IN NS   ns.dns.example.

  ; 기본 도메인 주소
  @       IN A    192.168.56.11

  ; 호스트 설정 - 실습을 위해 모두 우리 서버의 IP로 설정
  ns      IN A    192.168.56.11  ; 네임서버
  www     IN A    192.168.56.11  ; 웹 서버
  db      IN A    192.168.56.11  ; 데이터베이스 서버
  mail    IN A    192.168.56.11  ; 메일 서버

  ; 메일 서버 설정
  @       IN MX 10 mail.dns.example.

  ; 별칭 설정
  webmail IN CNAME mail
  ```

- 역방향 조회 영역 설정 파일 생성
  ```
  [vagrant@user01 ~]$ sudo vi /var/named/data/db.192.168.56
  ```
  ```
  $TTL 86400
  @ IN SOA ns.dns.example. admin.dns.example. (
                  2024040801 ; Serial
                  3600       ; Refresh
                  1800       ; Retry
                  604800     ; Expire
                  86400 )    ; Minimum TTL

  ; 네임서버 설정
  @       IN NS   ns.dns.example.

  ; 역방향 조회 설정 - 우리 서버의 IP만 설정
  11      IN PTR  ns.dns.example.    ; 192.168.56.11
  ```

- `/etc/named.conf` 설정 파일에 방금 추가한 zone 파일들 추가
  ```
  [vagrant@user01 ~]$ sudo vi /etc/named.conf
  ```
  ```
  // 정방향 조회 영역
  zone "dns.example" IN {
      type master;
      file "data/dns.example.zone";
  };

  // 역방향 조회 영역
  zone "56.168.192.in-addr.arpa" IN {
      type master;
      file "data/db.192.168.56";
  };
  ```
- 역방향 조회는 사용 대역이 일치해야 한다??

- named.service가 영역 파일을 읽을 수 있도록 권한이 필요하다.
  ```
  [vagrant@user01 ~]$ sudo chown root:named /var/named/data/dns.example.zone
  [vagrant@user01 ~]$ sudo chown root:named /var/named/data/db.192.168.56

  [vagrant@user01 ~]$ sudo chmod 640 /var/named/data/dns.example.zone
  [vagrant@user01 ~]$ sudo chmod 640 /var/named/data/db.192.168.56
  ```
- 루트만 파일을 수정할 수 있고, named.service는 파일을 읽을 수 만 있게 해줬다.

- 설정 파일의 문법 오류 확인.
  ```
  [vagrant@user01 ~]$ sudo named-checkconf /etc/named.conf
  ```
- 아무런 출력이 없으면, 설정 파일에 문법 오류가 없는 것임.

- 영역 검사하는 명령어
  ```
  [vagrant@user01 ~]$ sudo named-checkzone dns.example /var/named/data/dns.example.zone
  zone dns.example/IN: loaded serial 2024040801
  OK

  [vagrant@user01 ~]$ sudo named-checkzone 56.168.192.in-addr.arpa /var/named/data/db.192.168.56
  zone 56.168.192.in-addr.arpa/IN: loaded serial 2024040801
  OK
  ```
- 영역 검사할 dns의 이름을 dns.example로 입력해주었다.
- 물론 역방향도 가능.

- 영역 설정을 다 했으면, `named.service` 재시작
  ```
  [vagrant@user01 ~]$ sudo systemctl restart named.service
  ```

- 설정했던 영역을 dig로 조회
  ```
  [vagrant@user01 ~]$ dig dns.example @localhost

  ; <<>> DiG 9.16.23-RH <<>> dns.example @localhost
  ;; global options: +cmd
  ;; Got answer:
  ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 30845
  ;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

  ;; OPT PSEUDOSECTION:
  ; EDNS: version: 0, flags:; udp: 1232
  ; COOKIE: a9fd474b6c3d30cd0100000068b6a05009f7078a9721a805 (good)
  ;; QUESTION SECTION:
  ;dns.example.                   IN      A

  ;; ANSWER SECTION:
  dns.example.            86400   IN      A       192.168.56.11

  ;; Query time: 0 msec
  ;; SERVER: 127.0.0.1#53(127.0.0.1)
  ;; WHEN: Tue Sep 02 07:44:16 UTC 2025
  ;; MSG SIZE  rcvd: 84
  ```
- `flags: qr aa rd ra`의 `aa`(authoritative answer)가 권위가 있는 응답이라는 뜻
- 이거 보여주고 싶어서 앞의 것을 난리 친 거였다!!
- `;; ANSWER SECTION: dns.example.            86400   IN      A       192.168.56.11
	- A 레코드로 응답 잘 왔다.
	- TIL도 설정한 86400와 같게 잘 됐다.
> ==DNS서버를 이렇게 직접 구축하면서, 권위가 있는 DNS 서버가 됐다는 것이 중요!!==

- host로 해도 잘 나온다.
  ```
  [vagrant@user01 ~]$ host dns.example localhost
  Using domain server:
  Name: localhost
  Address: 127.0.0.1#53
  Aliases:
  ```
