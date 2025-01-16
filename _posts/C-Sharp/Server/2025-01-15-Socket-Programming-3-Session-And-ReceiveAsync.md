---
title: "[C#][Server] 3. 비동기 Receive와 Session 클래스 구현"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: 비동기 Receive와 Session 클래스 구현**

이번 시간에는 `Session` 클래스를 도입하고, `Receive` 기능을 비동기(non-blocking) 방식으로 변경하였다.

---

## 1. 진행 상황

- `Session` 클래스를 추가하여 연결 관리 및 통신을 모듈화하였다.
- 데이터 수신을 비동기 방식으로 처리하도록 `ReceiveAsync()`를 사용하였다.
- `Disconnect()`를 멀티스레드 환경에서도 안전하게 처리하기 위한 방안을 적용하였다.

---

## 2. `Session` 클래스 개념 및 역할

`Session`은 클라이언트와의 연결을 담당하며 데이터 송수신 및 연결 해제를 관리하는 클래스이다.

### **주요 역할**

- **연결 관리**: 클라이언트 소켓을 보관하고 통신을 시작한다.
- **데이터 수신**: 비동기 방식으로 클라이언트로부터 데이터를 수신한다.
- **데이터 송신**: 클라이언트로 데이터를 전송한다.
- **연결 해제**: 안전하게 연결을 종료한다.

### **Session이란?**
클라이언트 내의 서비스 요구 처리 프로그램과 서버 내의 서비스 응답 처리 프로그램 사이에 링크가 설정되는 것. 네트워크 입장에서 보면, 두 사용자 사이에서 서비스 구현을 위하여 필요한 자원을 하나로 모을 수 있는 연결을 의미한다. (출처: 네이버 국어사전)

---

## 3. 코드 분석

### `Session` 클래스 코드

```csharp
using System;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace ServerCore
{
    class Session
    {
        Socket _socket;
        int _disconnected = 0;

        public void Start(Socket socket)
        {
            _socket = socket;
            SocketAsyncEventArgs recvArgs = new SocketAsyncEventArgs();
            recvArgs.Completed += new EventHandler<SocketAsyncEventArgs>(OnRecvCompleted);
            recvArgs.SetBuffer(new byte[1024], 0, 1024);

            RegisterRecv(recvArgs);
        }

        public void Send(byte[] sendBuff)
        {
            _socket.Send(sendBuff);
        }

        public void Disconnect()
        {
            if (Interlocked.Exchange(ref _disconnected, 1) == 1)
                return;
            _socket.Shutdown(SocketShutdown.Both);
            _socket.Close();
        }

        #region 네트워크 통신
        void RegisterRecv(SocketAsyncEventArgs args)
        {
            args.AcceptSocket = null;
            bool pending = _socket.ReceiveAsync(args);
            if (!pending)
                OnRecvCompleted(null, args);
        }

        void OnRecvCompleted(object sender, SocketAsyncEventArgs args)
        {
            if (args.BytesTransferred > 0 && args.SocketError == SocketError.Success)
            {
                try
                {
                    string recvData = Encoding.UTF8.GetString(args.Buffer, args.Offset, args.BytesTransferred);
                    Console.WriteLine($"[From Client] {recvData}");
                    RegisterRecv(args);
                }
                catch (Exception e)
                {
                    Console.WriteLine($"OnRecvCompleted Failed: {e}");
                }
            }
            else
            {
                Disconnect();
            }
        }
        #endregion
    }
}
```

### `Program` 클래스 수정

서버가 클라이언트 연결을 수락하면 `Session` 객체를 생성해 `Start()`를 호출하여 통신을 시작한다.

```csharp
static void OnAcceptHandler(Socket clientSocket)
{
    try
    {
        Session session = new Session();
        session.Start(clientSocket);

        byte[] sendBuff = Encoding.UTF8.GetBytes("Welcome to Server !");
        session.Send(sendBuff);

        session.Disconnect();
        session.Disconnect(); // 두 번 호출해도 안전하게 처리된다.
    }
    catch (Exception e)
    {
        Console.WriteLine($"서버 오류: {e}");
    }
}
```

---

## 4. 주요 개념 설명

### **`SocketAsyncEventArgs`****와 주요 속성**

- **`Buffer`**: 수신 또는 송신 데이터를 저장하는 바이트 배열이다.
- **`Offset`**: 버퍼 내에서 실제 데이터가 저장되기 시작하는 위치를 나타낸다.
- **`BytesTransferred`**: 송신 또는 수신된 실제 바이트 수를 나타낸다.

### **`UserToken`**

- 현재 프로젝트에선 사용되지 않았지만, `SocketAsyncEventArgs`에 `UserToken`을 설정하여 추가 데이터를 저장할 수 있다.
- 주로 `Session` 객체 참조를 저장하여 비동기 작업 완료 시 해당 세션을 식별하는 데 사용된다.

---

## 5. 멀티스레드 환경에서의 `Disconnect` 문제와 해결 방안

### **에러 상황**

연결 해제를 두 번 이상 호출하면 다음과 같은 오류가 발생할 수 있다.

```
서버 오류: System.ObjectDisposedException: Cannot access a disposed object.
Object name: 'System.Net.Sockets.Socket'.
```

### **해결 방법 1: 간단하지만 안전하지 않음**

```csharp
public void Disconnect()
{
    if (_socket == null)
        return;
    _socket.Shutdown(SocketShutdown.Both);
    _socket.Close();
    _socket = null;
}
```

- 단일 스레드 환경에서는 동작하지만, 멀티스레드 환경에서는 안전하지 않다.

### **해결 방법 2: ****`Interlocked`****를 사용한 스레드 안전성 확보**

```csharp
public void Disconnect()
{
    if (Interlocked.Exchange(ref _disconnected, 1) == 1)
        return;
    _socket.Shutdown(SocketShutdown.Both);
    _socket.Close();
}
```

- `Interlocked.Exchange`를 사용하여 `_disconnected` 값이 이미 1이면 연결 해제를 건너뛴다.
- 이를 통해 멀티스레드 환경에서도 안전한 연결 해제가 가능하다.

### **`Interlocked.Exchange`란?**

- `Interlocked.Exchange(ref 변수, 값)`는 멀티스레드 환경에서 atomic하게 변수의 값을 변경한다.

- 해당 메서드는 `ref`로 전달된 변수의 기존 값을 반환하며, 변경 작업을 한 번에 처리하므로 레이스 컨디션을 방지할 수 있다.

---

## 6. 실행 결과

### **서버 콘솔 출력**

```
서버가 클라이언트를 기다리고 있습니다...
[From Client] Hello World! 0
[From Client] Hello World! 1Hello World! 2Hello World! 3Hello World! 4
[From Client] Hello World! 0Hello World! 1Hello World! 2Hello World! 3Hello World! 4
...
```

### **클라이언트 콘솔 출력**

```
서버 [~~~~]:7777에 연결됨
[From Server] Welcome to Server !
서버 [~~~~]:7777에 연결됨
[From Server] Welcome to Server !
...
```

---

## 7. 마무리

`Session` 클래스를 통한 비동기 소켓 프로그래밍으로 안정적이고 효율적인 클라이언트 연결 관리가 가능해졌다. 멀티스레드 환경에서는 `Interlocked`를 사용해 레이스 컨디션을 방지할 수 있다. 다음에는 Send를 비동기 방식으로 분리할 것이다.