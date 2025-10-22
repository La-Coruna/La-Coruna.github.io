---
filename: 2025-10-22-Docker-Command
title: "[251022][Docker] Docker 명령어 정리"
categories:
  - TIL
  - docker
comments: true
tags:
  - docker
toc: true
toc_sticky: true
---
## Docker 컨테이너 실행 및 상태 변경 명령어 정리

| 단계         | 명령어                      | 주요 옵션                                     | 설명                              | 예시                                           |
| ---------- | ------------------------ | ----------------------------------------- | ------------------------------- | -------------------------------------------- |
| 생성 & 실행    | `docker run`             | `-d`, `-it`, `--name`, `-p`, `-v`, `--rm` | 이미지를 기반으로 새 컨테이너를 생성하고 실행       | `docker run -it --name myubuntu ubuntu bash` |
| 생성만 (실행 X) | `docker create`          | `--name`, `-p`, `-v`                      | 컨테이너를 만들기만 하고 실행하지 않음           | `docker create --name myubuntu ubuntu`       |
| 시작         | `docker start`           | `-a`, `-i`                                | 정지 상태 컨테이너를 다시 실행               | `docker start -ai myubuntu`                  |
| 일시 중지      | `docker pause`           | —                                         | 컨테이너의 모든 프로세스를 일시 중단            | `docker pause myubuntu`                      |
| 일시 중지 해제   | `docker unpause`         | —                                         | pause 상태 컨테이너를 다시 재개            | `docker unpause myubuntu`                    |
| 중지         | `docker stop`            | —                                         | 컨테이너를 정상 종료 (SIGTERM → SIGKILL) | `docker stop myubuntu`                       |
| 강제 종료      | `docker kill`            | —                                         | 즉시 강제 종료 (SIGKILL)              | `docker kill myubuntu`                       |
| 재시작        | `docker restart`         | —                                         | 컨테이너를 정지 후 즉시 다시 시작             | `docker restart myubuntu`                    |
| 상태 확인      | `docker ps`              | `-a`, `-q`                                | 실행 중 컨테이너 목록 확인 (`-a`는 전체)      | `docker ps -a`                               |
| 로그 확인      | `docker logs`            | `-f`, `--tail`                            | 컨테이너 출력 로그 보기                   | `docker logs -f mynginx`                     |
| 터미널 접속     | `docker exec`            | `-it`, `bash`                             | 실행 중 컨테이너에 명령 실행 / 셸 접속         | `docker exec -it mynginx bash`               |
| 터미널 재연결    | `docker attach`          | —                                         | 기존 실행 중 프로세스의 표준입출력에 연결         | `docker attach myubuntu`                     |
| 삭제         | `docker rm`              | `-f`                                      | 정지된 컨테이너 삭제 (`-f`는 강제)          | `docker rm -f myubuntu`                      |
| 전체 정리      | `docker container prune` | —                                         | 중지된 컨테이너 모두 삭제                  | `docker container prune`                     |

---

## 자주하는 질문 정리

### run, exec, start, attach 구분

* **docker run**: 이미지를 기반으로 새 컨테이너를 만들고 지정된 명령을 실행한다. (기본 CMD가 자동 실행됨)
* **docker exec**: 이미 실행 중인 컨테이너 내부에서 새로운 명령을 실행한다.
* **docker start**: 정지된 컨테이너를 다시 실행한다. 새 명령을 붙일 수 없으며, 기존 CMD/ENTRYPOINT가 다시 실행된다.
* **docker attach**: 실행 중인 컨테이너의 **기존 표준 입출력(메인 프로세스)** 에 다시 연결할 때 사용한다.

---

### docker run 실행 시 CMD 동작 원리

* `docker run`으로 컨테이너를 실행하면, 이미지 내부의 `Dockerfile`에 지정된 **기본 CMD 명령어가 자동으로 실행**된다.
* 하지만 `docker run` 뒤에 직접 명령을 추가로 붙이면, 기본 CMD는 **덮어쓰기(override)** 되어 해당 명령만 실행된다.
* 이 경우, 실행된 명령이 완료되면 컨테이너는 바로 종료된다.
* 즉, `run`은 "컨테이너를 만들고 지정된 명령(CMD 또는 사용자 명령)을 실행하는 역할"을 한다.
* 따라서, `exec`에서는 터미널을 열려면 `bash` 명령어를 써야 하지만, `run`의 경우는 **명령어 옵션을 생략하면 자동으로 CMD 명령이 실행되어 셸이 열린다.**

#### 이미지별 기본 CMD

* Docker는 이미지의 `Dockerfile` 내부 메타데이터(`CMD`나 `ENTRYPOINT`)를 확인해 어떤 명령을 기본으로 실행할지 결정한다.
* 예: `ubuntu` → `bash`, `alpine` → `/bin/sh`

---

### -it, -d 옵션에 관하여

#### -i, -t, -d 각 옵션의 기능

* `-i` : 표준 입력(STDIN)을 열어두어 사용자 입력을 받을 수 있게 함.
* `-t` : 터미널(TTY)을 할당하여 사람이 보기 좋은 터미널 환경 제공.
* `-d` : 백그라운드(detached) 모드로 실행하여 터미널에 붙지 않음.

#### -i와 -t의 단독 사용의 경우

* `-i`만 사용: 입력은 가능하지만 터미널 화면이 깨지고 불편하다.
* `-t`만 사용: 보기 좋은 터미널은 생성되지만 입력이 불가능하다.
* `-it` 함께 사용: 입력도 되고 터미널도 정상적으로 표시되는 완전한 대화형 환경.

#### -it 옵션의 필요 여부

* 입력이 없는 명령(`ls`, `echo`, `cat` 등)은 `-it`이 없어도 된다.
* 입력이 필요한 명령(`bash`, `python`, `mysql`)은 `-it`을 반드시 붙여야 한다.
* `-it` 없이 실행하면 명령은 수행되지만 입력이 불가능하다.

#### -itd 옵션 같이 쓰기

* 문법적으로는 가능하지만, 의미상 **`-it`(대화형)** 과 **`-d`(백그라운드)** 는 상반되므로 보통 함께 쓰지 않는다.

---
