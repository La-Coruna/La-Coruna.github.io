---
title: "포트포워딩 없이 외부 인터넷으로 SSH 접속하기"
categories:
  - IT Tips
comments: true
tags:
  - ssh
  - infrastructure
  - cloudflare
  - cloudflared
toc: true
toc_sticky: true
---
## 요구 사항
1. 집 PC에서 사무실 PC의 VM에 접속하고 싶음

## 현재 상황
1. 사무실의 노트북은 무선 와이파이로 연결됨.
2. 사무실의 공유기 포트포워딩 설정 불가.
3. 크롬 원격 접속은 GUI 기반이라 CLI 기반을 원했음.

## 해결 아이디어
1. 포트포워딩 설정 불가 → cloudflared 사용.
	- [cloudflared 설치 링크](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
	- 양쪽 PC에 설치해야 함.
	- 사무실 노트북에서 Tunnel을 열고, 집 PC에서는 cloudflared 클라이언트로 접속해야 함.
2. VM에 cloudflared를 설치하기 애매해서 사무실 노트북에 설치하고, `집 PC → Cloudflare → 노트북 → VM`으로 연결함.  


## 해결 방법

#### 🏠 집 PC 설정

##### 1. 집 PC에서 키 생성
```powershell
ssh-keygen -t ed25519 -C "home-pc"
```
`~/.ssh/id_ed25519.pub`의 공개키가 생성됨.

#### 🖥️ 사무실 PC 설정

##### 1. OpenSSH 서버 설치 및 실행

```powershell
# 설치 여부 확인
Get-WindowsCapability -Online | ? Name -like 'OpenSSH.Server*'

# 설치 (필요한 경우만)
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# 서비스 시작 & 자동시작
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic

# 로컬 SSH 접속 테스트
ssh <윈도우계정명>@localhost # 접속이 되어야 함.
```

##### 2. OpenSSH 키 주입 및 권한 설정
```powershell
# ProgramData 경로
$PD = "$env:ProgramData\ssh"

# 관리자 계정으로 키를 주입
New-Item -ItemType File "$PD\administrators_authorized_keys" -Force | Out-Null
notepad "$PD\administrators_authorized_keys"   # 집PC에서 생성한 공개키 붙여넣기

# 권한 정리(관리자 전용 파일은 SYSTEM과 Administrators만)
icacls "$PD\administrators_authorized_keys" /inheritance:r
icacls "$PD\administrators_authorized_keys" /grant "Administrators:F" "SYSTEM:F"

Restart-Service sshd
```

만약 일반 사용자 계정으로 할 거라면 다음 명령어로 대체.
```
# 일반 사용자 계정 키 주입
New-Item -ItemType Directory "$UserHome\.ssh" -Force | Out-Null
New-Item -ItemType File "$UserHome\.ssh\authorized_keys" -Force | Out-Null
notepad "$UserHome\.ssh\authorized_keys"   # 공개키 붙여넣기
```
##### 3. Cloudflare Quick Tunnel 실행
```
cloudflared tunnel --url ssh://localhost:22
```
실행하면 `https://random-string.trycloudflare.com` 같은 주소가 뜸

#### 🏠→🖥️ 집 PC에서 사무실 PC 접속
```
cloudflared access ssh --hostname random-string.trycloudflare.com
```

## 마무리
이제 집에서도 노트북에 CLI환경으로 접근 한 후, VM을 돌릴 수 있겠다. 나이스.