---
교재: 엔터프라이즈 리눅스 핵심 운영 가이드 vol.2
단원:
  - 9. iSCSI 블록 스토리지
filename: 2025-09-04-Linux-Admin-vol2-iSCSI
title: "[250904][Linux Admin] iSCSI 블록 스토리지"
categories:
  - TIL
comments: true
tags:
  - Linux
  - RHEL
  - infrastructure
  - iSCSI
toc: true
toc_sticky: true
---
## iSCSI 블록 스토리지

- iSCSI는 SCSI의 internet 버전.
	- SCSI: 소형 컴퓨터를 위한 주변기기 연결에 쓰이는 인터페이스(Interface) 표준


> 기업에서 왜 **스토리지**를 사용할까?
> 저장해야 할 데이터가 늘어나는 상황을 고려해, 확장성이 보장되어야 함.


- 대용량의 데이터를 안전하게 저장
- 여러 서버에서 동시에 접근
- 필요에 따라 쉽게 용량을 확장
- 장애가 발생해도 데이터를 잃지 않아야 함.

### 스토리지 구성
스토리지는 처음에 시스템의 내장 디스크를 사용했지만, 점차 저장 공간과 물리적 제약에서 벗어나고자 발전했다.

### DAS(Direct Attached Storage): 케이블을 통해 직접 연결
- 장점: 바용 저렴, 구성 간단, 데이터 접근 속도가 빠르다.
- 단점: 직접 케이블을 연결해야 해서 시스템과 인접한 공간에 설치해야 함.
### NAS(Network Attached Storage): 네트워크를 통해 연결
- 특징: 파일 단위 접근
- 장점:
  - 파일 기반 스토리지 -> 파일 공유 최적화
  - 이더넷 사용 -> 구축이 쉬움
- 단점:
  - 병목 현상
  - DB같이 빠른 트랜잭션이 필요한 어플리케이션에는 적합 X
### SAN(Storage Area Network):
- 특징: 
	- 블록 단위 접근
		- 마치 서버를 로컬에 연결한 디스크처럼 다룰 수 있음
		- 즉, 파티셔닝하고 파일시스템을 생성하여 사용
	- 별도의 연결망 이용
- 장점: 별도의 연결망 이용 -> 신뢰성 높고, 처리 속도가 빠름

#### FC-SAN
- 특징: 광섬유 사용
	- 장점: 손실이 적고, 대역폭을 크게 늘릴 수 있음 -> 성능이 너무너무 좋다.
	- 단점: 너무너무너무 비쌈
- 돈 많은 대기업들이 주로 씀

#### IP-SAN
- AoE, FCoE, iSCSI 등의 방식이 있음.
- iSCSI가 제일 널리 쓰임.
- iSCSI
	- 특징: TCP/IP 기반
	- 장점: 장거리 적합, 가격도 저렴, 기존 인프라 및 자원 활용 가능

### 파일 기반 스토리지 vs 블록 기반 스토리지
#### 파일 기반 스토리지
- NAS방식에서 사용
- 계층적 파일 시스템 구조
- 사용자는 파일 단위로 접근
- 파일 스토리지가 더 적합한 경우
	- 많은 사용자가 같은 파일에 접근할 때
	- 문서나 이미지나 비디오 같은 구조화된 데이터를 저장할 때
	- 간편한 설정 및 관리가 중요할 때

#### 블록 기반 스토리지
- DAS, SAN 등에 사용
- 스토리지를 일반적인 디스크장치처럼 인식
- 스토리지를 파티셔닝하고 파일시스템을 생성하여 사용함
- 각 블록의 크기는 512byte에서 4kb까지.
- 블록 스토리지가 더 적합한 경우
	- 높은 I/O 성능이 필요할 때
	- 서버에서 직접 파일 시스템을 관리하고 싶을 때

### iSCSI
- 네트워크를 통해 스토리지를 연결해주는 기술
- 기본 용어
	- 타겟(Target): 서버 역할을 하는 시스템
	- 초기자(Initiator) : 클라이언트 시스템
	- IQN: target과 initiator의 이름
- 타겟 용어
	- TPG(Target Portal Group): ACL, LUN, Portal을 묶어 놓은 설정 집
	- ACL: 접근 제어 리스트. 
	- LUN(Logical Unit Number): initiator에게 제공할 스토리 장치에게 부여된 논리 장치 번호
	- Portal: initator가 연결할 때 사용할 IP주소와 포트 번호

---


#### 실습: iSCSI로 서버와 클라 연결
##### 서버 측
- 필요한 패키지 설치
```
[root@server ~]# yum install -y targetcli
```

- `target` 서비스 실행
```
[root@server ~]# systemctl start target
[root@server ~]# systemctl enable target
Created symlink /etc/systemd/system/multi-user.target.wants/target.service → /usr/lib/systemd/system/target.service.
```

- targetcli 명령어 입력
```
[root@server ~]# targetcli
targetcli shell version 2.1.57
Copyright 2011-2013 by Datera, Inc and others.
For help on commands, type 'help'.
/>
```
- targetcli 전용 명령어를 사용해야 한다.

- `ls` 입력
```
/> ls
o- / ............................................... [...]
  o- backstores .................................... [...]
  | o- block ........................ [Storage Objects: 0]
  | o- fileio ....................... [Storage Objects: 0]
  | o- pscsi ........................ [Storage Objects: 0]
  | o- ramdisk ...................... [Storage Objects: 0]
  o- iscsi .................................. [Targets: 0]
  o- loopback ............................... [Targets: 0]
/>
```
- backstores: 실제 자원이 저장될 공간. 4가지 종류의 저장 객체 지원
	- block: 물리적 장치인 HDD, SSD, DVD 등
	- fileio: 파일 시스템 상의 파일
	- pscsi: 물리적 SCSI 장치
	- ramdisk: 메모리 기반 임시 저장소
- iscsi
- loopback : 우리는 사용하지 않을 것임

- backstore를 생성해보자.
```
/> /backstores/block create name=disk1 dev=/dev/sdb
Created block storage object disk1 using /dev/sdb.
```
- 설정해준 name으로 이 디스크를 사용할 것임

- `ls`로 방금 생성한 backstore를 확인해보자.
```
/> ls
o- / ............................................... [...]
  o- backstores .................................... [...]
  | o- block ........................ [Storage Objects: 1]
  | | o- disk1  [/dev/sdb (20.0GiB) write-thru deactivated]
  | |   o- alua ......................... [ALUA Groups: 1]
  | |     o- default_tg_pt_gp  [ALUA state: Active/optimized]
  | o- fileio ....................... [Storage Objects: 0]
  | o- pscsi ........................ [Storage Objects: 0]
  | o- ramdisk ...................... [Storage Objects: 0]
  o- iscsi .................................. [Targets: 0]
  o- loopback ............................... [Targets: 0]
/>
```
- 이렇게 저장소로 사용할 물리적 장소를 지정해줬다.

- 이제 연결 시스템을 만들어보자.
```
/> /iscsi create wwn=iqn.2025-09.com.example:storage1
Created target iqn.2025-09.com.example:storage1.
Created TPG 1.
Global pref auto_add_default_portal=true
Created default portal listening on all IPs (0.0.0.0), port 3260.
```
- 포탈도 열린 것이 확인 가능하다.

- ls로 확인해보자.
```
/> ls
o- / ............................................... [...]
  o- backstores .................................... [...]
  | o- block ........................ [Storage Objects: 1]
  | | o- disk1  [/dev/sdb (20.0GiB) write-thru deactivated]
  | |   o- alua ......................... [ALUA Groups: 1]
  | |     o- default_tg_pt_gp  [ALUA state: Active/optimized]
  | o- fileio ....................... [Storage Objects: 0]
  | o- pscsi ........................ [Storage Objects: 0]
  | o- ramdisk ...................... [Storage Objects: 0]
  o- iscsi .................................. [Targets: 1]
  | o- iqn.2025-09.com.example:storage1 ........ [TPGs: 1]
  |   o- tpg1 ..................... [no-gen-acls, no-auth]
  |     o- acls ................................ [ACLs: 0]
  |     o- luns ................................ [LUNs: 0]
  |     o- portals .......................... [Portals: 1]
  |       o- 0.0.0.0:3260 ........................... [OK]
  o- loopback ............................... [Targets: 0]
```
- iscsi 란에 생성된 것을 볼 수 있다.
	- Target의 수도 늘었다.
	- `acl`(접근 제어 리스트): 타겟에 의해 제공되는 스토리지에 연결할 수 있는 initiator를 지정하는 항목.


- 이제 acl을 설정해주자. acl에 initiator에서 사용할 IQN을 넣어주자.
- 즉, 그러면 클라에서도 initiator의 IQN을 설정하는 과정이 필요할 것이다.
```
/> /iscsi/iqn.2025-09.com.example:storage1/tpg1/acls create iqn.2025-09.com.example:client1
Created Node ACL for iqn.2025-09.com.example:client1
```
- `Created Node ACL` : Node ACL이 생성되었다고 한다.

- ls로 acl 설정이 들어간 것을 확인해보자.
```
/> ls
o- / ............................................... [...]
  o- backstores .................................... [...]
  | o- block ........................ [Storage Objects: 1]
  | | o- disk1  [/dev/sdb (20.0GiB) write-thru deactivated]
  | |   o- alua ......................... [ALUA Groups: 1]
  | |     o- default_tg_pt_gp  [ALUA state: Active/optimized]
  | o- fileio ....................... [Storage Objects: 0]
  | o- pscsi ........................ [Storage Objects: 0]
  | o- ramdisk ...................... [Storage Objects: 0]
  o- iscsi .................................. [Targets: 1]
  | o- iqn.2025-09.com.example:storage1 ........ [TPGs: 1]
  |   o- tpg1 ..................... [no-gen-acls, no-auth]
  |     o- acls ................................ [ACLs: 1]
  |     | o- iqn.2025-09.com.example:client1  [Mapped LUNs: 0]
  |     o- luns ................................ [LUNs: 0]
  |     o- portals .......................... [Portals: 1]
  |       o- 0.0.0.0:3260 ........................... [OK]
  o- loopback ............................... [Targets: 0]
```
- `o- iqn.2025-09.com.example:client1  [Mapped LUNs: 0]`를 보면 우리가 입력한 IQN이 acl에 등록된 것을 볼 수 있다. 또한 맵핑된 LUNs가 아직 0인 것을 볼 수 있다.

- LUN 생성
```
/> /iscsi/iqn.2025-09.com.example:storage1/tpg1/luns create /backstores/block/disk1
Created LUN 0.
Created LUN 0->0 mapping in node ACL iqn.2025-09.com.example:client1
```
- `Created LUN 0.`: 우리가 만든 backstore(`/backstores/block/disk1`)를 lun으로 연결시켜주자.
- 또한 우리가 기존에 ACL에 등록된 IQN에 자동으로 맵핑이 된 것을 확인할 수 있다.
  - 이는 targetcli의 편의 기능이다.

- ls로 확인해보자.
```
/> ls
o- / ............................................... [...]
  o- backstores .................................... [...]
  | o- block ........................ [Storage Objects: 1]
  | | o- disk1 . [/dev/sdb (20.0GiB) write-thru activated]
  | |   o- alua ......................... [ALUA Groups: 1]
  | |     o- default_tg_pt_gp  [ALUA state: Active/optimized]
  | o- fileio ....................... [Storage Objects: 0]
  | o- pscsi ........................ [Storage Objects: 0]
  | o- ramdisk ...................... [Storage Objects: 0]
  o- iscsi .................................. [Targets: 1]
  | o- iqn.2025-09.com.example:storage1 ........ [TPGs: 1]
  |   o- tpg1 ..................... [no-gen-acls, no-auth]
  |     o- acls ................................ [ACLs: 1]
  |     | o- iqn.2025-09.com.example:client1  [Mapped LUNs: 1]
  |     |   o- mapped_lun0 ....... [lun0 block/disk1 (rw)]
  |     o- luns ................................ [LUNs: 1]
  |     | o- lun0  [block/disk1 (/dev/sdb) (default_tg_pt_gp)]
  |     o- portals .......................... [Portals: 1]
  |       o- 0.0.0.0:3260 ........................... [OK]
  o- loopback ............................... [Targets: 0]
```
- `luns` 항목에 `o- lun0  [block/disk1 (/dev/sdb) (default_tg_pt_gp)]`를 보면 lun이 잘 생성되었다.
- 또한 `acls` 항목 아래에 `o- mapped_lun0 ....... [lun0 block/disk1 (rw)]`를 보면, targetcli의 편의기능으로 Node ACL이 있을 때 LUN 생성 시 매핑이 자동으로 추가된 것 또한 볼 수 있다.

- Portal도 설정해줄 수 있는데, 기본으로 두면 모든 인터페이스로 설정이 유지된다.
- 특정 인터페이스로만 연결하고 싶다면 변경 가능하다.

- 저장하고 targetcli을 나가자.
```
/> saveconfig
Configuration saved to /etc/target/saveconfig.json
```
- `/etc/target/saveconfig.json`에 저장됐단다.
- exit로 그냥 나가도 자동으로 저장된다. 그러나 명시적으로 저장하고 나가는 것을 권장한다.
```/> exit
Global pref auto_save_on_exit=true
Last 10 configs saved in /etc/target/backup/.
Configuration saved to /etc/target/saveconfig.json
```

- 당연히 방화벽을 설정해줘야 한다.
```
[root@server ~]# firewall-cmd --add-port=3260/tcp
success
[root@server ~]# firewall-cmd --add-port=3260/tcp --permanent
success
```

- SELinux의 포트레이블에 열려 있는지도 확인해보자.
```
[root@server ~]# semanage port -l | grep 3260
iscsi_port_t                   tcp      3260
```
- 잘 열려있다.

- 이제 클라로 들어가보자.

---
##### 클라 측
- 클라랑 서버랑  필요한 iSCSI 패키지가 다르다.

- 현재 환경에서는 이미 설치가 되어있었다.
```
[root@client ~]# yum install -y iscsi-initiator-utils
Last metadata expiration check: 0:53:27 ago on Thu 04 Sep 2025 05:38:58 AM UTC.
Package iscsi-initiator-utils-6.2.1.9-1.gita65a472.el9.x86_64 is already installed.
Dependencies resolved.
Nothing to do.
Complete!
[root@client ~]# systemctl status iscsi
○ iscsi.service - Login and scanning of iSCSI devices
     Loaded: loaded (/usr/lib/systemd/system/iscsi.servic>
     Active: inactive (dead)
       Docs: man:iscsiadm(8)
             man:iscsid(8)
```

- iSCSI 설정 파일을 작성하자.
```
# 설정 파일 작성
[root@client ~]# vi /etc/iscsi/initiatorname.iscsi
# 설정 파일 확인
[root@client ~]# cat /etc/iscsi/initiatorname.iscsi
InitiatorName=iqn.2025-09.com.example:client1
```

- iSCSI 서비스 실행하자.
  ~~~bash
  [root@client ~]# systemctl start iscsi
  [root@client ~]# systemctl status iscsi
  ● iscsi.service - Login and scanning of iSCSI devices
      Loaded: loaded (/usr/lib/systemd/system/iscsi.servic>
      Active: active (exited) since Thu 2025-09-04 06:37:0>
        Docs: man:iscsiadm(8)
              man:iscsid(8)
      Process: 4517 ExecStart=/usr/sbin/iscsiadm -m node -->
    Main PID: 4517 (code=exited, status=21)
          CPU: 17ms

  Sep 04 06:37:01 client systemd[1]: Starting Login and sca>
  Sep 04 06:37:01 client iscsiadm[4517]: iscsiadm: No recor>
  Sep 04 06:37:01 client systemd[1]: Finished Login and sca>
  ~~~

- 이제 Discovery 단계를 거치자 (discovery: initiator에서 연결하려는 대상을 검색하기 위한 단계계)
```
[root@client ~]# iscsiadm -m discovery -t st -p 192.168.56.44
192.168.56.44:3260,1 iqn.2025-09.com.example:storage1
```
- `-m` : 동작 모드 설정
	- `discovery` : 너 거기 있니? 확인
- `-t` : 타입
	- `st` : send target의 방식으로 동작하겠다.
- `-p` : 포탈
- `192.168.56.44:3260,1 iqn.2025-09.com.example:storage1`
	- `192.168.56.44:3260,1` : IP주소와 포트 번호. 그리고 TPG 번호이다.

- 이제 Login을 해보자. (Login: discovery에서 발견한 대상으로 연결한 단계)
```
[root@client ~]# iscsiadm -m node -T iqn.2025-09.com.example:storage1 -p 192.168.56.44 -l
Logging in to [iface: default, target: iqn.2025-09.com.example:storage1, portal: 192.168.56.44,3260]
Login to [iface: default, target: iqn.2025-09.com.example:storage1, portal: 192.168.56.44,3260] successful.
```
- 로그인에 성공한 것을 볼 수 있다.
- `-m node` : 연결 시도 모드
- `-T` : Target IQN 지정
- `-l` : 로그인 실행

- 세션 확인
  ~~~bash
  [root@client ~]# iscsiadm -m session -P 3

  # ... (생략)
                  ************************
                  Attached SCSI devices:
                  ************************
                  Host Number: 1  State: running
                  scsi1 Channel 00 Id 0 Lun: 0
                          Attached scsi disk sdb          State: running
  ~~~
- `State: running`으로 활성화가 된 것을 볼 수 있다.
- `-P` 옵션의 숫자를 줄일 수록 간단하게 정보가 표시 된다.

- lsblk로 디스크가 들어온 것을 확인해보자.
```
[root@client ~]# lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   50G  0 disk
├─sda1   8:1    0  600M  0 part /boot/efi
├─sda2   8:2    0    1G  0 part /boot
└─sda3   8:3    0 48.4G  0 part /
sdb      8:16   0   20G  0 disk
```

- 이제 파티셔닝, 파일시스템, 마운트 등을 설정해보자.
- 파티셔닝 설정
  ~~~
  [root@client ~]# fdisk /dev/sdb

  Welcome to fdisk (util-linux 2.37.4).
  Changes will remain in memory only, until you decide to write them.
  Be careful before using the write command.

  Device does not contain a recognized partition table.
  Created a new DOS disklabel with disk identifier 0x5321285d.

  Command (m for help): p
  Disk /dev/sdb: 20 GiB, 21474836480 bytes, 41943040 sectors
  Disk model: disk1
  Units: sectors of 1 * 512 = 512 bytes
  Sector size (logical/physical): 512 bytes / 512 bytes
  I/O size (minimum/optimal): 512 bytes / 512 bytes
  Disklabel type: dos
  Disk identifier: 0x5321285d

  Command (m for help): n
  Partition type
    p   primary (0 primary, 0 extended, 4 free)
    e   extended (container for logical partitions)
  Select (default p):

  Using default response p.
  Partition number (1-4, default 1):
  First sector (2048-41943039, default 2048):
  Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-41943039, default 41943039):

  Created a new partition 1 of type 'Linux' and of size 20 GiB.

  Command (m for help): w
  The partition table has been altered.
  Calling ioctl() to re-read partition table.
  Syncing disks.

  [root@client ~]# lsblk
  NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
  sda      8:0    0   50G  0 disk
  ├─sda1   8:1    0  600M  0 part /boot/efi
  ├─sda2   8:2    0    1G  0 part /boot
  └─sda3   8:3    0 48.4G  0 part /
  sdb      8:16   0   20G  0 disk
  └─sdb1   8:17   0   20G  0 part
  ~~~

- 파일 시스템 설정
```
[root@client ~]# mkfs.xfs /dev/sdb1
meta-data=/dev/sdb1              isize=512    agcount=4, agsize=1310656 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=1, sparse=1, rmapbt=0
         =                       reflink=1    bigtime=1 inobtcount=1 nrext64=0
data     =                       bsize=4096   blocks=5242624, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0, ftype=1
log      =internal log           bsize=4096   blocks=16384, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
```

- 마운트 설정
  ```
  [root@client ~]# mkdir /mnt/iscsi

  [root@client ~]# mount /dev/sdb1 /mnt/iscsi/
  mount: (hint) your fstab has been modified, but systemd still uses
        the old version; use 'systemctl daemon-reload' to reload.
  ```

- 디스크 확인
```
[root@client ~]# df -h /mnt
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda3        49G  1.6G   47G   4% /
[root@client ~]# df -h /mnt/iscsi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1        20G  175M   20G   1% /mnt/iscsi
```

---
## 팁
`clear` -> 삭제
`ctrl` + `l` -> 스크롤을 내림
