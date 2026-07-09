---
title: "[StoreOps] 3. 재고 정합성을 위한 POS 판매·PDA 입고 트랜잭션 구현"
categories:
  - Project
  - StoreOps
tags:
  - StoreOps
  - 편의점 운영
  - Spring Boot
  - Transaction
  - Inventory
toc: true
toc_sticky: true
permalink: /posts/storeops-inventory-transaction/
excerpt: "POS 판매와 PDA 입고에서 재고 변경과 이력 저장을 하나의 트랜잭션으로 묶고 Inventory 도메인 규칙으로 정합성을 지키는 과정을 정리합니다."
---

> **StoreOps Platform 시리즈**  
> - [1편: 프로젝트 배경](/posts/storeops-project-background/)
> - [2편: 도메인 설계](/posts/storeops-domain-design/)
> - 3편: 재고 트랜잭션
> - [4편: 대규모 Inventory 확장](/posts/storeops-inventory-expansion/)
> - [전체 글 목록](/storeops/)

## 1. 이번 글에서 다룰 내용

이전 글에서는 StoreOps Platform의 도메인 모델을 설계하면서, 이 프로젝트의 중심 도메인을 **Inventory**, 즉 점포별 상품 재고로 잡은 이유를 정리했다.

이번 글에서는 그 다음 단계로, 실제 재고가 변경되는 두 가지 핵심 흐름을 구현하면서 고민한 내용을 정리하려고 한다.

두 가지 핵심 흐름은 다음과 같다.

```text
POS 판매 처리 → 재고 감소
PDA 입고 처리 → 재고 증가
```

처음 보기에는 단순히 숫자를 빼고 더하는 기능처럼 보일 수 있다. 하지만 편의점 운영 시스템에서 재고는 고객 앱, POS, PDA, 관리자 화면, 발주 추천이 모두 의존하는 핵심 데이터다.

따라서 재고 변경 로직을 단순한 수량 변경으로만 보면 안 된다고 판단했다.

이번 구현에서 가장 중요하게 본 질문은 다음과 같았다.

```text
판매 이력은 저장됐는데 재고가 줄지 않으면 어떻게 될까?
재고는 줄었는데 판매 이력이 저장되지 않으면 어떻게 될까?
입고 이력은 저장됐는데 재고가 늘지 않으면 어떻게 될까?
재고가 음수가 되는 상황은 어디에서 막아야 할까?
```

이 질문들을 해결하기 위해 POS 판매와 PDA 입고 처리를 각각 하나의 트랜잭션으로 묶고, 재고 증감 규칙은 Inventory 도메인 객체 내부에 두는 방식으로 구현했다.

---

## 2. POS 판매와 PDA 입고가 중요한 이유

StoreOps Platform은 개념적으로 네 종류의 클라이언트를 가진다.

```text
POS
PDA
고객 앱
관리자 WEB
```

이 중 POS와 PDA는 재고 데이터를 직접 변경하는 클라이언트다.

POS는 고객이 상품을 구매했을 때 판매 이벤트를 발생시킨다. 이때 해당 점포의 상품 재고는 줄어야 한다.

PDA는 물류 입고가 발생했을 때 입고 이벤트를 발생시킨다. 이때 해당 점포의 상품 재고는 늘어야 한다.

반면 고객 앱과 관리자 WEB은 재고 데이터를 조회하는 쪽에 가깝다.

```text
POS 판매 → Inventory 감소
PDA 입고 → Inventory 증가
고객 앱 → Inventory 조회
관리자 WEB → Inventory 조회
```

따라서 POS와 PDA에서 발생한 재고 변경이 정확하지 않으면, 고객 앱과 관리자 화면도 잘못된 정보를 보여주게 된다.

예를 들어 고객 앱에서 재고가 있다고 표시되었지만 실제 점포에는 재고가 없다면 고객은 헛걸음을 하게 된다. 반대로 실제 점포에는 상품이 있는데 앱에는 품절로 표시된다면 판매 기회를 잃게 된다.

이런 이유로 POS 판매와 PDA 입고는 이 프로젝트에서 단순 기능이 아니라, 전체 시스템의 신뢰도를 결정하는 핵심 흐름이라고 판단했다.

---

## 3. 재고 정합성이 깨지는 상황

먼저 재고 정합성이 깨질 수 있는 상황을 정리했다.

### 3.1 재고는 줄었는데 판매 이력이 저장되지 않는 경우

POS 판매 처리에서 재고 차감은 성공했지만 판매 이력 저장에 실패하는 상황을 생각해볼 수 있다.

```text
현재 재고: 10개
판매 요청: 2개
재고 차감 성공: 8개
판매 이력 저장 실패
```

이 경우 시스템에는 재고가 8개로 줄어든 결과만 남고, 왜 재고가 줄었는지 추적할 수 없다.

운영 중 관리자가 “왜 이 상품의 재고가 줄었는가?”를 확인하려고 할 때 판매 이력이 없다면 원인 파악이 어렵다.

### 3.2 판매 이력은 저장됐는데 재고가 줄지 않는 경우

반대로 판매 이력은 저장됐지만 재고 차감이 실패하는 경우도 문제가 된다.

```text
현재 재고: 10개
판매 요청: 2개
판매 이력 저장 성공
재고 차감 실패
현재 재고: 여전히 10개
```

이 경우 판매 데이터상으로는 상품이 팔렸지만, 재고는 줄지 않는다.

그러면 고객 앱에서는 실제보다 많은 재고가 표시될 수 있고, 관리자 화면에서도 잘못된 재고 현황을 보게 된다.

### 3.3 입고 이력은 저장됐는데 재고가 늘지 않는 경우

PDA 입고 처리에서도 비슷한 문제가 발생할 수 있다.

```text
현재 재고: 8개
입고 요청: 20개
입고 이력 저장 성공
재고 증가 실패
현재 재고: 여전히 8개
```

이 경우 실제로는 입고가 처리되었지만 시스템 재고에는 반영되지 않는다.

관리자 입장에서는 물류가 들어왔는데 재고가 늘지 않은 것처럼 보이고, 고객 앱에서도 재고 없음으로 표시될 수 있다.

### 3.4 재고가 음수가 되는 경우

가장 기본적이지만 중요한 문제는 재고가 음수가 되는 상황이다.

예를 들어 현재 재고가 1개인데 POS에서 2개 판매 요청이 들어오면, 시스템은 이 요청을 거부해야 한다.

```text
현재 재고: 1개
판매 요청: 2개
결과: 판매 실패
```

만약 단순히 `현재 재고 - 판매 수량`으로 처리하면 재고가 `-1개`가 될 수 있다.

실제 운영 시스템에서 재고가 음수로 내려가는 것은 이후 고객 재고조회, 발주 추천, 관리자 재고 현황에 모두 영향을 줄 수 있다.

따라서 재고 음수 방지는 반드시 도메인 규칙으로 관리해야 한다고 판단했다.

---

## 4. 트랜잭션으로 묶어야 하는 이유

위 문제들의 공통점은 “함께 성공해야 하는 작업이 따로 처리되었을 때” 발생한다는 것이다.

POS 판매 처리는 다음 두 작업이 함께 성공해야 한다.

```text
1. 재고 차감
2. 판매 이력 저장
```

PDA 입고 처리는 다음 두 작업이 함께 성공해야 한다.

```text
1. 재고 증가
2. 입고 이력 저장
```

둘 중 하나만 성공하면 데이터 불일치가 발생한다.

그래서 POS 판매와 PDA 입고는 각각 하나의 트랜잭션으로 처리해야 한다고 판단했다.

Spring에서는 Service 계층의 메서드에 `@Transactional`을 적용해 하나의 작업 단위로 묶을 수 있다. 트랜잭션 안에서 예외가 발생하면, 그 안에서 수행된 DB 변경 작업이 롤백된다.

이 프로젝트에서는 다음 기준으로 트랜잭션 경계를 잡았다.

```text
POS 판매 API 1회 호출 = 하나의 트랜잭션
PDA 입고 API 1회 호출 = 하나의 트랜잭션
```

즉, 판매 요청이 들어오면 재고 차감과 판매 이력 저장이 함께 성공하거나 함께 실패해야 한다. 입고 요청도 마찬가지로 재고 증가와 입고 이력 저장이 함께 성공하거나 함께 실패해야 한다.

---

## 5. Inventory에 재고 증감 규칙을 둔 이유

재고 차감 로직을 구현할 때 또 하나 고민한 부분은 “재고 증감 규칙을 어디에 둘 것인가”였다.

가장 단순한 방식은 Service에서 직접 수량을 수정하는 것이다.

```java
inventory.setQuantity(inventory.getQuantity() - request.quantity());
```

하지만 이 방식은 좋지 않다고 판단했다.

이유는 재고가 음수가 되면 안 된다는 규칙이 Service마다 흩어질 수 있기 때문이다. POS 판매 Service에서도 검사해야 하고, 나중에 재고 조정 기능이 생기면 또 다른 Service에서도 검사해야 한다.

재고 수량은 Inventory의 상태이고, 재고가 음수가 되면 안 된다는 규칙 역시 Inventory의 핵심 규칙이다.

그래서 재고 증감은 Inventory 도메인 객체 내부의 메서드로 처리하기로 했다.

```java
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "inventories",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_inventory_store_product",
                        columnNames = {"store_id", "product_id"}
                )
        }
)
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    public Inventory(Store store, Product product, Integer quantity) {
        validateInitialQuantity(quantity);
        this.store = store;
        this.product = product;
        this.quantity = quantity;
    }

    public void decrease(int quantity) {
        validatePositiveQuantity(quantity);

        if (this.quantity < quantity) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK);
        }

        this.quantity -= quantity;
    }

    public void increase(int quantity) {
        validatePositiveQuantity(quantity);
        this.quantity += quantity;
    }

    private void validatePositiveQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BusinessException(ErrorCode.INVALID_QUANTITY);
        }
    }

    private void validateInitialQuantity(Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new BusinessException(ErrorCode.INVALID_INITIAL_QUANTITY);
        }
    }
}
```

이렇게 설계하면 Service는 “판매 흐름”이나 “입고 흐름”을 조율하고, Inventory는 “재고가 어떻게 변경될 수 있는지”를 책임진다.

즉, 역할이 다음과 같이 나뉜다.

```text
Service → 유스케이스 흐름 조율
Inventory → 재고 변경 규칙 관리
Repository → 데이터 조회와 저장
```

이 구조가 작은 프로젝트에서도 더 명확하다고 판단했다.

---

## 6. POS 판매 처리 구현

POS 판매 API의 처리 흐름은 다음과 같다.

```text
1. 판매 요청 수신
2. 점포 조회
3. 상품 조회
4. 점포별 상품 재고 조회
5. 재고 차감
6. 판매 이력 저장
7. 남은 재고와 판매 결과 응답
```

Service 코드는 다음과 같은 형태로 구현했다.

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class PosSaleService {

    private final InventoryRepository inventoryRepository;
    private final SaleRepository saleRepository;

    @Transactional
    public PosSaleResponse sell(PosSaleRequest request) {
        Inventory inventory = inventoryRepository.findByStoreIdAndProductId(
                        request.storeId(),
                        request.productId()
                )
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.INVENTORY_NOT_FOUND,
                        "해당 점포에 등록된 상품 재고가 없습니다. storeId="
                                + request.storeId()
                                + ", productId="
                                + request.productId()
                ));

        inventory.decrease(request.quantity());

        Sale sale = new Sale(
                inventory.getStore(),
                inventory.getProduct(),
                request.quantity()
        );
        Sale savedSale = saleRepository.save(sale);

        log.info("[POS_SALE] storeId={} productId={} quantity={} remainingStock={}",
                request.storeId(),
                request.productId(),
                request.quantity(),
                inventory.getQuantity()
        );

        return PosSaleResponse.of(savedSale, inventory);
    }
}
```

여기서 중요한 부분은 두 가지다.

첫째, `@Transactional`을 적용했다.

```java
@Transactional
public PosSaleResponse sell(PosSaleRequest request) {
    ...
}
```

둘째, Service에서 직접 수량을 빼지 않고 `inventory.decrease()`를 호출했다.

```java
inventory.decrease(request.quantity());
```

이렇게 하면 판매 수량이 잘못되었거나 재고가 부족한 경우 Inventory 내부에서 예외가 발생하고, 트랜잭션은 롤백된다.

즉, 판매 이력이 저장되기 전에 재고 검증이 실패하면 판매 이력도 저장되지 않는다.

---

## 7. PDA 입고 처리 구현

PDA 입고 API의 처리 흐름은 다음과 같다.

```text
1. 입고 요청 수신
2. 점포 조회
3. 상품 조회
4. 점포별 상품 재고 조회
5. 재고 증가
6. 입고 이력 저장
7. 현재 재고와 입고 결과 응답
```

Service 코드는 다음과 같은 형태로 구현했다.

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class PdaReceiptService {

    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ReceiptRepository receiptRepository;

    @Transactional
    public PdaReceiptResponse receive(PdaReceiptRequest request) {
        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        Inventory inventory = inventoryRepository.findByStoreIdAndProductId(
                        request.storeId(),
                        request.productId()
                )
                .orElseGet(() -> new Inventory(store, product, 0));

        inventory.increase(request.quantity());
        Inventory savedInventory = inventoryRepository.save(inventory);

        Receipt receipt = new Receipt(
                store,
                product,
                request.quantity()
        );
        Receipt savedReceipt = receiptRepository.save(receipt);

        log.info("[PDA_RECEIPT] storeId={} productId={} quantity={} currentStock={}",
                request.storeId(),
                request.productId(),
                request.quantity(),
                savedInventory.getQuantity()
        );

        return PdaReceiptResponse.of(savedReceipt, savedInventory);
    }
}
```

PDA 입고에서는 POS 판매와 달리, 해당 점포에 아직 상품 재고가 없을 수도 있다고 보았다.

예를 들어 신규 상품이 처음 입고되는 경우라면 Inventory가 존재하지 않을 수 있다. 이 경우에는 초기 수량 0의 Inventory를 생성한 뒤 입고 수량만큼 증가시키도록 했다.

```java
Inventory inventory = inventoryRepository.findByStoreIdAndProductId(
                request.storeId(),
                request.productId()
        )
        .orElseGet(() -> new Inventory(store, product, 0));
```

이후 재고 증가는 Inventory의 `increase()` 메서드로 처리했다.

```java
inventory.increase(request.quantity());
```

입고 처리 역시 `@Transactional` 안에서 수행되므로, 입고 이력 저장이나 재고 증가 중 하나가 실패하면 전체 작업이 롤백된다.

---

## 8. 판매 이력과 입고 이력을 남기는 이유

재고만 정확하면 되는 것처럼 보일 수 있지만, 운영 관점에서는 “재고가 왜 변했는지”도 중요하다.

현재 재고만 저장하면 다음과 같은 질문에 답하기 어렵다.

```text
왜 재고가 30개에서 8개로 줄었는가?
오늘 입고가 정상적으로 반영되었는가?
특정 상품의 판매량은 어느 정도인가?
발주 추천은 어떤 판매 데이터를 기준으로 계산되었는가?
```

그래서 이번 프로젝트에서는 현재 재고는 Inventory에 저장하고, 재고가 변한 이유는 Sale과 Receipt 이력으로 남겼다.

```text
Inventory → 현재 재고 상태
Sale → POS 판매로 인한 재고 감소 이력
Receipt → PDA 입고로 인한 재고 증가 이력
```

이 구조는 발주 추천 기능을 구현할 때도 필요하다.

발주 추천은 최근 판매량을 기반으로 계산할 예정이기 때문에, Sale 이력이 있어야 최근 7일 평균 판매량을 구할 수 있다.

즉, 판매 이력은 단순 기록이 아니라 이후 관리자 운영 기능의 기반 데이터가 된다.

---

## 9. 테스트 코드로 검증한 것

재고 변경 로직은 고객 재고조회와 발주 추천의 기반이 되기 때문에 테스트 코드로 검증할 필요가 있다고 판단했다.

이번 단계에서 최소한으로 검증해야 할 테스트는 다음과 같다.

```text
1. POS 판매 성공 시 재고가 감소한다.
2. 재고보다 많은 수량을 판매하려 하면 예외가 발생한다.
3. 판매 실패 시 재고는 기존 수량으로 유지된다.
4. PDA 입고 성공 시 재고가 증가한다.
5. 잘못된 입고 수량은 예외가 발생한다.
```

예를 들어 POS 판매 성공 테스트는 다음과 같이 작성할 수 있다.

```java
@Test
void sellDecreasesInventoryQuantityAndSavesSale() {
    Store store = storeRepository.save(new Store(
            "서초점",
            "서울 서초구",
            StoreStatus.OPEN
    ));
    Product product = productRepository.save(new Product(
            "참치마요 삼각김밥",
            ProductCategory.FOOD,
            1200,
            ProductStatus.ON_SALE
    ));
    inventoryRepository.save(new Inventory(store, product, 10));
    PosSaleRequest request = new PosSaleRequest(store.getId(), product.getId(), 2);

    PosSaleResponse response = posSaleService.sell(request);

    assertThat(response.saleId()).isNotNull();
    assertThat(response.soldQuantity()).isEqualTo(2);
    assertThat(response.remainingQuantity()).isEqualTo(8);
    assertThat(saleRepository.count()).isEqualTo(1);
}
```

재고 부족 테스트는 다음과 같이 작성할 수 있다.

```java
@Test
void sellFailsWhenStockIsInsufficient() {
    Store store = storeRepository.save(new Store(
            "서초점",
            "서울 서초구",
            StoreStatus.OPEN
    ));
    Product product = productRepository.save(new Product(
            "참치마요 삼각김밥",
            ProductCategory.FOOD,
            1200,
            ProductStatus.ON_SALE
    ));
    inventoryRepository.save(new Inventory(store, product, 1));
    PosSaleRequest request = new PosSaleRequest(store.getId(), product.getId(), 2);

    assertThatThrownBy(() -> posSaleService.sell(request))
            .isInstanceOf(BusinessException.class)
            .hasMessage("재고가 부족합니다.");
    assertThat(saleRepository.count()).isZero();
}
```

입고 성공 테스트는 다음과 같이 작성할 수 있다.

```java
@Test
void receiveIncreasesExistingInventoryQuantityAndSavesReceipt() {
    Store store = storeRepository.save(new Store("서초점", "서울 서초구", StoreStatus.OPEN));
    Product product = productRepository.save(new Product(
            "참치마요 삼각김밥",
            ProductCategory.FOOD,
            1200,
            ProductStatus.ON_SALE
    ));
    inventoryRepository.save(new Inventory(store, product, 8));
    PdaReceiptRequest request = new PdaReceiptRequest(store.getId(), product.getId(), 20);

    PdaReceiptResponse response = pdaReceiptService.receive(request);

    assertThat(response.receiptId()).isNotNull();
    assertThat(response.receivedQuantity()).isEqualTo(20);
    assertThat(response.currentQuantity()).isEqualTo(28);
    assertThat(receiptRepository.count()).isEqualTo(1);
}
```

이 테스트들은 단순히 코드가 동작하는지 확인하는 수준을 넘어서, 이 프로젝트에서 가장 중요한 도메인 규칙을 검증한다.

```text
재고는 음수가 되면 안 된다.
판매되면 재고가 줄어야 한다.
입고되면 재고가 늘어야 한다.
실패한 판매는 재고에 영향을 주면 안 된다.
```

---

## 10. 동시 판매 문제는 어떻게 볼 것인가

이번 단계에서는 기본적인 트랜잭션과 재고 음수 방지를 우선 구현했다. 하지만 실제 운영 시스템이라면 동시 판매 문제도 고려해야 한다.

예를 들어 현재 재고가 1개 남았을 때, POS 두 대에서 동시에 같은 상품을 1개씩 판매 요청하는 상황을 생각해볼 수 있다.

```text
현재 재고: 1개

요청 A: 1개 판매
요청 B: 1개 판매
```

두 요청이 동시에 현재 재고 1개를 조회하고 모두 판매 가능하다고 판단하면 재고 정합성이 깨질 수 있다.

이 문제를 해결하기 위한 선택지는 여러 가지다.

```text
1. 낙관적 락을 적용한다.
2. 비관적 락을 적용한다.
3. Redis 분산락을 적용한다.
4. 재고 변경 이벤트를 큐로 직렬화한다.
```

이번 MVP에서는 프로젝트 범위와 기간을 고려해 동시성 제어까지 구현 범위에 포함하지는 않았다. 대신 재고 변경 로직을 Inventory 도메인에 모으고, POS 판매와 PDA 입고를 트랜잭션으로 묶는 것을 우선순위로 두었다.

추후 개선한다면 Inventory에 `@Version`을 추가해 낙관적 락을 적용하는 방식을 먼저 검토할 수 있다.

```java
@Version
private Long version;
```

이 방식은 동시에 같은 Inventory를 수정할 때 버전 충돌을 감지할 수 있어, 과판매 문제를 줄이는 데 도움이 될 수 있다.

이번 프로젝트에서는 동시성 제어를 완성 구현하지는 않았지만, POS 판매가 많은 환경에서는 반드시 고려해야 할 문제임을 설계 기록에 남기기로 했다.

---

## 11. 이번 구현에서 얻은 설계 기준

POS 판매와 PDA 입고를 구현하면서, 단순히 API를 만드는 것보다 다음 기준이 더 중요하다는 것을 정리할 수 있었다.

```text
1. 재고는 여러 클라이언트가 공유하는 기준 데이터다.
2. 재고 변경과 이력 저장은 함께 성공하거나 함께 실패해야 한다.
3. 재고 음수 방지는 Inventory 도메인 자체의 규칙이다.
4. 판매/입고 이력은 운영 중 원인 추적과 발주 추천의 기반 데이터다.
5. 작은 프로젝트라도 트랜잭션 경계를 명확히 잡으면 운영 시스템에 가까운 설계를 할 수 있다.
```

이 기준을 바탕으로 앞으로 고객 재고조회와 관리자 발주 추천 기능을 구현할 수 있다.

고객 재고조회는 Inventory를 조회하고, 관리자 발주 추천은 Inventory와 Sale 이력을 함께 사용하게 된다.

즉, 이번 단계에서 구현한 POS/PDA 흐름은 이후 기능의 기반이 된다.

---

## 12. 정리

이번 글에서는 StoreOps Platform에서 POS 판매와 PDA 입고를 구현하면서, 재고 데이터 정합성을 어떻게 지키려고 했는지 정리했다.

핵심은 다음과 같다.

```text
POS 판매 처리
→ 재고 차감 + 판매 이력 저장을 하나의 트랜잭션으로 처리

PDA 입고 처리
→ 재고 증가 + 입고 이력 저장을 하나의 트랜잭션으로 처리

Inventory 도메인
→ decrease(), increase() 메서드로 재고 증감 규칙 관리

테스트 코드
→ 판매 성공, 재고 부족 실패, 입고 성공 검증
```

이번 구현에서 가장 중요하게 생각한 점은, 재고 변경이 단순 숫자 변경이 아니라는 것이다.

편의점 운영 시스템에서 재고는 고객 앱, POS, PDA, 관리자 WEB을 연결하는 핵심 데이터다. 따라서 재고가 잘못 변경되면 고객 경험과 점포 운영 모두에 영향을 줄 수 있다.

그래서 판매와 입고를 구현할 때도 “일단 동작하는 API”가 아니라, 데이터 정합성과 운영 추적 가능성을 우선으로 고려했다.

다음 글에서는 이 재고 데이터를 기반으로 고객이 상품별 점포 재고를 조회하는 기능과, 관리자가 결품 위험 및 발주 추천을 확인하는 기능을 구현한 과정을 정리할 예정이다.
---

**시리즈 이어보기**  
이전 글: [2. POS/PDA/고객 앱/관리자 WEB을 잇는 도메인 설계](/posts/storeops-domain-design/) | [전체 글 목록](/storeops/) | 다음 글: [4. MVP 재고 시스템을 확장 가능한 Inventory 구조로 발전시켜보기](/posts/storeops-inventory-expansion/)

