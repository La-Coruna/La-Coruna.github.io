---
layout: single
title: "Kubernetes 기반 애플리케이션 배포·운영 플랫폼: 개발 편의성과 운영 표준화"
date: 2026-07-12
permalink: /platform/kubernetes-application-platform/
description: 개발자는 인프라의 복잡성을 덜 느끼면서도 운영자는 표준과 추적성을 유지할 수 있도록, Kubernetes 기반 애플리케이션 배포·운영 플랫폼을 설계하고 구현한 과정
categories:
  - Cloud
  - Platform Engineering
tags:
  - Kubernetes
  - Platform Engineering
  - FastAPI
  - React
  - MariaDB
  - Docker
  - GKE
  - Infrastructure Automation
toc: true
toc_sticky: true
overview_gallery:
  - image_path: /assets/images/platform/application-platform/프로젝트 목록.png
    url: /assets/images/platform/application-platform/프로젝트 목록.png
    alt: "Kubernetes 애플리케이션 플랫폼 프로젝트 목록 화면"
    title: "프로젝트 목록"
  - image_path: /assets/images/platform/application-platform/프로젝트 생성.png
    url: /assets/images/platform/application-platform/프로젝트 생성.png
    alt: "Kubernetes 애플리케이션 플랫폼 프로젝트 생성 화면"
    title: "프로젝트 생성"
  - image_path: /assets/images/platform/application-platform/nginx pod 예시.png
    url: /assets/images/platform/application-platform/nginx pod 예시.png
    alt: "플랫폼에서 생성한 nginx 애플리케이션의 Pod 상태 화면"
    title: "nginx 애플리케이션 Pod 상태"
failure_scenario_gallery:
  - image_path: /assets/images/platform/application-platform/broken-image-pull.png
    url: /assets/images/platform/application-platform/broken-image-pull.png
    alt: "존재하지 않는 컨테이너 이미지로 인해 ImagePullBackOff가 발생한 프로젝트 상세 화면"
    title: "이미지 다운로드 실패: ImagePullBackOff"
  - image_path: /assets/images/platform/application-platform/broken-crashloop.png
    url: /assets/images/platform/application-platform/broken-crashloop.png
    alt: "컨테이너가 반복 종료되어 CrashLoopBackOff가 발생한 프로젝트 상세 화면"
    title: "컨테이너 실행 실패: CrashLoopBackOff"
---
<style>
.portfolio-link-panel {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  overflow: hidden;
  margin: 1.25rem 0 2.25rem;
  padding: 1.1rem;
  border: 1px solid rgba(0, 82, 136, 0.12);
  border-radius: 20px;
  background:
    linear-gradient(
      135deg,
      rgba(237, 248, 252, 0.9),
      rgba(226, 241, 249, 0.68)
    );
  box-shadow:
    0 18px 45px rgba(0, 44, 95, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
}

/* 패널 뒤쪽의 은은한 빛 */
.portfolio-link-panel::before,
.portfolio-link-panel::after {
  position: absolute;
  z-index: -1;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  content: "";
  filter: blur(35px);
  opacity: 0.45;
  pointer-events: none;
}

.portfolio-link-panel::before {
  top: -100px;
  left: -45px;
  background: rgba(0, 170, 210, 0.38);
}

.portfolio-link-panel::after {
  right: -60px;
  bottom: -115px;
  background: rgba(0, 44, 95, 0.28);
}

.portfolio-link {
  position: relative;
  display: inline-flex;
  flex: 1 1 270px;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  overflow: hidden;
  padding: 0.95rem 1.15rem;
  border-radius: 14px;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-decoration: none !important;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

/* 유리 표면의 반사광 */
.portfolio-link::before {
  position: absolute;
  top: 0;
  left: -45%;
  width: 35%;
  height: 100%;
  content: "";
  background: linear-gradient(
    100deg,
    transparent,
    rgba(255, 255, 255, 0.28),
    transparent
  );
  transform: skewX(-18deg);
  transition: left 420ms ease;
}

.portfolio-link:hover::before {
  left: 120%;
}

.portfolio-link:hover {
  transform: translateY(-3px);
}

.portfolio-link__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  margin-left: 1rem;
  border-radius: 50%;
  font-size: 1rem;
  transition: transform 180ms ease;
}

.portfolio-link:hover .portfolio-link__icon {
  transform: translate(2px, -2px);
}

/* 실행 중인 플랫폼 */
.portfolio-link--demo {
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background:
    linear-gradient(
      135deg,
      rgba(0, 44, 95, 0.98) 0%,
      rgba(0, 98, 154, 0.96) 58%,
      rgba(0, 170, 210, 0.92) 100%
    );
  box-shadow:
    0 12px 28px rgba(0, 75, 130, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.portfolio-link--demo:hover {
  box-shadow:
    0 17px 34px rgba(0, 75, 130, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.34);
}

.portfolio-link--demo .portfolio-link__icon {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.17);
  border: 1px solid rgba(255, 255, 255, 0.24);
}

/* Platform Developer 글 모음 */
.portfolio-link--collection {
  color: #003b70 !important;
  border: 1px solid rgba(0, 113, 165, 0.2);
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.83),
      rgba(223, 246, 252, 0.68)
    );
  box-shadow:
    0 10px 25px rgba(0, 74, 120, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.portfolio-link--collection:hover {
  border-color: rgba(0, 145, 190, 0.38);
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.94),
      rgba(212, 244, 251, 0.82)
    );
  box-shadow:
    0 15px 30px rgba(0, 74, 120, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.portfolio-link--collection .portfolio-link__icon {
  color: #005b8f;
  background: rgba(0, 170, 210, 0.12);
  border: 1px solid rgba(0, 145, 190, 0.16);
}

.portfolio-link:focus-visible {
  outline: 3px solid rgba(0, 170, 210, 0.42);
  outline-offset: 4px;
}

@media (max-width: 640px) {
  .portfolio-link-panel {
    flex-direction: column;
    padding: 0.85rem;
    border-radius: 17px;
  }

  .portfolio-link {
    flex-basis: auto;
    width: 100%;
    min-height: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .portfolio-link,
  .portfolio-link::before,
  .portfolio-link__icon {
    transition: none;
  }
}
</style>

# 주요 링크

<div class="portfolio-link-panel">
  <a
    href="http://portal.la-coruna.xyz/"
    class="portfolio-link portfolio-link--demo"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span>플랫폼 체험하기</span>
    <span class="portfolio-link__icon" aria-hidden="true">↗</span>
  </a>
<!--
  <a
    href="{{ '/platform/platform-developer/' | relative_url }}"
    class="portfolio-link portfolio-link--collection"
  >
    <span>Platform Developer 포트폴리오 보기</span>
    <span class="portfolio-link__icon" aria-hidden="true">→</span>
  </a>
-->
</div>
# 프로젝트 한눈에 보기

## 실행 화면
{% include gallery id="overview_gallery" caption="프로젝트 목록, 프로젝트 생성, Pod 외부 접속" %}

## 프로젝트 요약

> **한 줄 소개**
> 개발자가 서비스명, 컨테이너 이미지, 자원 정보와 외부 공개 여부만 입력하면, 플랫폼이 Namespace·ResourceQuota·Deployment·Service·Ingress를 표준 규칙에 따라 생성하고 Pod 상태·Kubernetes Event·작업 이력까지 보여주는 배포·운영 플랫폼입니다.

| 구분                 | 내용                                                            |
| ------------------ | ------------------------------------------------------------- |
| 프로젝트명              | Kubernetes 기반 애플리케이션 배포·운영 플랫폼                                |
| 프로젝트 목표            | 개발자가 Kubernetes YAML을 직접 작성하지 않고 애플리케이션을 배포하고 운영 상태를 확인하도록 지원 |
| 핵심 고민 | 개발자가 Kubernetes YAML과 명령어를 직접 다뤄야 하는 부담을 줄이면서도, 운영 표준과 변경 이력을 유지하는 것 |
| 주요 사용자             | 애플리케이션 개발자, 플랫폼 운영자                                           |
| Backend            | Python, FastAPI, SQLAlchemy                                   |
| Frontend           | React, TypeScript, Vite                                       |
| Database           | MariaDB                                                       |
| Container Platform | Kubernetes, Docker                                            |
| 개발 환경              | kind                                                          |
| 배포 환경              | GKE                                                           |
| 네트워크               | Service, NGINX Ingress Controller, DNS                        |
| 핵심 기능              | 리소스 생성, Pod/Event 조회, 외부 공개, 삭제, Audit Log                    |

## 플랫폼의 주요 흐름

{% include figure image_path="/assets/images/platform/application-platform/플랫폼 주요 흐름.png" alt="애플리케이션 배포 요청부터 Kubernetes 리소스 생성과 상태 확인까지의 플랫폼 흐름" caption="애플리케이션 배포 요청부터 Kubernetes 리소스 생성·상태 확인까지의 주요 흐름" %}

---


# 개발자 편의와 운영 통제 사이: Kubernetes 기반 애플리케이션 배포·운영 플랫폼

애플리케이션 개발자가 Kubernetes에 서비스를 배포하려면 컨테이너 이미지만 준비해서는 부족하다.

Namespace와 Deployment를 정의하고, CPU와 Memory를 설정해야 한다. 애플리케이션에 접근하려면 Service가 필요하고, 외부에 공개하려면 Ingress와 도메인도 구성해야 한다. 배포가 실패하면 Pod 상태와 Kubernetes Event를 직접 확인해야 한다.

Kubernetes를 잘 아는 개발자에게는 익숙한 과정일 수 있지만, 서비스를 개발하는 모든 사람이 이런 세부사항을 직접 다루어야 할 필요가 있을까?

반대로 모든 과정을 버튼 하나로 감추면 또 다른 문제가 생긴다.

개발자는 편리해지지만 운영자는 리소스 이름, 격리 기준, 자원 제한, 외부 공개 정책을 통제하기 어려워진다. 자동화 내부에서 실패가 발생했을 때 사용자는 무엇이 잘못되었는지 알 수 없고, 결국 다시 플랫폼 운영자에게 문의해야 한다.

이 프로젝트는 이 두 문제 사이에서 시작했다.

> **개발자가 인프라의 복잡성을 덜 느끼면서도, 플랫폼 운영자는 표준과 통제 가능성을 유지하려면 어떻게 해야 할까?**

이 질문을 풀기 위해 **Kubernetes 기반 애플리케이션 배포·운영 플랫폼**을 개발했다.

사용자가 서비스명, 컨테이너 이미지, 필요한 자원과 외부 공개 여부를 입력하면 플랫폼이 Kubernetes 리소스를 표준 규칙에 따라 생성한다. 생성 이후에는 Pod 상태와 Event를 조회해 배포 결과와 실패 원인을 확인할 수 있고, 삭제 과정과 작업 이력도 추적할 수 있도록 했다.

이 글에서는 프로젝트를 진행하며 가장 중요하게 고민했던 세 가지 문제를 중심으로 정리한다.

1. 어디까지 숨기고 무엇을 사용자에게 입력받을 것인가?
2. 셀프서비스가 운영 표준을 무너뜨리지 않게 하려면 어떻게 해야 하는가?
3. 편리한 자동화가 블랙박스가 되지 않게 하려면 어떻게 해야 하는가?

---


# 1. 프로젝트의 출발점: 배포 자동화만으로 충분한가

처음에는 Kubernetes 리소스를 자동 생성하는 것이 프로젝트의 핵심이라고 생각했다.

```text
API 요청
→ Namespace 생성
→ Deployment 생성
→ Service 생성
```

하지만 실제 사용자의 흐름을 생각하자 생성 기능만으로는 부족했다.

개발자는 애플리케이션을 배포한 뒤 다음 질문을 하게 된다.

* 배포 요청이 정상적으로 접수되었는가?
* 실제 Pod가 실행되고 있는가?
* 외부에서 접근할 수 있는가?
* 실패했다면 어느 단계에서 실패했는가?
* 필요 없어졌을 때 모든 리소스가 정리되는가?

운영자에게도 다른 질문이 생긴다.

* 모든 프로젝트가 동일한 이름 규칙을 따르는가?
* 한 프로젝트가 자원을 과도하게 사용하지 않는가?
* 어떤 리소스가 플랫폼에서 생성된 것인지 구분할 수 있는가?
* 누가 언제 생성하고 삭제했는가?
* DB의 상태와 Kubernetes의 실제 상태가 다르면 어떻게 확인할 것인가?

따라서 이 프로젝트의 범위를 단순한 배포 자동화에서 다음 전체 생명주기로 확장했다.

```text
신청
→ 입력 검증
→ 표준 리소스 생성
→ 상태 확인
→ 실패 원인 조회
→ 외부 접근
→ 삭제
→ 이력 보존
```

이 과정에서 프로젝트를 관통하는 세 가지 설계 문제가 구체화됐다.

---

# 2. 고민 1: 어디까지 숨기고 무엇을 사용자에게 입력받을 것인가

## 모든 설정을 보여주면 플랫폼을 만드는 의미가 없다

Kubernetes Deployment 하나에도 설정할 수 있는 항목은 많다.

* Replica 수
* Image
* Port
* Label
* Selector
* Resource Request와 Limit
* Probe
* Affinity
* Toleration
* Security Context
* Update Strategy

Service와 Ingress까지 포함하면 선택지는 더욱 많아진다.

사용자에게 Kubernetes의 모든 설정을 입력하도록 하면 자유도는 높아진다. 그러나 사용자가 결국 YAML 대신 긴 웹 양식을 작성하게 된다면 플랫폼을 사용하는 의미가 줄어든다.

반대로 모든 값을 고정하면 사용은 간단하지만 서비스마다 다른 요구를 수용할 수 없다.

따라서 먼저 다음 질문에 답해야 했다.

> **사용자가 표현해야 하는 것은 Kubernetes 리소스인가, 아니면 실행하려는 애플리케이션의 의도인가?**

## 사용자는 인프라 구성이 아니라 실행 의도를 입력한다

사용자에게 필요한 것은 Namespace나 Deployment 자체가 아니다.

사용자가 표현하려는 의도는 다음에 가깝다.

> 이 이미지를 staging 환경에서 실행하고 싶다. Pod는 2개가 필요하고, 일정한 CPU와 Memory를 사용하며 외부에서도 접근할 수 있어야 한다.

따라서 입력값을 애플리케이션 실행 의도를 표현하는 최소 정보로 제한했다.

```text
서비스명
실행 환경
컨테이너 이미지
Replica 수
CPU Request / Limit
Memory Request / Limit
컨테이너 포트
외부 공개 여부
```

반면 다음 항목은 플랫폼이 결정하도록 했다.

```text
Namespace 이름
Deployment 이름
Service 이름
Ingress 이름
Label과 Selector
ResourceQuota 이름
Ingress Host 규칙
리소스 생성 순서
삭제 순서
```

이를 표로 정리하면 다음과 같다.

| 사용자가 결정하는 것     | 플랫폼이 결정하는 것      |
| --------------- | ---------------- |
| 어떤 서비스를 실행할지    | 리소스 이름 규칙        |
| 어떤 이미지를 사용할지    | Namespace 구성     |
| 몇 개의 Pod가 필요한지  | Label과 Selector  |
| 어느 정도의 자원이 필요한지 | Service 유형       |
| 외부 공개가 필요한지     | Ingress와 Host 규칙 |
| 어느 환경에 배포할지     | 리소스 생성·삭제 순서     |

## 입력을 줄이는 것이 아니라 책임을 재배치했다

사용자 입력을 줄이는 목적은 단순히 화면을 간단하게 만드는 것이 아니었다.

Kubernetes 리소스 구조와 운영 규칙을 플랫폼의 책임으로 이동시킨 것이다.

```text
사용자 요청
“demo-api를 staging 환경에 배포하고 싶다.”

플랫폼 해석
- Namespace: demo-api-staging
- Deployment: demo-api-deployment
- Service: demo-api-service
- Ingress: demo-api-ingress
- Replica: 2
- 공통 Label 적용
- ResourceQuota 적용
```

이 구조를 통해 사용자는 자신의 애플리케이션에 필요한 값에 집중하고, 플랫폼은 인프라 구현 방식을 일관되게 관리할 수 있다.

## 추상화에는 탈출구도 필요하다

모든 사용자에게 동일한 고정값만 강제하면 실제 활용도가 떨어질 수 있다.

그래서 다음 값은 기본값을 제공하되 사용자가 변경할 수 있도록 했다.

* Replica 수
* CPU Request와 Limit
* Memory Request와 Limit
* Container Port
* 외부 공개 여부

반면 리소스 이름과 Label처럼 운영 추적에 필요한 규칙은 사용자가 변경할 수 없게 했다.

이를 통해 다음 기준을 세웠다.

> 서비스 특성에 따라 달라질 수 있는 값은 입력받고, 조직 전체에서 일관되어야 하는 값은 플랫폼이 관리한다.

이것이 이 프로젝트에서 설정한 첫 번째 추상화 경계였다.

---

# 3. 고민 2: 셀프서비스가 운영 표준을 무너뜨리지 않게 하려면 어떻게 해야 하는가

## 셀프서비스는 무제한 권한 제공이 아니다

개발자가 Kubernetes API에 직접 접근할 수 있다면 원하는 리소스를 자유롭게 만들 수 있다.

그러나 이런 방식은 장기적으로 다음 문제를 만들 수 있다.

```text
team-a-service
team_a_service
TeamA-Service
service-staging
staging-service
```

리소스 이름만 달라지는 것이 아니다.

* 팀마다 다른 Label 사용
* Resource Request와 Limit 누락
* Service Selector 불일치
* 외부 공개가 필요하지 않은 서비스까지 노출
* 프로젝트 소유자를 알 수 없는 리소스 생성
* 삭제 대상과 유지 대상 구분 어려움

셀프서비스를 단순히 사용자가 직접 모든 것을 할 수 있게 만드는 것으로 이해하면, 편의성은 높아지지만 운영 통제는 약해진다.

따라서 이 프로젝트에서는 셀프서비스를 다음과 같이 정의했다.

> **사용자가 필요한 자원을 스스로 요청할 수 있지만, 실제 생성은 플랫폼의 규칙과 제한 안에서 이루어지는 것.**

## 플랫폼이 Guardrail을 제공하도록 설계했다

사용자에게 Kubernetes 리소스 생성 권한을 직접 주는 대신, 플랫폼이 요청을 받아 리소스를 생성한다.

이 과정에서 다음 운영 규칙을 자동으로 적용했다.

### 프로젝트별 Namespace

서비스명과 환경을 조합해 Namespace를 생성했다.

```text
{service-name}-{environment}
```

예시:

```text
demo-api-staging
order-api-dev
movie-service-prod
```

이를 통해 서비스와 환경 단위로 리소스를 격리하고, 조회와 삭제 범위도 명확하게 만들었다.

### 공통 Naming Convention

리소스 이름은 플랫폼이 예측 가능한 규칙으로 생성한다.

```text
Namespace       demo-api-staging
Deployment      demo-api-deployment
Service         demo-api-service
Ingress         demo-api-ingress
ResourceQuota   demo-api-quota
```

### 공통 Label

모든 리소스에는 프로젝트와 플랫폼 관리 여부를 식별할 수 있는 Label을 적용했다.

```yaml
app.kubernetes.io/managed-by: application-platform
app.kubernetes.io/name: demo-api
app.kubernetes.io/instance: demo-api-staging
platform.local/project-id: "1"
platform.local/environment: staging
```

Label은 단순한 메타데이터가 아니다.

* Service와 Pod 연결
* 프로젝트 리소스 조회
* 플랫폼 관리 대상 식별
* 삭제 대상 검증
* DB 프로젝트와 Kubernetes 리소스 연결

에 활용했다.

### ResourceQuota

사용자가 입력한 CPU와 Memory 값만으로는 Namespace 전체의 자원 소비를 통제할 수 없다.

따라서 Namespace에 ResourceQuota를 적용해 프로젝트 전체가 사용할 수 있는 자원의 상한을 설정했다.

```text
컨테이너 Request / Limit
= 개별 컨테이너의 자원 요청과 제한

ResourceQuota
= Namespace 전체의 자원 사용 상한
```

### 외부 공개 정책

모든 Service를 외부에 공개하지 않았다.

Service는 `ClusterIP`로 생성하고, 사용자가 외부 공개를 선택한 경우에만 Ingress를 생성했다.

```text
expose_external = false
→ Cluster 내부에서만 접근

expose_external = true
→ Ingress 생성 및 외부 Host 제공
```

## 편의성과 통제는 반대 개념이 아니었다

처음에는 사용자의 자유를 제한하면 편의성도 줄어든다고 생각할 수 있었다.

그러나 반복적으로 필요한 규칙을 플랫폼이 대신 적용하면 사용자는 오히려 더 적은 판단으로 안전한 결과를 얻을 수 있다.

```text
사용자 편의
- YAML 작성 불필요
- 리소스 간 연결 규칙을 알 필요 없음
- 이름 규칙을 직접 관리할 필요 없음

운영 통제
- 동일한 Naming Convention
- 공통 Label
- ResourceQuota
- 외부 공개 정책
- 추적 가능한 리소스
```

즉, 플랫폼의 역할은 사용자에게 모든 선택지를 제공하는 것이 아니라 **안전한 선택 경로를 제공하는 것**이라고 판단했다.

---

# 4. 고민 3: 편리한 자동화가 블랙박스가 되지 않게 하려면 어떻게 해야 하는가

## API가 성공했다고 배포가 성공한 것은 아니다

Kubernetes API가 Deployment 생성을 수락했다고 해서 애플리케이션이 정상적으로 실행된 것은 아니다.

다음 요청은 모두 HTTP 수준에서는 정상적으로 처리될 수 있다.

```text
Namespace 생성 성공
Deployment 생성 성공
Service 생성 성공
```

그 이후 Pod에서는 다음 문제가 발생할 수 있다.

* 존재하지 않는 이미지
* Private Registry 인증 실패
* ResourceQuota 초과
* Container 실행 실패
* 잘못된 Port
* Readiness 실패
* Node 자원 부족

따라서 `POST /projects`가 성공했다는 사실만 사용자에게 보여주면 자동화가 블랙박스가 된다.

사용자는 버튼을 눌렀지만 실제로 애플리케이션이 실행되었는지 알 수 없다.

## Pod Phase만으로도 충분하지 않았다

Pod의 상태가 `Pending`이라고 표시되더라도 그 이유는 여러 가지일 수 있다.

```text
Pending
├── 이미지 다운로드 중
├── ImagePullBackOff
├── 스케줄링 대기
├── ResourceQuota 초과
└── Volume 연결 대기
```

따라서 다음 정보를 함께 조회했다.

* Pod Phase
* Ready 여부
* Container State
* Waiting Reason
* Restart Count
* Node
* Pod IP
* Kubernetes Event

## 실패 시나리오를 일부러 만들었다

정상 이미지인 `nginx:latest`만 배포하면 Kubernetes 리소스가 생성되는 성공 경로만 확인할 수 있다.

하지만 플랫폼에서 더 중요한 것은 리소스 생성 요청이 수락된 이후, 실제 애플리케이션이 실행되지 않는 상황을 사용자가 이해할 수 있게 보여주는 것이다.

이를 검증하기 위해 서로 원인이 다른 두 가지 실패 시나리오를 의도적으로 만들었다.

### 1. 컨테이너 이미지를 가져오지 못하는 경우

첫 번째 시나리오에서는 존재하지 않는 이미지 주소를 입력했다.

```text
does-not-exist.local/broken/nginx:missing
```

Kubernetes는 Deployment와 Pod를 생성했지만, 컨테이너 이미지를 찾을 수 없어 다음 상태로 전이됐다.

```text
Pod 생성
→ 이미지 Pull 시도
→ ErrImagePull
→ 재시도
→ ImagePullBackOff
```

플랫폼에서는 단순히 프로젝트를 `FAILED`로 표시하는 데 그치지 않고 다음 정보를 함께 제공했다.

```text
Pod Phase       Pending
Container State waiting
Waiting Reason  ImagePullBackOff
Event Reason    Failed / BackOff
Event Message   이미지 조회 및 Pull 실패
```

화면의 Kubernetes Event를 통해 이미지 저장소의 이름이나 Tag가 잘못되었는지, Registry 접근 자체가 불가능한지 확인할 수 있다.

### 2. 이미지는 실행됐지만 컨테이너가 반복 종료되는 경우

두 번째 시나리오에서는 이미지 자체는 정상적으로 로드되지만, 컨테이너 프로세스가 실행 직후 종료되도록 구성했다.

이 경우 Kubernetes는 컨테이너를 다시 실행하려고 반복적으로 시도하며 `CrashLoopBackOff` 상태가 발생한다.

```text
이미지 로드 성공
→ 컨테이너 생성
→ 컨테이너 시작
→ 프로세스 종료
→ 재시작
→ CrashLoopBackOff
```

이 시나리오는 이미지 다운로드 실패와 달리 Pod의 Phase가 `Running`으로 보일 수 있다는 점도 확인할 수 있었다.

따라서 Pod Phase만으로 성공 여부를 판단하지 않고 다음 정보를 함께 분석해야 했다.

```text
Pod Phase
Container State
Waiting Reason
Restart Count
Kubernetes Event
```

플랫폼은 `BackOff restarting failed container` Event와 `CrashLoopBackOff` 상태를 확인해 프로젝트 상태를 `FAILED`로 동기화했다.

{% include gallery id="failure_scenario_gallery" caption="이미지 다운로드 실패와 컨테이너 반복 종료를 재현해 Pod 상태, Kubernetes Event, Audit Log에서 원인을 확인한 화면" %}

두 실패는 사용자에게는 모두 “애플리케이션이 실행되지 않는다”는 동일한 결과로 보이지만, 원인과 대응 방법은 다르다.

| 실패 유형 | 주요 상태 | 확인할 내용 | 사용자의 다음 행동 |
| --- | --- | --- | --- |
| 이미지 다운로드 실패 | `ErrImagePull`, `ImagePullBackOff` | 이미지 주소, Tag, Registry 접근 권한 | 이미지명과 Registry 설정 확인 |
| 컨테이너 반복 종료 | `CrashLoopBackOff` | 실행 명령, 환경변수, 애플리케이션 오류 | 컨테이너 로그와 실행 설정 확인 |

또한 두 화면의 Audit Log에서는 Kubernetes 리소스 생성이 완료된 뒤에도 실제 워크로드 상태를 다시 조회해 프로젝트 상태가 `RUNNING` 또는 `PROVISIONING`에서 `FAILED`로 변경되는 과정을 확인할 수 있다.

이를 통해 다음 두 상태를 구분해야 한다는 점을 확인했다.

```text
리소스 생성 성공
≠
애플리케이션 실행 성공
```

따라서 플랫폼은 API 요청과 리소스 생성 결과만 보여주는 것이 아니라, Pod와 Container의 실제 상태를 지속적으로 확인하고 실패 원인을 사용자에게 전달하도록 설계했다.

## Kubernetes의 실제 상태와 플랫폼 상태를 분리했다

Kubernetes에는 Pod와 Deployment의 실제 상태가 있다.

플랫폼 DB에는 사용자의 요청과 업무 생명주기 상태가 있다.

```text
플랫폼 상태
REQUESTED
PROVISIONING
RUNNING
FAILED
DELETING
DELETED

Kubernetes 상태
Pending
Running
ImagePullBackOff
CrashLoopBackOff
Terminated
```

두 상태는 같지 않다.

예를 들어 프로젝트가 `PROVISIONING`인 동안 Pod는 `Pending`일 수 있다. 모든 Pod가 Ready가 되면 플랫폼 상태를 `RUNNING`으로 변경할 수 있다. `ImagePullBackOff`가 확인되면 `FAILED`로 판단할 수 있다.

```text
Kubernetes 상태 조회
→ Pod와 Container 상태 분석
→ 플랫폼 상태 판단
→ DB 상태 변경
→ 상태 이력 저장
```

## 생성뿐 아니라 삭제와 이력까지 보여주었다

자동화가 투명하려면 생성 이후의 과정도 확인할 수 있어야 한다.

프로젝트 삭제 시 다음 리소스를 정리한다.

```text
Ingress
→ Service
→ Deployment
→ ResourceQuota
→ Namespace
```

삭제 후 DB 레코드를 완전히 제거하지 않고 상태를 `DELETED`로 변경했다.

또한 다음 작업을 Audit Log에 기록했다.

* 프로젝트 생성
* Namespace 생성
* Deployment 생성
* Service 생성
* Ingress 생성
* 상태 변경
* 오류 발생
* 프로젝트 삭제

```text
누가 무엇을 요청했는가
→ 어떤 리소스가 생성되었는가
→ 결과가 성공했는가
→ 언제 삭제되었는가
```

이력까지 남김으로써 자동화를 단순히 편리한 기능이 아니라 추적 가능한 운영 과정으로 만들고자 했다.

프로젝트 요구사항 역시 정상 배포뿐 아니라 실패 원인 확인, 리소스 삭제, Audit Log를 핵심 사용자 시나리오로 정의하고 있다.

---

# 5. 세 가지 고민을 시스템 구조로 연결하기

세 가지 고민은 각각 독립된 기능이 아니라 전체 아키텍처에 반영됐다.

```text
1. 사용자의 의도만 입력받는다.
            |
            v
React 프로젝트 생성 화면
            |
            v
2. 플랫폼 규칙을 적용한다.
            |
            v
FastAPI 입력 검증 및 Kubernetes 리소스 생성
            |
            v
Namespace / Quota / Deployment / Service / Ingress
            |
            v
3. 결과와 실패를 다시 사용자에게 보여준다.
            |
            v
Pod / Event 조회, 상태 이력, Audit Log
```

## React Dashboard

사용자가 애플리케이션 실행에 필요한 값만 입력하도록 화면을 구성했다.

주요 화면은 다음과 같다.

* 프로젝트 목록
* 프로젝트 생성
* 프로젝트 상세
* Pod 상태
* Kubernetes Event
* 삭제 결과
* Audit Log

## FastAPI Backend

FastAPI는 단순 CRUD 서버가 아니라 사용자 요청과 Kubernetes 사이의 제어 계층으로 동작한다.

주요 책임은 다음과 같다.

* 입력 검증
* Naming Convention 적용
* 프로젝트 상태 관리
* Kubernetes 리소스 생성
* Pod와 Event 조회
* 오류 변환
* 리소스 삭제
* Audit Log 저장

## MariaDB

DB에는 Kubernetes의 현재 상태만으로 알 수 없는 정보를 저장한다.

* 사용자가 요청한 값
* 프로젝트 현재 상태
* 상태 변경 이력
* 생성된 Kubernetes 리소스 메타데이터
* 최근 오류
* 생성·삭제 Audit Log

DB 모델은 프로젝트, 상태 이력, Kubernetes 리소스 메타데이터, Audit Log를 분리해 생명주기를 추적하도록 설계했다.

## Kubernetes

Kubernetes는 실제 애플리케이션을 실행한다.

* Namespace를 통한 격리
* ResourceQuota를 통한 자원 제한
* Deployment를 통한 Pod 관리
* Service를 통한 내부 접근
* Ingress를 통한 외부 접근
* Pod와 Event를 통한 실행 상태 제공

---

# 6. 구현 흐름

## 프로젝트 생성

```text
1. 사용자가 서비스 정보를 입력한다.
2. FastAPI가 입력값을 검증한다.
3. MariaDB에 프로젝트를 REQUESTED 상태로 저장한다.
4. Namespace를 생성한다.
5. ResourceQuota를 생성한다.
6. Deployment를 생성한다.
7. Service를 생성한다.
8. 외부 공개 요청이면 Ingress를 생성한다.
9. 생성된 리소스 정보를 DB에 저장한다.
10. Audit Log를 기록한다.
```

## 상태 조회

```text
1. 사용자가 프로젝트 상세 화면에 접근한다.
2. DB에서 신청 정보와 플랫폼 상태를 조회한다.
3. Kubernetes API에서 Pod를 조회한다.
4. Container State와 Waiting Reason을 분석한다.
5. Namespace의 최근 Event를 조회한다.
6. 결과를 프로젝트 상세 화면에 표시한다.
```

## 삭제

```text
1. 사용자가 프로젝트 삭제를 요청한다.
2. 프로젝트 상태를 DELETING으로 변경한다.
3. 플랫폼이 생성한 리소스인지 Label로 확인한다.
4. Ingress부터 Namespace까지 순차적으로 삭제한다.
5. 프로젝트 상태를 DELETED로 변경한다.
6. 삭제 시각과 Audit Log를 저장한다.
```

---

# 7. 로컬에서 검증한 뒤 GKE로 확장하기

Kubernetes 연동 기능을 개발할 때마다 클라우드 환경을 사용하면 반복 테스트가 느리고 비용이 발생할 수 있다.

따라서 개발 초기에는 Docker 위에 kind 클러스터를 구성해 로컬에서 빠르게 검증했다.

```text
Local Machine
├── Docker Desktop
│   ├── MariaDB
│   └── kind Kubernetes Cluster
├── FastAPI
└── React
```

kind 환경에서는 다음 기능을 실제로 검증했다.

* Namespace 생성
* Deployment와 Pod 생성
* Service 연결
* ResourceQuota 적용
* Ingress 생성
* Pod 상태 조회
* ImagePullBackOff 재현
* Kubernetes Event 조회
* 리소스 삭제

{% include figure image_path="/assets/images/platform/application-platform/kind-resources.png" alt="kubectl로 조회한 kind Namespace, Pod, Service, Ingress, ResourceQuota 리소스" caption="로컬 kind 환경에서 생성된 Namespace, Pod, Service, Ingress, ResourceQuota 리소스" %}

로컬에서 정상·실패·삭제 시나리오를 반복 검증한 뒤에는 플랫폼 자체를 GKE에 배포했다.

이때 단순히 애플리케이션을 클러스터에 올리는 데 그치지 않고, **포털 접근 경로와 사용자가 생성한 애플리케이션의 외부 접근 경로를 분리**했다.

## 포털 접근 경로

포털은 `portal.la-coruna.xyz` 도메인으로 접근하도록 구성했다.

```text
External User
      |
      v
portal.la-coruna.xyz
      |
      v
GCE Ingress
      |
      v
portal-frontend / portal-backend
      |
      v
GKE Kubernetes API
      |
      v
사용자 애플리케이션 Namespace
```

포털 백엔드는 클러스터 내부에서 Kubernetes API를 호출해 Namespace, ResourceQuota, Deployment, Service와 Ingress를 생성한다.

## 사용자 애플리케이션 접근 경로

사용자가 외부 공개를 선택한 애플리케이션에는 다음 도메인 규칙을 적용했다.

```text
{service-name}-{environment}.apps.la-coruna.xyz
```

예를 들어 `demo-api` 서비스를 `staging` 환경에 생성하면 다음 주소로 접근할 수 있다.

```text
demo-api-staging.apps.la-coruna.xyz
```

초기에는 프로젝트마다 GKE 기본 Ingress를 생성했다. 이 구조에서는 각 프로젝트 Ingress가 별도의 Load Balancer IP를 사용하므로, 테스트 프로젝트가 늘어날수록 DNS 설정과 비용 관리가 복잡해질 수 있었다.

이를 해결하기 위해 사용자 애플리케이션용 Ingress를 하나의 **shared ingress-nginx controller**로 통합했다.

```text
External User
      |
      v
*.apps.la-coruna.xyz
      |
      v
shared ingress-nginx LoadBalancer
      |
      v
Project Ingress
      |
      v
Service
      |
      v
Pod
```

접근 경로를 정리하면 다음과 같다.

| 구분 | 도메인 | 외부 진입점 | 대상 |
| --- | --- | --- | --- |
| 플랫폼 포털 | `portal.la-coruna.xyz` | GCE Ingress | portal-frontend / portal-backend |
| 사용자 애플리케이션 | `*.apps.la-coruna.xyz` | shared ingress-nginx LoadBalancer | 프로젝트별 Ingress / Service / Pod |

이 구조를 통해 포털 운영 트래픽과 사용자 애플리케이션 트래픽을 구분했다. 또한 프로젝트가 늘어나더라도 하나의 shared ingress-nginx 진입점과 Wildcard DNS를 통해 외부 접근을 일관되게 관리할 수 있게 했다.

> 단순히 GKE에 배포하는 데 그치지 않고, 도메인과 Ingress 구조를 운영 관점에서 다시 설계했다.

---

# 8. 검증한 시나리오

## 정상 배포

```text
입력 이미지: nginx:latest
Replica: 1
외부 공개: true
```

확인한 결과:

* Namespace 생성
* ResourceQuota 생성
* Deployment 생성
* Pod Running
* Container Ready
* Service 생성
* Ingress 생성
* 외부 도메인 접근 성공

## 실패 배포

```text
입력 이미지: 존재하지 않는 이미지
```

확인한 결과:

* Deployment와 Pod 생성
* Pod Pending
* Container Waiting
* ImagePullBackOff 확인
* Kubernetes Event에서 이미지 Pull 실패 원인 확인
* 플랫폼 화면에서 실패 정보 조회

## 삭제

확인한 결과:

* 관련 Kubernetes 리소스 정리
* 프로젝트 상태 `DELETED` 반영
* 삭제 시각 보존
* Audit Log 기록
* 중복 삭제 요청 방지

## 상태 추적

확인한 결과:

* 신청 정보와 실제 Kubernetes 상태 분리
* Pod와 Event 정보 조회
* 프로젝트 상태 변화 저장
* 생성·실패·삭제 이력 확인

---

# 10. 현재 구조의 한계

이 프로젝트는 애플리케이션 배포·운영의 핵심 흐름을 검증하기 위한 MVP다.

실제 조직에서 사용하려면 다음 기능이 추가로 필요하다.

## 인증과 권한

현재보다 사용자와 팀을 명확히 구분하고, 프로젝트별 조회·생성·삭제 권한을 적용해야 한다.

Kubernetes 접근도 운영 환경에서는 ServiceAccount와 RBAC 최소 권한으로 제한해야 한다.

## 비동기 Provisioning

현재 구조보다 규모가 커지면 HTTP 요청 안에서 모든 리소스를 생성하는 대신 작업 Queue와 Worker를 이용해 비동기로 처리하는 것이 적합하다.

```text
생성 요청
→ REQUESTED 저장
→ Queue 등록
→ Worker Provisioning
→ 상태 갱신
```

## Reconciliation

DB의 목표 상태와 Kubernetes의 실제 상태가 달라질 수 있다.

주기적으로 두 상태를 비교하고 누락되거나 변경된 리소스를 감지하는 Reconciliation 과정이 필요하다.

## GitOps

현재는 FastAPI가 Kubernetes API에 직접 리소스를 반영한다.

운영 환경에서는 Helm Values를 Git에 저장하고 ArgoCD가 반영하는 구조로 확장할 수 있다.

```text
사용자 요청
→ FastAPI
→ Helm Values 생성
→ Git Commit
→ ArgoCD Sync
→ Kubernetes 반영
```

이를 통해 변경 이력, Diff, Rollback과 Drift 감지를 강화할 수 있다.

## 관측성

Provisioning 소요 시간, 실패율, 오류 유형과 API 상태를 수집하기 위해 Prometheus, Grafana와 중앙 로그 시스템을 연결할 수 있다.

현재 구현한 Direct Apply와 향후 GitOps 확장 구조는 아키텍처 단계에서 명확히 분리했다.

---

# 11. 프로젝트를 통해 배운 점

## 플랫폼은 복잡성을 없애는 것이 아니라, 적절한 곳으로 옮기는 일이다

플랫폼을 만든다고 해서 Kubernetes의 복잡성 자체가 사라지는 것은 아니었다.

기존에는 사용자가 직접 처리해야 했던 리소스 이름 규칙, Label과 Selector, ResourceQuota, 리소스 생성 순서 등을 플랫폼이 대신 책임지게 된 것이다.

좋은 플랫폼은 복잡성을 무조건 감추는 것이 아니라, 사용자가 알 필요 없는 부분은 내부에서 처리하고, 배포 상태와 실패 원인처럼 사용자가 판단에 필요한 정보는 다시 명확하게 전달해야 한다.

## 셀프서비스와 운영 통제는 함께 설계할 수 있다

처음에는 사용자의 자유도를 높이는 것과 운영자의 통제를 유지하는 것이 서로 충돌할 수 있다고 생각했다.

하지만 플랫폼이 안전한 기본값과 명확한 제한을 제공하면 두 가지를 함께 만족시킬 수 있었다.

사용자는 복잡한 설정을 반복해서 판단하지 않아도 더 빠르고 안전하게 작업할 수 있고, 운영자는 일관된 규칙으로 생성된 리소스를 관리할 수 있다.

## 정상 동작뿐 아니라 실패 상황을 검증하는 일이 중요했다

정상적인 이미지를 배포하는 기능만으로는 플랫폼의 운영 가치를 충분히 검증하기 어려웠다.

존재하지 않는 이미지, 컨테이너 반복 종료, 중복 요청, 삭제와 같은 실패·예외 상황을 직접 구현하고 검증하면서 상태 관리와 관측성의 중요성을 체감했다.

특히 단순히 실패했다는 결과만 보여주는 것이 아니라, 사용자가 원인을 이해하고 다음 행동을 결정할 수 있도록 Pod 상태와 Kubernetes Event를 함께 제공해야 한다는 점을 배웠다.

## 리소스 생성보다 전체 생명주기를 관리하는 일이 더 중요하다

처음에는 Kubernetes 리소스를 생성하는 코드가 프로젝트의 핵심이라고 생각했다.

하지만 실제로는 생성 전후의 전체 과정을 관리하는 데 더 많은 고민이 필요했다.

```text
요청을 어떻게 검증할 것인가
→ 생성 과정을 어떤 상태로 표현할 것인가
→ 실패 원인을 어떻게 전달할 것인가
→ 플랫폼이 생성한 리소스만 어떻게 식별하고 삭제할 것인가
→ 삭제 이후의 이력을 어떻게 보존할 것인가
```

이 경험을 통해 플랫폼 개발은 단순히 인프라 명령을 대신 실행하는 일이 아니라, 사용자의 의도를 안전한 시스템 동작으로 변환하고 그 결과를 전체 생명주기에 걸쳐 관리하는 일이라는 점을 배웠다.

---

# 12. 마치며

Kubernetes 기반 애플리케이션 배포·운영 플랫폼은 다음 질문에서 출발했다.

> 개발자가 Kubernetes의 모든 세부사항을 직접 다루지 않고도 애플리케이션을 배포할 수 있을까?

그러나 프로젝트를 진행하며 질문은 다음과 같이 확장됐다.

> 개발자에게 편리한 경험을 제공하면서, 운영 표준과 실패에 대한 가시성까지 함께 보장할 수 있을까?

이 질문에 답하기 위해 세 가지 원칙을 세웠다.

```text
1. 사용자는 인프라가 아니라 애플리케이션 실행 의도를 입력한다.
2. 플랫폼은 Naming, 격리, 자원과 네트워크 정책을 표준화한다.
3. 복잡성은 숨기되 상태와 실패 원인까지 숨기지는 않는다.
```

이 원칙을 바탕으로 신청부터 생성, 상태 확인, 실패 분석, 외부 공개, 삭제와 이력 보존까지 하나의 흐름으로 구현했다.

완성된 상용 플랫폼과 비교하면 인증, 멀티 클러스터, Reconciliation, GitOps와 관측성 등 보완할 부분이 남아 있다.

그럼에도 이번 프로젝트를 통해 Kubernetes를 사용하는 경험을 넘어, 복잡한 인프라를 개발자가 반복해서 사용할 수 있는 제품 인터페이스로 바꾸는 과정을 경험할 수 있었다.

> **플랫폼 개발은 명령을 대신 실행하는 일이 아니라, 사용자 편의와 운영 통제 사이의 경계를 설계하는 일이다.**

---

# 프로젝트 링크

* [서비스](http://portal.la-coruna.xyz/projects)
* [GitHub](https://github.com/La-Coruna/private-cloud-self-service-portal)
