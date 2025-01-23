---
title: "[C#][Server] 6. Listener와 Session 구조의 리팩토링"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: Listener와 Session 구조의 리팩토링**

---

## 1. 진행 상황

- `Listener` 클래스에서 세션 생성을 동적으로 처리하도록 구조를 리팩토링하였다.
- 기존의 `Action<Socket>` 방식 대신 `Func<Session>`을 사용하여, `Listener`와 `Session` 간의 의존성을 줄이고 확장성을 높였다.
- `Session` 클래스에 다음과 같은 네 가지 새로운 메서드를 추가하여 네트워크 이벤트를 처리할 수 있도록 개선하였다:
    1. `OnConnected(EndPoint endPoint)`
    2. `OnRecv(ArraySegment<byte> buffer)`
    3. `OnSend(int numOfBytes)`
    4. `OnDisconnected(EndPoint endPoint)`

---

## 2. 주요 변경 사항

### **1) Listener 클래스**

#### 변경 전:

기존에는 `Listener` 클래스가 소켓 연결을 처리할 때, `Action<Socket>` 델리게이트를 통해 클라이언트 소켓을 단순히 전달하였다.

```csharp
Action<Socket> _onAcceptHandler;

public void Init(IPEndPoint endPoint, Action<Socket> onAcceptHandler)
{
    _onAcceptHandler += onAcceptHandler;
    _listenSocket.Bind(endPoint);
}

// 클라이언트 소켓을 직접 전달
_onAcceptHandler.Invoke(args.AcceptSocket);
```

#### 변경 후:

`Func<Session>`을 활용하여 세션 객체를 동적으로 생성하도록 변경되었다.

```csharp
Func<Session> _sessionFactory;

public void Init(IPEndPoint endPoint, Func<Session> sessionFactory)
{
    _sessionFactory += sessionFactory;
    _listenSocket.Bind(endPoint);
}

// 세션 생성 및 초기화
Session session = _sessionFactory.Invoke();
session.Start(args.AcceptSocket);
session.OnConnected(args.AcceptSocket.RemoteEndPoint);
```

#### 개선점:

1. **유연성 증가**: `Func<Session>`을 사용하여 세션 객체의 생성 방식을 외부에서 결정할 수 있다.
2. **책임 분리**: `Listener` 클래스는 세션 생성과 초기화에 대한 책임을 외부로 위임하여 역할이 단순화되었다.

---

### **2) Program 클래스**

#### 변경 전:

`Program` 클래스에서 직접 소켓 처리를 담당.

```csharp
static void Main(string[] args)
{
    Listener listener = new Listener();
    listener.Init(endPoint, OnAcceptHandler);
}
```

#### 변경 후:

`Session`을 상속받는 `GameSession` 클래스를 정의하여, 프로그램이 특정 세션 로직을 처리할 수 있도록 개선되었다.

```csharp
class GameSession : Session
{
    public override void OnConnected(EndPoint endPoint)
    {
        Console.WriteLine($"Client connected: {endPoint}");
    }
}

static void Main(string[] args)
{
    Listener listener = new Listener();
    listener.Init(endPoint, () => new GameSession());
}
```

#### 개선점:

1. **확장성 강화**: `Session`을 상속받아 다양한 세션 동작을 정의할 수 있다.
2. **캡슐화 강화**: 세션 처리 로직이 `Program`에서 분리되어 더 명확해졌다.

---

### **3) Session 클래스**

#### 추가된 기능:

- **`OnConnected` 메서드**: 클라이언트가 연결되었을 때의 동작을 정의하는 메서드가 추가되었다.

```csharp
public virtual void OnConnected(EndPoint endPoint)
{
    Console.WriteLine($"Connected to: {endPoint}");
}
```

- **`OnRecv` 메서드**: 데이터를 수신했을 때의 동작을 정의하는 메서드가 추가되었다.

```csharp
public virtual void OnRecv(ArraySegment<byte> buffer)
{
    string receivedData = Encoding.UTF8.GetString(buffer.Array, buffer.Offset, buffer.Count);
    Console.WriteLine($"Received: {receivedData}");
}
```

- **`OnSend` 메서드**: 데이터를 송신했을 때 호출되는 메서드가 추가되었다.

```csharp
public virtual void OnSend(int numOfBytes)
{
    Console.WriteLine($"Sent {numOfBytes} bytes.");
}
```

- **`OnDisconnected` 메서드**: 클라이언트와의 연결이 종료되었을 때 호출되는 메서드가 추가되었다.

```csharp
public virtual void OnDisconnected(EndPoint endPoint)
{
    Console.WriteLine($"Disconnected from: {endPoint}");
}
```

#### 추가된 기능:

- **`OnConnected` 메서드**: 클라이언트가 연결되었을 때의 동작을 정의하는 메서드가 추가되었다.

```csharp
public virtual void OnConnected(EndPoint endPoint)
{
    Console.WriteLine($"Connected to: {endPoint}");
}
```

#### 개선점:

- **커스터마이징 가능**: `Session` 클래스를 상속받아 각기 다른 연결 동작을 정의할 수 있다.
- **책임 분리**: 연결 이벤트 처리가 개별 세션으로 위임되어 유지보수가 용이해졌다.

---

## 3. 개선 효과

1. **코드 가독성 향상**: `Listener`와 `Session`의 역할이 명확히 분리되어 각 클래스의 책임이 분명해졌다.
2. **확장성 증가**: 세션 생성 방식을 외부로 위임하여 새로운 세션 동작을 쉽게 추가할 수 있다.
3. **재사용성 강화**: `Session` 클래스를 상속받아 다양한 로직을 캡슐화할 수 있다.

---

## 4. 마무리

서버 엔진(ServerCore 프로젝트)에서 다뤄야 하는 **네트워크 통신 관련 코드들**과 서버(Server 프로젝트)에서 다루게 될 **게임 컨텐츠 관련 코드**를 구분해야, 유지보수와 협업이 쉽다.