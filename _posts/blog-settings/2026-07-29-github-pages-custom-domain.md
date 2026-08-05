---
layout: single
title: "GitHub Pages 블로그에 개인 도메인 연결하기"
excerpt: Spaceship에서 구매한 개인 도메인을 GitHub Pages 블로그에 연결하고 HTTPS까지 적용한 기록
categories:
  - Blog Management
tags:
  - GitHub Pages
  - Custom Domain
  - DNS
  - HTTPS
toc: true
toc_sticky: true
date: 2026-07-29
last_modified_at: 2026-07-29
permalink: /blog-management/github-pages-custom-domain/
---

## 1. 서론

최근에 개인 도메인을 구매했다. 이참에 GitHub Pages로 운영하고 있는 블로그도 개인 도메인에 연결해 두기로 했다.

방법은 아래의 두 단계가 되겠다.

1. 도메인을 구매한 사이트에서 DNS 레코드 생성
2. GitHub 저장소의 Pages 설정에서 Custom domain 등록

## 2. DNS 레코드 생성

나는 도메인을 구매한 Spaceship의 DNS 설정에서 진행했다.

서브도메인으로는 `blog`를 사용했고, 레코드 유형은 CNAME으로 설정했다.

값에는 GitHub Pages의 기본 주소인 `la-coruna.github.io`를 입력했다.

![Spaceship에서 GitHub Pages 블로그용 CNAME 레코드를 생성한 화면](/assets/images/blog-settings/github-pages-custom-domain/dns-record.png)

## 3. GitHub Pages에 Custom domain 설정

GitHub 블로그 저장소의 **Settings**에 들어간 뒤, 왼쪽 메뉴에서 **Pages**를 선택한다. 아래로 내려가면 **Custom domain** 항목을 확인할 수 있다.

![GitHub Pages의 Custom domain 설정 화면](/assets/images/blog-settings/github-pages-custom-domain/github-pages-settings.png)

블로그 주소로 사용할 도메인을 입력하고 저장하면 DNS Check가 시작된다.

![GitHub Pages에서 DNS 확인이 진행 중인 화면](/assets/images/blog-settings/github-pages-custom-domain/dns-check-in-progress.png)

DNS 설정이 정상적으로 반영되면 확인이 완료됐다는 메시지가 표시된다. 변경 사항이 반영되기까지 시간이 조금 걸릴 수 있다.

![GitHub Pages의 DNS 확인이 완료된 화면](/assets/images/blog-settings/github-pages-custom-domain/dns-check-successful.png)

## 4. HTTPS 적용

DNS 확인이 끝나도 TLS 인증서가 바로 발급되는 것은 아니다. 인증서가 준비되기 전에는 브라우저에서 안전하지 않은 HTTP 연결로 표시될 수 있다.

![개인 도메인 접속 시 HTTP 연결로 표시되는 화면](/assets/images/blog-settings/github-pages-custom-domain/http-not-secure.png)

GitHub Pages 설정을 확인하면 TLS 인증서가 프로비저닝 중이라는 메시지가 표시된다.

![GitHub Pages에서 TLS 인증서를 프로비저닝 중인 화면](/assets/images/blog-settings/github-pages-custom-domain/tls-certificate-provisioning.png)

잠시 기다리면 인증서 발급이 완료되고 HTTPS를 사용할 수 있는 상태가 된다.

![GitHub Pages의 TLS 인증서 발급이 완료된 화면](/assets/images/blog-settings/github-pages-custom-domain/tls-certificate-ready.png)

HTTPS 연결은 권장되므로 **Enforce HTTPS** 옵션도 활성화했다.

![GitHub Pages에서 Enforce HTTPS를 활성화한 화면](/assets/images/blog-settings/github-pages-custom-domain/enforce-https.png)

## 5. 마무리

차란~ 나도 이제 어엿한 개인 도메인 블로그 오우너다.

![개인 도메인이 적용된 블로그 화면](/assets/images/blog-settings/github-pages-custom-domain/custom-domain-blog.png)

## 관련 게시글

- [개인 도메인 구매 일지](/infrastructure/domain-purchase-dns-records/)
