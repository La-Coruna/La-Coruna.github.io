---
layout: single
title: 개인 도메인 구매 일지
excerpt: Spaceship에서 .xyz 도메인을 구매하고, Kubernetes 프로젝트 배포를 위해 DNS 레코드를 설정한 기록
categories:
  - Infrastructure
tags:
  - Domain
  - DNS
  - Spaceship
  - Kubernetes
toc: true
toc_sticky: true
date: 2026-07-12
last_modified_at: 2026-07-29
permalink: /infrastructure/domain-purchase-dns-records/
---
## 1. 서론

포트폴리오를 위해 개발했던 사이트들을 배포하면서 도메인이 하나 있으면 좋겠다고 생각했다.

도메인이 기술적으로 꼭 필요한 것은 아니었고, 비용을 지불해야 하다 보니 선뜻 진행하지 못하고 미루고 미뤘는데, 드디어 구매했다.

## 2. 어디서 구매할까

유명한 국내 사이트로는 가비아 등이 있지만, 나는 저렴한 도메인을 원했기 때문에 Spaceship을 이용했다.

그중에서도 가장 저렴한 `.xyz`로 결정했다.

## 3. DNS 레코드 설정

DNS 레코드를 설정할 때 입력하는 항목은 호스트, 유형, 값, TTL이다.

- **호스트**: 도메인 앞에 붙는 이름이다. `portal`을 입력하면 `portal.la-coruna.xyz`가 된다.
- **유형**: DNS 레코드의 종류다. 여기서는 도메인을 IPv4 주소와 연결하는 A 레코드를 사용했다.
- **값**: 도메인이 연결될 대상의 IP 주소다.
- **TTL**: DNS 정보가 캐시에 유지되는 시간이다.

![Spaceship DNS 레코드 설정 화면](/assets/images/DNS_record.png)

나는 [Kubernetes 기반 애플리케이션 배포·운영 플랫폼](/platform/kubernetes-application-platform/)에서 다루고 있는 프로젝트를 배포하기 위해 `portal.la-coruna.xyz`를 설정했다.

이 프로젝트는 Kubernetes에 애플리케이션 Pod를 배포하기 때문에, 앱마다 DNS 레코드를 추가하지 않아도 되도록 `*.apps.la-coruna.xyz` 와일드카드 레코드도 설정했다. 각 호스트로 들어온 요청은 Kubernetes의 Ingress를 통해 해당 애플리케이션으로 전달된다.

## 4. 마무리

막상 포스팅하려고 보니 작성할 게 딱히 없더라. 스크린샷을 조금 더 자주 찍어서 구매 과정을 따라 할 수 있게 했으면 좋았을 텐데. 그건 다음 기회로 미뤄두기로 하자.
