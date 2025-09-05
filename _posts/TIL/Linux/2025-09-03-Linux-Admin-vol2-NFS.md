---
교재: 엔터프라이즈 리눅스 핵심 운영 가이드 vol.2
단원:
  - 7. NFS 스토리지
filename: 2025-09-03-Linux-Admin-vol2-NFS
title: "[250903][Linux Admin] NFS 스토리지"
categories:
  - TIL
comments: true
tags:
  - Linux
  - RHEL
  - infrastructure
  - NFS
toc: true
toc_sticky: true
---
## 7. NFS 스토리지

### NFS 소개
- NFS(Network File System) : 1984년에 썬 마이크로시스템즈(Sun Microsystems)에서 개발된 분산 파일 시스템 프로토콜이다.

- 서버가 공유할 디렉토리를 nfs를 통해 열어주고, 클라가 원한다면 공유 디렉토리에 접근해서 쓰는 개념. 

- NFS는 주로 내부망에서 쓴다.
- 그 이유
	- 1) 외부망 연결 시 느려진다.
	- 2) 보안 문제

- 인터넷으로 나가면 왜 느린데? 내부망은 왜 빠른데?
	- MTU=1500이 이더넷 표준이다. (인터넷 표준이 패킷을 보낼때 1500바이트로 쪼개 보낸다.)
	- 개인 컴퓨터에서 MTU 사이즈를 조절할 수 있긴 하다. 그러나 이 패킷이 인터넷에 나가는 순간 결국 1500으로 쪼개져서 나가고, 들어올 때도 마찬가지이다.
	- 그러나 내부망에서는 변경한 MTU 사이즈로 보낼 수 있다.
		- 그래서 내부망에서는 MTU크기를 크게 가져갈 수 있어서 빠르다. -> 점보 프레임
		- 그 외에도 간섭이 적고, 물리적으로 연결되어있고 등등으로 더 빠른 이유가 더 있겠다.

### NFSv3의 특징
- 안전한 비동기 쓰기 지원
	- 동기: 파일이 디스크에 완전히 저장될 때까지 기다림.
		- 안전하지만, 느림.
	- 비동기: 메모리에 일단 저장하고, 나중에 디스크에 저장. (버퍼)
		- 빠르지만, 정전 시 위험하다. 전원 꺼지면 다 날라가니까.
- RPC(Remote Procedure Call)에 의존. 따라서 rpcbind 서비스 필요. (RPC 서버들의 포트 관리)
- 방화벽 설정이 불편 (포트가 동적으로 설정되기 때문)

#### 관련 서비스
1. nfs : NFS 서버에 대한 요청 처리
2. nfslock : 파일 잠금 서비스
3. rpcbind : 중계 역할 (RPC 서비스 요청에 응답하고, RPC 서비스로 연결 설정 )
4. rpc.mountd : 마운트 요청 처리. 마운트 시도 시 권한 있는지 확인, 설정 파일 정상인지 확인
 5. 그 외 rpc.nfsd, lockd, rpc.statd, rpc.rquotad

### NFSv4의 특징
1. 포트를 2049로만 열어도 돼서 너무 편리함. (순수 NFSv4만 쓴다면, rpcbind, mountd 필요 없음)
2. 마운팅과 잠금 프로토콜이 통합됨. (별도의 서비스 필요 없음) 
3. pNFS(Parallel NFS) 사용 가능. 병렬로 파일 접근 가능
4. 이전 버전과 하위 호환 동작

#### 관련 서비스
1. rpc.mountd : NFS 서버에서 export를 설정
2. nfs-server : NFS 서버의 파일 시스템을 공유하는 서비스
3. rpc.idmapd : ID와 이름 연결

---
### 실습
#### NFS 서버 구축
```
# 패키지 설치
[root@server ~]# yum install nfs-utils -y

# 폴더 하나 생성
[root@server ~]# mkdir /srv/share
[root@server ~]# ls -ld /srv/share
drwxr-xr-x. 2 root root 6 Sep  3 03:35 /srv/share

# 파일 하나 생성
[root@server ~]# echo "NFS Share Test File" > /srv/share/test.txt
[root@server ~]# cat /srv/share/test.txt
NFS Share Test File

# export 설정
[root@server ~]# vi /etc/exports
[root@server ~]# cat /etc/exports
#어떤 디렉토리를 어떤클라이언트에게(어떤 옵션으로 공유할지)
/srv/share      *(rw,sync,no_root_squash)

# 설정 저장
[root@server ~]# exportfs -r
```
- export 설정에서, `*`를 사용하여 모든 클라이언트를 설정해줬는데, 보통의 경우에서는 직접 IP를 기입해준다. 실습이기에 편의상 `*`를 사용.
- 공유 옵션
	- root_squash: 클라이언트 root가 서버에서 root 권한으로 사용되지 않도록 하는 기능
		- 그냥 직독직해 하자면, 루트 권한을 제한한다는 뜻
	- no_root_squash: root_squash를 끄는 옵션. 즉 클라 root로 서버 root 권한 적용됨.
		- 즉, 루트 권한의 제한을 하지 않는 다는 뜻
- `exportfs -r` 는 NFS 서버가 `/etc/exports`를 읽어서 export설정을 갱신하도록 하는 명령어다.

- 공유 폴더 확인하기
	```
	# 현재 설정된 공유 폴더 확인
	[root@server ~]# exportfs
	/srv/share      <world>

	# -v 옵션으로 더 자세히 보기
	[root@server ~]# exportfs -v
	/srv/share      <world>(sync,wdelay,hide,no_subtree_check,sec=sys,rw,no_root_squash,no_all_squash)
	```
- `<world>`라고 뜨는 것은 우리가 와일드카드로 모두에게 공유하도록 설정했기 때문.
- 일반적인 경우는 공유할 PC의 IP가 뜸

- 설정이 완료되었으니, 실행을 시켜주자
```
[root@server ~]# systemctl start nfs-server
[root@server ~]# systemctl enable nfs-server
Created symlink /etc/systemd/system/multi-user.target.wants/nfs-server.service → /usr/lib/systemd/system/nfs-server.service.
```

- 방화벽 설정도 해주자. (클라에서 서버로 접속 할 수 있어야 하니까 꼭 필요)
```
[root@server ~]# firewall-cmd --add-service=nfs
success
[root@server ~]# firewall-cmd --add-service=nfs --permanent
success
```
- 꼬리 질문) 왜 SELinux 포트레이블 허용하는 과정은 안 거치나요?
	- `semanage port -l`를 통해 SELinux 포트레이블을 확인할 수 있음

- nfs의 포트가 SELinux의 포트레이블에 등록되어 있는지 확인해보자. 
```
[root@server ~]# semanage port -l | grep nfs
nfs_port_t                     tcp      2049, 20048-20049
nfs_port_t                     udp      2049, 20048-20049
```
- NFS 기본 포트들이 이미 `nfs_port_t`로 라벨되어 있어 추가 작업이 필요 없다

- rpc-bind와 mountd를 위한 방화벽 설정을 해주자.
```
[root@server ~]# firewall-cmd --add-service=rpc-bind --permanent
success
[root@server ~]# firewall-cmd --add-service=mountd --permanent
success
[root@server ~]# firewall-cmd --reload
success
[root@server ~]# firewall-cmd --list-services
cockpit dhcpv6-client mountd nfs rpc-bind ssh
```

---
#### 클라에서 연결

- 공유 디렉토리 확인
```
[root@client ~]# showmount -e 192.168.56.44
Export list for 192.168.56.44:
/srv/share *	
```
- nfs 정보를 mountd에게 묻는 명령어.
- `-e` : exports파일에 등록된 디렉토리 목록확인

- 많이들 모르는 사실! mountd와 rpc-bind는 꼭 사용할 필요가 없다.
	- 많은 블로그 글 등에서, 서버에 mountd랑 rpc-bind를 꼭 등록해둬야 하듯이 표현한다.
	- 그런데 왜 등록하는지, 등록해서 뭘 사용하는지를 설명은 안한다.
	- 그러면 nfs 버전4를 사용하는 의미가 없다.
	- v4만 사용할 땐 mountd/rpcbind 없이도 동작하므로, 내부 신뢰망에서 v3가 필요 없으면 닫아두는 편이 안전하다.
	- 그래서 우리는 mountd와 rpc-bind를 사용하지 않을 것이고, 다시 방화벽을 내리고 실습을 진행할 것이다.
```
[root@server ~]# firewall-cmd --remove-service=rpc-bind --permanent
success
[root@server ~]# firewall-cmd --remove-service=mountd --permanent
success
[root@server ~]# firewall-cmd --reload
success
[root@server ~]# firewall-cmd --list-services
cockpit dhcpv6-client nfs ssh
```


- 그러면 서버의 방화벽을 끈 상태로, 클라이언트에서 공유 디렉토리를 조회해보자.
```
[root@client ~]# showmount -e 192.168.56.44
clnt_create: RPC: Unable to receive
```
- 막히는 걸 볼 수 있다.
- mountd에 대한 방화벽을 켜두면, 해커가 들어와서 nfs서버의 IP위치를 알아낼 수도 있다.
	- 그래서 보통 신뢰되는 내부망에서만 사용하거나, 방화벽으로 대상 IP 대역을 제한한다.
	- (우리는 실습의 편위를 위해 그냥 `*`로 지정했을 뿐!)

- 공유 디렉토리를 마운트할 디렉토리를 만들자.
```
[root@client ~]# mkdir /mnt/nfs
[root@client ~]# ls -ld /mnt/nfs
drwxr-xr-x. 2 root root 6 Sep  3 06:08 /mnt/nfs
```

- 마운트를 해보자.
	```
	[root@client ~]# mount -t nfs 192.168.56.44:/srv/share /mnt/nfs

	# 마운트 됐는지 확인
	[root@client ~]# mount | grep mnt
	192.168.56.44:/srv/share on /mnt/nfs type nfs4 (rw,relatime,vers=4.2,rsize=131072,wsize=131072,namlen=255,hard,proto=tcp,timeo=600,retrans=2,sec=sys,clientaddr=192.168.56.33,local_lock=none,addr=192.168.56.44)
	```
- rpc-bind와 mountd를 사용하지 않아도 잘 한다.
	- 이 둘을 사용해 nfs서버가 어디있는지 굳이 알려주지 않아도 괜찮다. 그러는 건 보안상 좋지 않다.

- 마운트가 잘 됐는지 안에 파일을 읽어보자.
```
[root@client ~]# ls -l /mnt/nfs/test.txt
-rw-r--r--. 1 root root 20 Sep  3 03:36 /mnt/nfs/test.txt
[root@client ~]# cat /mnt/nfs/test.txt
NFS Share Test File
```

- 클라에서 공유 디렉토리에 파일을 생성해보자.
```
[root@client ~]# echo "${HOSTNAME} TEST FILE" >> /mnt/nfs/client.txt
[root@client ~]# cat /mnt/nfs/client.txt
client TEST FILE
```

- 서버에서 클라가 만든 파일을 확인해보자.
```
[root@server ~]# ls -l /srv/share/
total 8
-rw-r--r--. 1 root root 17 Sep  3 06:15 client.txt
-rw-r--r--. 1 root root 37 Sep  3 06:15 test.txt
[root@server ~]# cat /srv/share/client.txt
client TEST FILE
```
- 양방향으로 잘 되는 것을 확인할 수 있다.

- 결론
	- 양방향 연결 잘 되는 것을 확인
	- mountd랑 rpc-bind 없이도 잘 동작하는 것을 확인
	- 수동 연결 했으니, 다음 실습으로 자동 마운트를 해보자.

- 마운트 해제 (fstab설정으로 마운트 하는 실습을 위해.)
	```
	[root@client ~]# umount /mnt/nfs

	# 마운트 해제 되었는지 확인. 아무것도 안 출력되면 해제가 잘 된 것
	[root@client ~]# mount | grep mnt
	```

- `fstab`에서 자동 마운트를 위한 설정을 해주자.
```
[root@client ~]# vi /etc/fstab
[root@client ~]# tail -n2 /etc/fstab
# 마운트 할 경로                마운트 포인트   fs유형  마운트 옵션
192.168.56.44:/srv/share        /mnt/nfs        nfs     defaults        0 0
```

- 마운트 설정을 적용시키자.
	```
	# 설정 적용
	[root@client ~]# mount -a
	mount: (hint) your fstab has been modified, but systemd still uses
		the old version; use 'systemctl daemon-reload' to reload.

	# 마운트 잘 됐는지 확인
	[root@client ~]# mount | grep mnt
	192.168.56.44:/srv/share on /mnt/nfs type nfs4 (rw,relatime,vers=4.2,rsize=131072,wsize=131072,namlen=255,hard,proto=tcp,timeo=600,retrans=2,sec=sys,clientaddr=192.168.56.33,local_lock=none,addr=192.168.56.44)
	```
- 이제 부팅 시 자동으로 마운트가 잘 될 것이다.
> 이렇게 fstab을 읽어서 부팅 시 마운트가 되도록 하는 것은 **자동 마운트**라고 오해하면 안된다.
> 자동 마운트(AutoFS)는 필요에 의해 접근하면 마운트가 이루어지고, 일정 시간 이후 해당 마운트가 자동으로 마운트가 해제되도록 하는 방법이다.

- 다시 마운트 해제해두자.
	```
	[root@client ~]# umount /mnt/nfs
	[root@client ~]# vi /etc/fstab
	[root@client ~]# tail -n2 /etc/fstab
	# 마운트 할 경로                마운트 포인트   fs유형  마운트 옵션
	# 192.168.56.44:/srv/share      /mnt/nfs        nfs     defaults        0 0

	# 출력이 안 나오면 마운트 해제 성공
	[root@client ~]# mount | grep mnt
	```

---
#### 클라에서 연결: 자동 마운트

- 자동 마운트를 위해선 맵 파일 설정해야 한다.
- 맵 파일의 종류
	- 마스터 맵 : 마운트 포인트와 맵 파일의 경로 지정
		- `/etc/auto.master`에 기본적으로 존재
	- 직접 맵 : 첫번째 필드에 직접 경로 입력
	- 간접 맵 : 첫번째 필드에 상대 경로 입력

- 자동 연결을 하기 위해선 autofs를 설치해야 한다.
```
[root@client ~]# yum install autofs -y
```

- 그러면 관련 폴더들을 확인할 수 있다.
```
[root@client ~]# ls /etc/auto
autofs.conf            auto.misc
autofs_ldap_auth.conf  auto.net
auto.master            auto.smb
auto.master.d/
```

- 기본적으로 주어지는 마스터 맵 파일 `/etc/auto.master` 를 확인해보자.
```
[root@client ~]# grep -v '^#' /etc/auto.master
/misc   /etc/auto.misc
/net    -hosts
+dir:/etc/auto.master.d
+auto.master
```
- `+` 기호로 시작되는 부분은 마스터 맵으로 동작할 수 있는 파일들을 의미한다.
	- 즉, `/etc/auto.master.d` 디렉토리 내에 있는 파일들을 마스터 맵 파일로 사용할 수 있다.

- 마스터 맵 파일 생성
	```
	[root@client ~]# vi /etc/auto.master.d/nfs.autofs

	# 작성 내용
	[root@client ~]# cat /etc/auto.master.d/nfs.autofs
	/-      /etc/auto.direct
	```
- 마스터 맵 파일 이름(여기서는 `nfs`)는 상관 없고, 확장자를 `.autofs`로 지정해줘야 한다.
- 마스터 맵 파일 작성 내용
	- `/-`는 직접 맵 사용을 한다는 뜻이고
	- `/etc/auto.direct` 이 직접 맵 파일 안에 있는 설정을 사용한다는 뜻이다.
		- 맵 파일의 이름은 `/etc` 디렉토리 아래에, `auto.`라는 접두사가 추가된 이름을 사용한다.
		- 그럼 다음으로 해야 할 일은 이 직접 맵 파일을 작성하는 것이겠다.

- `/etc/auto.direct` 생성
```
[root@client ~]# cat /etc/auto.direct
/mnt/nfs        -rw,sync        192.168.56.44:/srv/share
```
- `/mnt/nfs`: 마운트 포인트
- ``-rw,sync``: 마운트 옵션
	- rw: 읽기/쓰기
	- sync: 동기화 모드
- `192.168.56.44:/srv/share`: 실제 nfs 서버의 IP주소와 공유 디렉토리 경로

- autofs 서비스를 시작하자.
```
[root@client ~]# systemctl status autofs
○ autofs.service - Automounts filesystems on demand
     Loaded: loaded (/usr/lib/systemd/system/autofs.service; disabled; pres>
     Active: inactive (dead)
[root@client ~]# systemctl start autofs
[root@client ~]# systemctl status autofs
● autofs.service - Automounts filesystems on demand
     Loaded: loaded (/usr/lib/systemd/system/autofs.service; disabled; pres>
     Active: active (running) since Wed 2025-09-03 07:07:09 UTC; 2s ago
   Main PID: 34566 (automount)
      Tasks: 7 (limit: 5769)
     Memory: 1.9M
        CPU: 120ms
     CGroup: /system.slice/autofs.service
             └─34566 /usr/sbin/automount --systemd-service --dont-check-dae>
```

- autofs를 돌렸으니, 마운트가 됐는지 확인해보자.
```
[root@client ~]# mount | grep mnt
/etc/auto.direct on /mnt/nfs type autofs (rw,relatime,fd=13,pgrp=34566,timeout=300,minproto=5,maxproto=5,direct,pipe_ino=67261)
```
- `/etc/auto.direct on /mnt/nfs`라는 구절을 보면 `/etc/auto.direct`라는 것이 내가 설정해준 마운트 포인트인 `/mnt/nfs`에 붙어 있는 것을 알 수 있다.
	- 즉, `/mnt/nfs`를 모니터링 하는 중인 거지, 아직 마운트 된 것이 아니다.

- df로 디스크 체크도 해보자.
```
[root@client ~]# df -h | grep mnt
```
- 역시 출력되는 것이 없다.

- 그렇다면 한번 접근을 해보고, 다시 확인을 해보자.
	```
	# 접근
	[root@client ~]# ls -l /mnt/nfs
	total 8
	-rw-r--r--. 1 root root 17 Sep  3 06:15 client.txt
	-rw-r--r--. 1 root root 37 Sep  3 06:15 test.txt

	# mount 확인
	[root@client ~]# mount | grep mnt
	/etc/auto.direct on /mnt/nfs type autofs (rw,relatime,fd=13,pgrp=34566,timeout=300,minproto=5,maxproto=5,direct,pipe_ino=67261)
	192.168.56.44:/srv/share on /mnt/nfs type nfs4 (rw,relatime,sync,vers=4.2,rsize=131072,wsize=131072,namlen=255,hard,proto=tcp,timeo=600,retrans=2,sec=sys,clientaddr=192.168.56.33,local_lock=none,addr=192.168.56.44)

	# disk 확인
	[root@client ~]# df -h | grep mnt
	192.168.56.44:/srv/share   49G  1.6G   47G   4% /mnt/nfs
	```
- `mount`로 확인한 부분을 보면 `192.168.56.44:/srv/share on /mnt/nfs type nfs4 `구절이 추가된 것을 확인할 수 있다.

---
#### 타임 아웃 테스트를 해보자.

- 타임 아웃 값을 10초로 변경해보자.
	```
	[root@client ~]# vi /etc/autofs.conf

	[root@client ~]# cat /etc/autofs.conf | grep "timeout = 10"
	timeout = 10

	# 설정을 변경했으면 꼭 서비스 재시작
	[root@client ~]# systemctl restart autofs
	```

- 테스트 해보자
	```
	# 아직 접근 안 했을 때
	[root@client ~]# mount | grep mnt
	/etc/auto.direct on /mnt/nfs type autofs (rw,relatime,fd=13,pgrp=34642,timeout=10,minproto=5,maxproto=5,direct,pipe_ino=67712)

	# 접근
	[root@client ~]# ls -l /mnt/nfs
	total 8
	-rw-r--r--. 1 root root 17 Sep  3 06:15 client.txt
	-rw-r--r--. 1 root root 37 Sep  3 06:15 test.txt

	# 접근 하고 나서 확인
	[root@client ~]# mount | grep mnt
	/etc/auto.direct on /mnt/nfs type autofs (rw,relatime,fd=13,pgrp=34642,timeout=10,minproto=5,maxproto=5,direct,pipe_ino=67712)
	192.168.56.44:/srv/share on /mnt/nfs type nfs4 (rw,relatime,sync,vers=4.2,rsize=131072,wsize=131072,namlen=255,hard,proto=tcp,timeo=600,retrans=2,sec=sys,clientaddr=192.168.56.33,local_lock=none,addr=192.168.56.44)

	# 10초 지나서 확인
	[root@client ~]# mount | grep mnt
	/etc/auto.direct on /mnt/nfs type autofs (rw,relatime,fd=13,pgrp=34642,timeout=10,minproto=5,maxproto=5,direct,pipe_ino=67712)
	```
- 접근 후 10초 지나니까 마운트가 해제된 것을 확인할 수 있다.
