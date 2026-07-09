---
title: "[StoreOps] 4. MVP 재고 시스템을 확장 가능한 Inventory 구조로 발전시켜보기"
categories:
  - Project
  - StoreOps
tags:
  - StoreOps
  - 편의점 운영
  - Spring Boot
  - Inventory
  - System Design
toc: true
toc_sticky: true
permalink: /posts/storeops-inventory-expansion/
excerpt: "MVP 재고 구조의 한계를 바탕으로 StockMovement, InventoryBalance, Reservation, CustomerAvailabilityView, 캐시, 동시성 제어를 고민합니다."
---

> **StoreOps Platform 시리즈**  
> - [1편: 프로젝트 배경](/posts/storeops-project-background/)
> - [2편: 도메인 설계](/posts/storeops-domain-design/)
> - [3편: 재고 트랜잭션](/posts/storeops-inventory-transaction/)
> - 4편: 대규모 Inventory 확장
> - [전체 글 목록](/storeops/)

## 1. 왜 이 글을 쓰는가

StoreOps Platform은 편의점 운영 흐름을 작게 구현해보기 위한 MVP 프로젝트다.

지금까지 이 프로젝트에서는 POS 판매, PDA 입고, 고객 재고조회, 관리자 재고/발주 기능을 하나의 재고 데이터를 중심으로 연결했다.

MVP에서의 핵심 구조는 단순하다.

```text
POS 판매  → Inventory 감소
PDA 입고  → Inventory 증가
고객 조회 → Inventory 조회
관리자    → Inventory + Sale 이력 기반 운영 판단
```

이 구조는 학습용 프로젝트에서 장점이 분명하다. POS, PDA, 고객 앱, 관리자 WEB이 서로 다른 시스템처럼 보이지만 결국 **점포별 상품 재고**라는 같은 데이터를 기준으로 연결된다는 메시지를 보여주기 좋다.

하지만 프로젝트를 구현하면서 자연스럽게 다음 질문이 생겼다.

```text
실제 대규모 운영 시스템에서도 Inventory 테이블 하나만으로 충분할까?
고객 앱 조회 트래픽이 많아지면 어떻게 해야 할까?
동시에 여러 POS 판매 요청이 들어오면 초과 판매를 어떻게 막을까?
입고와 판매 외에 폐기, 반품, 조정, 점포 간 이동은 어떻게 기록할까?
픽업 예약처럼 아직 판매 확정은 아니지만 재고를 잡아둬야 하는 상황은 어떻게 처리할까?
네트워크 장애로 POS 이벤트가 중복 전송되면 재고가 두 번 줄어들지 않을까?
```

물론 실제 편의점 기업의 내부 시스템 구조를 알 수는 없다. 따라서 이 글은 특정 회사의 실제 구조를 단정하는 글이 아니다.

대신 내가 구현한 MVP 재고 시스템을 출발점으로, **대규모 운영 시스템으로 확장한다고 가정했을 때 어떤 문제를 고려할 수 있는지** 정리해보려 한다.

이번 글의 핵심 메시지는 다음과 같다.

```text
MVP에서는 Inventory를 단일 기준 데이터로 단순화했다.
하지만 대규모 운영 시스템에서는 재고 정합성, 운영 추적성, 고객 조회 성능, 예약 재고, 장애 복구를 위해
StockMovement, InventoryBalance, Reservation, CustomerAvailabilityView 같은 역할 분리가 필요할 수 있다.
```

---

## 2. MVP Inventory 구조 다시 보기

먼저 현재 MVP 구조를 다시 정리해보자.

현재 프로젝트에서는 재고를 다음과 같이 단순하게 표현했다.

```text
inventories
- id
- store_id
- product_id
- quantity
- created_at
- updated_at
```

그리고 재고 변동 이력은 판매와 입고로 나누어 저장했다.

```text
sales
- id
- store_id
- product_id
- quantity
- sold_at

receipts
- id
- store_id
- product_id
- quantity
- received_at
```

이 구조에서 주요 흐름은 다음과 같다.

```text
POS 판매
→ inventories.quantity 감소
→ sales 이력 저장

PDA 입고
→ inventories.quantity 증가
→ receipts 이력 저장

고객 재고조회
→ inventories.quantity 조회

관리자 발주 추천
→ inventories.quantity + sales 이력 기반 계산
```

이 구조는 MVP 단계에서 충분히 의미가 있다.

첫째, 구조가 단순하다. 점포별 상품 재고를 `Inventory` 하나로 표현하기 때문에 프로젝트의 핵심 메시지가 명확하다.

둘째, 트랜잭션 처리가 쉽다. POS 판매 시 재고 차감과 판매 이력 저장을 하나의 `@Transactional` 안에서 처리할 수 있고, PDA 입고도 재고 증가와 입고 이력 저장을 하나의 트랜잭션으로 묶을 수 있다.

셋째, 구현 범위가 적절하다. 학습용 프로젝트에서 너무 복잡한 구조를 처음부터 적용하면 오히려 핵심 기능 완성도가 떨어질 수 있다. MVP에서는 재고 흐름을 끝까지 구현하는 것이 더 중요했다.

하지만 이 구조에는 한계도 있다.

```text
재고 변동 사유가 Sale, Receipt로만 제한된다.
폐기, 반품, 재고 조정, 점포 간 이동을 표현하기 어렵다.
고객 조회 트래픽이 많아지면 Inventory 직접 조회가 부담될 수 있다.
예약 재고와 실제 보유 재고를 구분하지 않는다.
동시 판매 상황에서 초과 판매 문제가 발생할 수 있다.
오프라인 POS나 중복 이벤트 처리까지 고려하지 않는다.
```

따라서 실제 대규모 시스템으로 확장한다고 가정하면, Inventory를 단일 테이블로만 보기보다 여러 책임으로 나누어 생각할 필요가 있다.

---

## 3. 대규모 Inventory에서 새로 생기는 문제

대규모 운영 환경에서 재고는 단순히 “현재 몇 개 남았는가”를 저장하는 데이터가 아니다.

재고는 고객 경험, 점포 운영, 물류, 발주, 정산, 장애 대응과 모두 연결된다.

MVP에서는 다음 정도의 흐름만 다루었다.

```text
판매
입고
조회
발주 추천
```

하지만 실제 운영 규모를 가정하면 다음과 같은 상황들이 추가된다.

```text
고객 앱에서 특정 상품의 점포별 재고조회 요청이 많이 발생한다.
동일 상품에 대해 여러 POS 판매 요청이 동시에 들어온다.
PDA 입고 외에도 폐기, 반품, 재고 조정, 점포 간 이동이 발생한다.
픽업 예약이나 배달 주문으로 재고를 미리 잡아둬야 한다.
점포 POS가 네트워크 장애를 겪은 뒤 판매 이벤트를 재전송할 수 있다.
고객 앱에는 실제 재고 수량을 그대로 보여주기 어려울 수 있다.
운영자는 현재 재고뿐 아니라 재고가 왜 변했는지도 추적해야 한다.
```

이 문제들을 모두 `inventories.quantity` 하나로 처리하려고 하면 한계가 생긴다.

그래서 대규모 Inventory 설계에서는 다음 질문을 나누어 생각해야 한다.

```text
1. 재고가 왜 변했는가?
2. 현재 재고는 얼마인가?
3. 판매 가능한 재고는 얼마인가?
4. 고객에게 어떤 상태로 보여줄 것인가?
5. 조회 성능을 어떻게 확보할 것인가?
6. 중복 이벤트와 동시 요청을 어떻게 처리할 것인가?
```

이 질문에 맞춰 Inventory를 여러 층으로 나누면 다음과 같은 구조를 생각할 수 있다.

```text
StockMovement
→ 재고 변동 원장

InventoryBalance
→ 현재 재고 상태

Reservation
→ 예약/홀드 재고

CustomerAvailabilityView
→ 고객 앱 조회용 재고 상태

Cache/Search/Analytics
→ 빠른 조회와 분석을 위한 파생 데이터
```

각 층은 같은 재고를 다루지만 목적이 다르다.

StockMovement는 “왜 변했는가”를 기록한다. InventoryBalance는 “현재 얼마인가”를 빠르게 보여준다. Reservation은 “아직 판매 확정은 아니지만 잡혀 있는 재고”를 관리한다. CustomerAvailabilityView는 “고객에게 어떻게 보여줄 것인가”를 담당한다. Cache나 검색 인덱스는 “어떻게 빠르게 조회할 것인가”를 담당한다.

---

## 4. 주요 확장 요소 간단히 정리

앞에서 정리한 구조를 실제 테이블 수준까지 자세히 풀어낼 수도 있지만, 이 글에서는 개념의 역할만 간단히 짚고 넘어가는 정도가 적절하다고 생각했다.

MVP에서 사용한 `Inventory`, `Sale`, `Receipt` 구조를 대규모 시스템으로 확장한다면 다음과 같이 역할을 나눠볼 수 있다.

| 확장 요소 | 역할 | MVP에서 대응되는 부분 |
| --- | --- | --- |
| StockMovement | 재고가 왜 변했는지 기록하는 원장 | Sale, Receipt 이력 |
| InventoryBalance | 현재 재고를 빠르게 조회하기 위한 상태 데이터 | Inventory.quantity |
| Reservation | 픽업/주문 등으로 미리 잡아둔 예약 재고 | MVP에서는 미구현 |
| CustomerAvailabilityView | 고객 앱에 보여줄 재고 상태 | 고객 재고조회 응답 |

`StockMovement`는 판매, 입고뿐 아니라 폐기, 반품, 재고 조정, 점포 간 이동처럼 다양한 재고 변동 사유를 하나의 원장으로 남기기 위한 구조다. MVP에서는 Sale과 Receipt를 분리했지만, 규모가 커지면 모든 재고 변동을 하나의 기준으로 추적하는 편이 운영 분석에 더 유리할 수 있다.

`InventoryBalance`는 현재 재고를 빠르게 조회하기 위한 상태 데이터다. 모든 변동 이력을 매번 합산해서 현재 재고를 계산하면 비용이 커질 수 있기 때문에, 현재 보유 재고와 판매 가능 재고를 별도로 관리하는 구조를 생각할 수 있다.

```text
available_quantity = on_hand_quantity - reserved_quantity - safety_stock
```

`Reservation`은 픽업 예약이나 배달 주문처럼 아직 판매가 확정되지는 않았지만 다른 고객에게 팔면 안 되는 수량을 관리한다. 이 개념이 없으면 앱에서 예약된 상품과 매장 판매가 겹쳐 초과 판매가 발생할 수 있다.

`CustomerAvailabilityView`는 고객 앱 조회를 위한 가공 데이터다. 고객에게는 실제 수량을 그대로 보여주기보다 `AVAILABLE`, `LOW_STOCK`, `SOLD_OUT` 같은 상태값으로 제공하는 편이 더 안전할 수 있다.

즉, 대규모 Inventory 설계에서는 하나의 `quantity`만 보는 것이 아니라 다음 질문을 나누어 생각해야 한다.

```text
재고가 왜 변했는가?
현재 시스템상 재고는 얼마인가?
그중 실제 판매 가능한 재고는 얼마인가?
고객에게는 어떤 상태로 보여줄 것인가?
```

MVP는 이 구조를 모두 구현하지는 않았지만, `Inventory`, `Sale`, `Receipt`, 고객 재고조회 API를 통해 이 확장 구조의 가장 작은 형태를 구현했다고 볼 수 있다.

---
## 5. Redis Cache와 조회용 파생 데이터

고객 재고조회는 조회 트래픽이 많을 수 있다.

예를 들어 인기 상품이나 행사 상품의 경우, 많은 고객이 주변 점포 재고를 동시에 조회할 수 있다. 이때 매번 운영 DB의 InventoryBalance를 직접 조회하면 부담이 커질 수 있다.

그래서 Redis 캐시나 검색 인덱스를 사용할 수 있다.

예를 들어 Redis key를 다음과 같이 둘 수 있다.

```text
availability:product:1001:region:seoul-hanyang
```

value는 다음과 같은 형태가 될 수 있다.

```json
[
  {
    "storeId": 1,
    "status": "AVAILABLE",
    "displayQuantityRange": "3개 이상"
  },
  {
    "storeId": 2,
    "status": "LOW_STOCK",
    "displayQuantityRange": "1~2개"
  },
  {
    "storeId": 3,
    "status": "SOLD_OUT",
    "displayQuantityRange": "0개"
  }
]
```

하지만 재고 데이터 캐싱은 조심해야 한다. 재고는 POS 판매와 PDA 입고에 따라 자주 바뀐다.

```text
POS 판매 → 재고 감소
PDA 입고 → 재고 증가
예약 생성 → 판매 가능 재고 감소
예약 취소 → 판매 가능 재고 증가
폐기 처리 → 재고 감소
```

따라서 단순히 “Redis를 쓰면 빠르다”로 접근하면 위험하다. 캐시가 오래 남아 있으면 실제 재고와 고객 앱 조회 결과가 달라질 수 있기 때문이다.

그래서 캐시를 적용한다면 다음 전략을 함께 고려해야 한다.

```text
TTL을 짧게 둔다.
POS 판매나 PDA 입고 이벤트 발생 시 캐시를 무효화한다.
정확한 수량이 아니라 AVAILABLE/LOW_STOCK/SOLD_OUT 상태만 캐시한다.
고객에게 last_synced_at을 함께 제공한다.
재고 수량이 적은 상품은 더 보수적으로 표시한다.
```

대규모 구조에서는 다음과 같은 흐름을 생각할 수 있다.

```text
InventoryBalance 변경
→ InventoryUpdated 이벤트 발행
→ CustomerAvailabilityView 갱신
→ Redis 캐시 무효화 또는 갱신
→ 고객 앱 조회 결과 반영
```

이 구조에서 Redis는 기준 데이터가 아니다. 기준 데이터는 InventoryBalance와 StockMovement이고, Redis는 빠른 조회를 위한 파생 데이터다.

이 점이 중요하다.

```text
Redis는 재고의 원본 데이터가 아니라, 고객 조회 성능을 높이기 위한 캐시다.
```

---

## 6. 동시성 제어: 초과 판매를 어떻게 막을 것인가

재고 시스템에서 가장 중요한 문제 중 하나는 동시성이다.

예를 들어 현재 판매 가능 재고가 1개 남았다고 하자.

```text
available_quantity = 1
```

그런데 동시에 두 POS에서 판매 요청이 들어온다.

```text
요청 A: 1개 판매
요청 B: 1개 판매
```

두 요청이 모두 현재 재고 1개를 보고 판매 가능하다고 판단하면, 총 2개가 판매되는 문제가 발생할 수 있다.

이를 막기 위한 방식은 여러 가지가 있다.

### 6.1 조건부 UPDATE

가장 직관적인 방식 중 하나는 조건부 UPDATE다.

```sql
UPDATE inventory_balances
SET available_quantity = available_quantity - :quantity
WHERE store_id = :storeId
  AND product_id = :productId
  AND available_quantity >= :quantity;
```

이 쿼리는 `available_quantity`가 요청 수량 이상일 때만 차감된다.

업데이트된 row 수가 1이면 성공이고, 0이면 재고 부족으로 처리할 수 있다.

```text
updated row count = 1 → 판매 성공
updated row count = 0 → 재고 부족
```

이 방식의 장점은 재고 부족 검증과 차감을 DB의 단일 UPDATE로 처리할 수 있다는 점이다.

### 6.2 낙관적 락

두 번째 방식은 낙관적 락이다.

InventoryBalance에 `version` 컬럼을 두고, 업데이트 시점에 내가 읽은 version과 현재 version이 같은지 확인한다.

```text
조회 시 version = 10
업데이트하려고 보니 version = 11
→ 누군가 먼저 수정함
→ 업데이트 실패 후 재시도 또는 실패 응답
```

JPA에서는 `@Version`을 사용할 수 있다.

```java
@Version
private Long version;
```

낙관적 락은 충돌이 많지 않은 상황에서는 효율적이다. 하지만 인기 상품처럼 동시에 많은 요청이 몰리는 경우에는 충돌과 재시도가 많아질 수 있다.

### 6.3 비관적 락

세 번째 방식은 비관적 락이다.

재고 row를 먼저 잠근 뒤 처리하는 방식이다.

```sql
SELECT *
FROM inventory_balances
WHERE store_id = :storeId
  AND product_id = :productId
FOR UPDATE;
```

이 방식은 정합성을 강하게 보장할 수 있다.

하지만 동시에 요청이 많이 몰리면 대기 시간이 증가할 수 있다. 즉, 정확성은 높지만 성능 부담이 생길 수 있다.

### 6.4 어떤 방식을 선택할 것인가

정답은 상황에 따라 달라진다.

```text
충돌이 적은 상품 → 낙관적 락
인기 상품처럼 충돌이 많은 상품 → 조건부 UPDATE 또는 비관적 락
강한 정합성이 필요한 예약/결제 흐름 → 더 엄격한 락 전략
조회 중심 기능 → 캐시와 read model 활용
```

MVP에서는 기본 트랜잭션과 재고 음수 방지까지만 구현했다. 하지만 대규모 시스템으로 확장한다면 조건부 UPDATE, 낙관적 락, 비관적 락 중 하나를 상황에 맞게 선택해야 한다.

이 지점에서 중요한 것은 “무조건 어떤 기술을 쓴다”가 아니라, **재고 정합성과 처리량 사이의 균형을 어떻게 잡을 것인가**다.

---

## 7. 오프라인 POS와 idempotency key

편의점 점포 시스템에서는 네트워크가 항상 안정적이라고 가정하기 어렵다.

점포 POS가 일시적으로 서버와 연결되지 않을 수 있다. 하지만 네트워크가 잠깐 불안정하다고 해서 모든 판매를 중단하기는 어렵다.

그래서 POS는 판매 이벤트를 로컬에 저장했다가, 네트워크가 복구되면 서버로 다시 전송하는 구조를 가질 수 있다.

이때 문제가 되는 것은 중복 전송이다.

예를 들어 다음 상황을 생각해보자.

```text
1. POS가 판매 이벤트 S-1001을 서버로 전송한다.
2. 서버는 정상 처리했지만 응답 중 네트워크가 끊긴다.
3. POS는 실패했다고 판단하고 같은 이벤트 S-1001을 다시 전송한다.
4. 서버가 이를 새로운 이벤트로 처리하면 재고가 두 번 차감된다.
```

이 문제를 막기 위해 `idempotency_key`가 필요하다.

idempotency는 같은 요청이 여러 번 들어와도 결과가 한 번 처리된 것과 같도록 만드는 성질이다.

POS 판매 이벤트에서는 다음과 같은 값을 idempotency key로 사용할 수 있다.

```text
pos_terminal_id + receipt_number + sold_at
```

또는 POS 시스템에서 생성한 고유 판매 이벤트 ID를 사용할 수도 있다.

StockMovement에 `idempotency_key`를 저장하면, 같은 이벤트가 다시 들어왔을 때 중복 처리를 막을 수 있다.

```text
이미 처리된 idempotency_key
→ 재고 차감하지 않음
→ 기존 처리 결과 반환 또는 중복 이벤트로 무시
```

이 구조는 개발운영 관점에서 중요하다.

네트워크 장애나 재시도는 운영 환경에서 충분히 발생할 수 있기 때문이다. 따라서 대규모 재고 시스템에서는 “정상 요청”뿐 아니라 “중복 요청, 지연 요청, 재전송 요청”도 고려해야 한다.

---

## 8. 재고 조정과 실사

실제 재고는 시스템 재고와 항상 일치하지 않을 수 있다.

이유는 다양하다.

```text
도난
파손
폐기 누락
입고 검수 오류
POS 처리 실수
수기 조정
네트워크 장애
점포 간 이동 오류
```

따라서 대규모 재고 시스템에서는 재고 실사와 조정 기능이 필요하다.

예를 들어 시스템상 재고는 10개인데 실제 매장에는 7개만 있다면, 관리자는 재고를 -3 조정해야 한다.

이때 단순히 InventoryBalance의 수량만 바꾸면 안 된다. 왜 조정했는지 기록해야 한다.

```text
stock_movements
- movement_type = ADJUSTMENT_MINUS
- quantity_delta = -3
- reason = "실사 결과 재고 불일치"
- occurred_at = 2026-07-08 22:00
```

이렇게 기록하면 나중에 재고가 왜 줄었는지 추적할 수 있다.

MVP에서는 판매와 입고만 다뤘지만, 실제 운영에서는 조정과 실사가 매우 중요하다.

재고 시스템은 결국 현실 세계의 상품 수량을 소프트웨어로 표현하는 시스템이다. 현실 세계에서는 분실, 파손, 폐기, 실수 같은 일이 발생하기 때문에, 시스템도 이를 보정할 수 있는 구조를 가져야 한다.

---

## 9. 대규모 Inventory 테이블 구조 예시

지금까지의 내용을 바탕으로 대규모 Inventory 구조를 단순화해보면 다음과 같다.

```text
products
- id
- name
- category
- status

stores
- id
- name
- region
- status

inventory_balances
- store_id
- product_id
- on_hand_quantity
- reserved_quantity
- available_quantity
- safety_stock
- version
- updated_at

stock_movements
- id
- store_id
- product_id
- movement_type
- quantity_delta
- source_type
- source_id
- idempotency_key
- occurred_at
- created_at

inventory_reservations
- id
- store_id
- product_id
- order_id
- quantity
- status
- expires_at
- created_at
- updated_at

customer_inventory_view
- store_id
- product_id
- availability_status
- display_quantity_range
- last_synced_at

inventory_snapshots
- store_id
- product_id
- snapshot_date
- opening_quantity
- closing_quantity
```

각 테이블의 역할은 다음과 같다.

| 테이블 | 역할 |
| --- | --- |
| products | 상품 기준 정보 |
| stores | 점포 기준 정보 |
| inventory_balances | 현재 재고 상태 |
| stock_movements | 재고 변동 이력 |
| inventory_reservations | 예약/홀드 재고 |
| customer_inventory_view | 고객 앱 조회용 재고 상태 |
| inventory_snapshots | 일자별 재고 스냅샷 |

MVP에서는 이 중 일부만 구현했다.

```text
MVP 구현
- stores
- products
- inventories
- sales
- receipts
- order_recommendations
```

대규모로 확장한다면 다음과 같이 바꿀 수 있다.

```text
inventories → inventory_balances
sales/receipts → stock_movements로 일반화
customer API → customer_inventory_view 또는 Redis 캐시 사용
reservation → 픽업/예약 주문 기능과 연결
order recommendation → stock_movements와 inventory_snapshots 기반 분석
```

이렇게 보면 현재 MVP는 대규모 구조의 축소판이라고 볼 수 있다.

---

## 10. MVP와 대규모 설계 비교

현재 MVP와 대규모 확장 구조를 비교하면 다음과 같다.

| 관점 | MVP 구조 | 대규모 확장 구조 |
| --- | --- | --- |
| 현재 재고 | inventories.quantity | inventory_balances |
| 재고 이력 | sales, receipts | stock_movements |
| 예약 재고 | 없음 | inventory_reservations |
| 고객 조회 | Inventory 직접 조회 | customer_inventory_view + cache |
| 동시성 제어 | 트랜잭션, 음수 방지 | 조건부 UPDATE, 락, version |
| 중복 이벤트 처리 | 없음 | idempotency_key |
| 실사/조정 | 없음 | adjustment movement |
| 분석/발주 | Sale 이력 기반 단순 계산 | movement, snapshot, sales history 기반 분석 |

이 비교를 통해 MVP가 어떤 점을 단순화했고, 대규모 시스템에서는 어떤 부분을 보강해야 하는지 명확히 볼 수 있다.

중요한 것은 MVP가 부족하다는 뜻이 아니다.

MVP는 의도적으로 단순화한 구조다. 프로젝트의 목적은 대규모 운영 시스템을 완전히 재현하는 것이 아니라, 핵심 흐름을 이해하고 구현하는 것이었다.

다만 MVP 이후의 확장 방향을 고민함으로써, 내가 만든 구조의 한계와 발전 가능성을 함께 이해할 수 있었다.

---

## 11. 이번 고민을 통해 얻은 것

이 글을 정리하면서 Inventory 설계가 단순히 수량 컬럼 하나의 문제가 아니라는 것을 더 명확히 이해하게 되었다.

재고 시스템의 핵심은 다음 다섯 가지라고 생각한다.

```text
1. 현재 재고를 빠르게 알 수 있어야 한다.
2. 재고가 왜 변했는지 추적할 수 있어야 한다.
3. 동시에 판매/예약이 들어와도 초과 판매가 발생하면 안 된다.
4. 고객 앱에는 빠르고 안전한 조회 결과를 제공해야 한다.
5. 장애나 중복 이벤트가 발생해도 원인을 추적하고 보정할 수 있어야 한다.
```

MVP에서는 Inventory를 단일 기준 데이터로 두고, Sale과 Receipt 이력을 통해 판매/입고 흐름을 추적했다.

하지만 대규모 시스템에서는 역할을 더 세분화할 필요가 있다.

```text
StockMovement
→ 재고 변동의 이유와 이력

InventoryBalance
→ 현재 재고 상태

Reservation
→ 예약 또는 홀드된 재고

CustomerAvailabilityView
→ 고객 앱 조회용 가공 데이터

Cache/Search
→ 빠른 조회를 위한 파생 데이터
```

이 구조를 이해하면, 왜 실제 운영 시스템에서 단순 CRUD보다 데이터 정합성, 이벤트 처리, 캐시 무효화, 장애 복구가 중요한지 더 잘 보인다.

---

## 12. 포트폴리오에 어떻게 정리할 수 있을까

이 고민은 포트폴리오에서도 짧게 정리할 수 있다.

예를 들어 다음과 같이 쓸 수 있다.

```text
MVP에서는 Inventory를 단일 기준 데이터로 두어 POS/PDA/고객/관리자 기능이 하나의 재고 흐름으로 연결되도록 구현했습니다. 다만 실제 대규모 운영 시스템에서는 판매, 입고, 폐기, 반품, 조정 등 다양한 재고 변동 사유를 추적해야 하므로 StockMovement 원장과 InventoryBalance를 분리하는 구조로 확장할 수 있다고 정리했습니다. 또한 예약 재고, 고객 조회용 AvailabilityView, Redis 캐시 무효화, 동시 판매 제어, idempotency key까지 고려하며 MVP 이후의 확장 방향을 고민했습니다.
```

이 문장은 내가 구현한 프로젝트의 범위를 솔직하게 인정하면서도, 실제 규모에서 고려해야 할 문제를 이해하고 있다는 점을 보여준다.

학습용 프로젝트에서 중요한 것은 “내가 실제 기업 시스템을 그대로 만들었다”가 아니다. 중요한 것은 작은 프로젝트를 통해 업무 흐름을 이해했고, 그 흐름이 커졌을 때 어떤 문제가 생길 수 있는지 고민해봤다는 점이다.

---

## 13. 정리

이번 글에서는 StoreOps Platform의 MVP Inventory 구조를 출발점으로, 확장형 Inventory 설계를 어떻게 확장할 수 있을지 고민해보았다.

핵심 내용은 다음과 같다.

```text
1. MVP에서는 inventories.quantity를 단일 기준 데이터로 두었다.
2. POS 판매는 재고 감소와 Sale 이력 저장으로 처리했다.
3. PDA 입고는 재고 증가와 Receipt 이력 저장으로 처리했다.
4. 대규모 시스템에서는 재고 변동 사유가 많아지므로 StockMovement 원장이 필요할 수 있다.
5. 현재 재고를 빠르게 조회하기 위해 InventoryBalance를 둘 수 있다.
6. 픽업 예약이나 주문을 고려하면 Reservation과 reserved_quantity가 필요하다.
7. 고객 앱에는 정확한 수량보다 Availability 상태값을 제공하는 것이 더 안전할 수 있다.
8. 고객 조회 트래픽이 많아지면 CustomerAvailabilityView와 Redis 캐시를 활용할 수 있다.
9. 동시 판매를 막기 위해 조건부 UPDATE, 낙관적 락, 비관적 락을 고려할 수 있다.
10. 오프라인 POS나 재시도 상황을 위해 idempotency key가 필요할 수 있다.
11. 실사와 재고 조정을 위해 모든 변동은 원장에 남기는 것이 좋다.
```

결국 대규모 Inventory 설계의 핵심은 단순히 수량을 저장하는 것이 아니다.

```text
현재 재고를 빠르게 보여주는 것
재고 변경 이유를 추적하는 것
초과 판매를 막는 것
고객에게 안전한 조회 결과를 제공하는 것
장애나 중복 이벤트에도 복구 가능한 구조를 만드는 것
```

이 모든 것을 함께 고려해야 한다.

내가 만든 MVP는 이 구조의 가장 작은 버전이다.

```text
Inventory = 현재 재고
Sale = 판매로 인한 재고 감소 이력
Receipt = 입고로 인한 재고 증가 이력
Customer API = 고객 조회
Admin API = 운영 조회
```

이번 프로젝트를 통해 재고 시스템의 기본 흐름을 구현했고, 이번 글을 통해 그 구조가 대규모 시스템에서는 어떻게 확장될 수 있을지 고민해볼 수 있었다.

앞으로 프로젝트를 더 발전시킨다면 가장 먼저 적용해보고 싶은 것은 다음 세 가지다.

```text
1. Sale/Receipt를 StockMovement로 일반화하기
2. Inventory에 @Version을 적용해 낙관적 락 실험하기
3. 고객 재고조회용 CustomerAvailabilityView와 캐시 무효화 전략 설계하기
```

이 세 가지를 추가하면 현재 MVP는 단순 재고 CRUD를 넘어, 실제 운영 시스템의 고민을 더 많이 담은 프로젝트로 발전할 수 있을 것이다.
---

**시리즈 이어보기**  
이전 글: [3. 재고 정합성을 위한 POS 판매·PDA 입고 트랜잭션 구현](/posts/storeops-inventory-transaction/) | [전체 글 목록](/storeops/)

