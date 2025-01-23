---
title: "[C#][Server] 7. 비동기 Connect와 Connector 클래스 구현"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: 비동기 Connect와 Connector 클래스 구현**

---

## 1. 진행 상황

- `Connector` 클래스를 구현하여 클라이언트가 서버와 비동기적으로 연결을 시도하도록 설계하였다.
- 소켓 연결 완료 시, 세션 객체를 생성하고 초기화하도록 로직을 구성하였다.
- `SocketAsyncEventArgs`를 활용해 연결 상태를 관리하고, 연결 이벤트를 처리하였다.

---

## 2. 주요 변경 사항

### **1) Connector 클래스**

#### **구조 및 역할**

- **역할**: 클라이언트 소켓을 생성하고 서버와 연결을 시도하며, 연결이 완료되면 세션을 초기화한다.
- **구성**:
    - `Connect()`: 클라이언트 소켓을 생성하고 비동기 연결을 시작.
    - `RegisterConnect()`: `SocketAsyncEventArgs`를 사용해 연결 상태를 처리.
    - `OnConnectCompleted()`: 연결이 완료되면 세션을 생성하고 초기화.

#### **코드 예시**

```csharp
public class Connector
{
    Func<Session> _sessionFactory;

    public void Connect(IPEndPoint endPoint, Func<Session> sessionFactory)
    {
        Socket socket = new Socket(endPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
        _sessionFactory = sessionFactory;

        SocketAsyncEventArgs args = new SocketAsyncEventArgs();
        args.Completed += OnConnectCompleted;
        args.RemoteEndPoint = endPoint;
        args.UserToken = socket;

        RegisterConnect(args);
    }

    void RegisterConnect(SocketAsyncEventArgs args)
    {
        Socket socket = args.UserToken as Socket;
        if (socket == null)
            return;

        bool pending = socket.ConnectAsync(args);
        if (!pending)
            OnConnectCompleted(null, args);
    }

    void OnConnectCompleted(object sender, SocketAsyncEventArgs args)
    {
        if (args.SocketError == SocketError.Success)
        {
            Session session = _sessionFactory.Invoke();
            session.Start(args.ConnectSocket);
            session.OnConnected(args.RemoteEndPoint);
        }
        else
        {
            Console.WriteLine($"OnConnectCompleted Fail: {args.SocketError}");
        }
    }
}
```

### **2) GameSession 클래스**

#### **역할**

- Session을 상속 받아 게임 컨텐츠에 해당하는 내용이 담기게 될 클래스이다.
- 현재는 빈 깡통이다.

#### **구성 요소**

- **`OnConnected`**: 서버와 연결되었을 때 메시지를 전송하고 연결을 종료.
- **`OnDisconnected`**: 서버와의 연결이 끊어졌을 때 호출.
- **`OnRecv`**: 서버로부터 데이터를 수신했을 때 처리.
- **`OnSend`**: 데이터를 송신했을 때 호출.

#### **코드 예시**

```csharp
class GameSession : Session
{
    public override void OnConnected(EndPoint endPoint)
    {
        Console.WriteLine($"OnConnected: {endPoint}");

        for (int i = 0; i < 5; i++)
        {
            byte[] sendBuff = Encoding.UTF8.GetBytes($"Hello World! {i}");
            Send(sendBuff);
        }
        Disconnect();
    }

    public override void OnDisconnected(EndPoint endPoint)
    {
        Console.WriteLine($"OnDisconnected: {endPoint}");
    }

    public override void OnRecv(ArraySegment<byte> buffer)
    {
        string recvData = Encoding.UTF8.GetString(buffer.Array, buffer.Offset, buffer.Count);
        Console.WriteLine($"[From Server] {recvData}");
    }

    public override void OnSend(int numOfBytes)
    {
        Console.WriteLine($"Transferred bytes: {numOfBytes}");
    }
}
```

---

## 3. 실행 결과

### **클라이언트 실행 결과**

```
OnConnected: [~~~~]:7777
Transferred bytes: 14
Transferred bytes: 14
Transferred bytes: 14
Transferred bytes: 14
Transferred bytes: 14
OnDisconnected: [~~~~]:7777
```

### **서버 실행 결과**

```
서버가 클라이언트를 기다리고 있습니다...
OnConnected: [~~~~]:55257
[From Client] Hello World! 0
[From Client] Hello World! 1Hello World! 2Hello World! 3Hello World! 4
OnDisconnected: [~~~~]:55257
```

---

## 4. 개선 효과

1. **재사용성 향상**: `Connector` 클래스를 통해 여러 서버에 동시 연결이 가능.
2. **확장성 증가**: `Func<Session>`을 사용해 다양한 세션 동작을 쉽게 정의.
3. **가독성 강화**: 비동기 연결 처리와 세션 초기화를 분리하여 코드 구조를 명확히 함.

---

## 5. 마무리

네트워크 통신의 Connect또한 비동기 방식으로 작동하도록 Connector 클래스를 구현하였다. 서버와 클라이언트의 통신에서 사용될 수도 있지만, 나아가 분산 서버를 사용하여 서버끼리 통신할 때도 사용될 수 있겠다.


---
## 6. 프로젝트의 라이브러리 변경 및 참조 관리 방법
추가로 프로젝트를 라이브러리로 변경하고 참조하는 법에 대해 작성했다.

### 프로젝트를 클래스 라이브러리로 변경

1. 클래스 라이브러리로 변경하고 싶은 프로젝트의 속성 창을 연다.
   ![](../../../assets/images/C-sharp/Server/2025-01-22-Socket-Programming-7-Connector-And-ConnectAsync/1-1.%20Class%20Library.png)
2. 애플리케이션 > 일반 > 출력 유형 > **클래스 라이브러리**로 설정
   ![](../../../assets/images/C-sharp/Server/2025-01-22-Socket-Programming-7-Connector-And-ConnectAsync/1-2.%20Class%20Library.png)
3. 클래스 라이브러리로 변경된 프로젝트를 실행해보면 시작할 수 없다고 뜬다.
   ![](../../../assets/images/C-sharp/Server/2025-01-22-Socket-Programming-7-Connector-And-ConnectAsync/1-3.%20Class%20Library.png)
  
### 프로젝트에서 클래스 라이브러리 참조하기
1. 프로젝트 우클릭 > 추가 > 프로젝트 참조
   ![](../../../assets/images/C-sharp/Server/2025-01-22-Socket-Programming-7-Connector-And-ConnectAsync/2-1%20Reference.png)
2. 참조하고 싶은 프로젝트 체크 (여기선 ServerCore)
   ![](../../../assets/images/C-sharp/Server/2025-01-22-Socket-Programming-7-Connector-And-ConnectAsync/2-2%20Reference.png)

진짜 끝.