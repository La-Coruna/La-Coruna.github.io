---
title: "[C#][Server] 2. Non-Blocking 함수를 이용한 소켓 프로그래밍"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: 비동기 Accept와 Listener 클래스 구현**

이번 시간에는 `Listener` 클래스를 도입하고, `Accept` 기능을 비동기(non-blocking) 방식으로 변경하였다.

---

## 1. 진행 상황

- Listener 클래스 추가: 소켓의 listen() 역할을 처리하는 Listener 클래스를 통해 코드의 모듈화.

- 비동기 Accept 처리: AcceptAsync()와 SocketAsyncEventArgs를 사용하여 비동기 연결 수락 방식을 도입.

---

## 2. 비동기 리스너의 핵심 개념

### **비동기 방식의 Accept**

- `AcceptAsync()`를 사용하여 클라이언트 연결 요청을 비동기적으로 처리힌다.
- 이벤트 기반 콜백 구조를 사용하여 요청과 완료 시점을 분리할 수 있다.

### **Listener 객체**

`Listener` 클래스는 서버의 `listen()` 역할을 담당하는 객체이다.

- **역할**: 클라이언트의 연결 요청을 받고 이를 처리하는 핸들러를 호출한다.
- **비동기 처리**: `SocketAsyncEventArgs`를 사용하여 비동기 `Accept` 작업을 관리한다.

---

## 3. 코드 분석

### **1) 클라이언트 코드 (DummyClient)**

```csharp
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace DummyClient
{
    internal class Program
    {
        static void Main(string[] args)
        {
            string host = Dns.GetHostName();
            IPHostEntry ipHost = Dns.GetHostEntry(host);
            IPAddress ipAddr = ipHost.AddressList[0];
            IPEndPoint endPoint = new IPEndPoint(ipAddr, 7777);

            while (true)
            {
                Socket socket = new Socket(endPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
                try
                {
                    socket.Connect(endPoint);
                    Console.WriteLine($"서버 {socket.RemoteEndPoint}에 연결됨");

                    byte[] sendBuff = Encoding.UTF8.GetBytes("Hello World!");
                    socket.Send(sendBuff);

                    byte[] recvBuff = new byte[1024];
                    int recvBytes = socket.Receive(recvBuff);
                    string recvData = Encoding.UTF8.GetString(recvBuff, 0, recvBytes);
                    Console.WriteLine($"[From Server] {recvData}");

                    socket.Shutdown(SocketShutdown.Both);
                    socket.Close();
                }
                catch (Exception e)
                {
                    Console.WriteLine($"클라이언트 오류: {e}");
                }

                Thread.Sleep(1000);
            }
        }
    }
}
```

### **2) 서버 코드 (ServerCore)**

```csharp
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace ServerCore
{
    class Program
    {
        static Listener _listener = new Listener();

        static void OnAcceptHandler(Socket clientSocket)
        {
            try
            {
                byte[] recvBuff = new byte[1024];
                int recvBytes = clientSocket.Receive(recvBuff);
                string recvData = Encoding.UTF8.GetString(recvBuff, 0, recvBytes);
                Console.WriteLine($"[From Client] {recvData}");

                byte[] sendBuff = Encoding.UTF8.GetBytes("Welcome to Server !");
                clientSocket.Send(sendBuff);

                clientSocket.Shutdown(SocketShutdown.Both);
                clientSocket.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine($"서버 오류: {e}");
            }
        }

        static void Main(string[] args)
        {
            string host = Dns.GetHostName();
            IPHostEntry ipHost = Dns.GetHostEntry(host);
            IPAddress ipAddr = ipHost.AddressList[0];
            IPEndPoint endPoint = new IPEndPoint(ipAddr, 7777);

            _listener.Init(endPoint, OnAcceptHandler);
            Console.WriteLine("서버가 클라이언트를 기다리고 있습니다...");

            while (true)
            {
                ;
            }
        }
    }
}
```

### **3) Listener 클래스 구현 (ServerCore)**

```csharp
using System;
using System.Net;
using System.Net.Sockets;

namespace ServerCore
{
    class Listener
    {
        Socket _listenSocket;
        Action<Socket> _onAcceptHandler;

        public void Init(IPEndPoint endPoint, Action<Socket> onAcceptHandler)
        {
            _listenSocket = new Socket(endPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
            _onAcceptHandler = onAcceptHandler;

            _listenSocket.Bind(endPoint);
            _listenSocket.Listen(10);

            SocketAsyncEventArgs args = new SocketAsyncEventArgs();
            args.Completed += new EventHandler<SocketAsyncEventArgs>(OnAcceptCompleted);
            RegisterAccept(args);
        }

        void RegisterAccept(SocketAsyncEventArgs args)
        {
            args.AcceptSocket = null;
            bool pending = _listenSocket.AcceptAsync(args);
            if (!pending)
                OnAcceptCompleted(null, args);
        }

        void OnAcceptCompleted(object sender, SocketAsyncEventArgs args)
        {
            if (args.SocketError == SocketError.Success)
            {
                _onAcceptHandler.Invoke(args.AcceptSocket);
            }
            else
            {
                Console.WriteLine($"에러: {args.SocketError}");
            }

            RegisterAccept(args);
        }
    }
}
```

---

## 4. 주요 개념 및 역할

| **용어**                 | **설명**                                       |
| ---------------------- | -------------------------------------------- |
| `Listener`             | 소켓 `Listen()` 호출을 통해 연결 요청을 수신하고 이를 처리하는 클래스 |
| `RegisterAccept()`     | 새로운 연결 수신을 비동기적으로 등록                         |
| `OnAcceptCompleted()`  | 연결이 완료되었을 때 호출되는 메서드                         |
| `SocketAsyncEventArgs` | 비동기 소켓 작업에 대한 이벤트 데이터를 제공하는 클래스              |
| `AcceptAsync()`        | 비동기적으로 클라이언트의 연결 요청을 처리                      |
| `args.AcceptSocket`    | 클라이언트와의 연결된 소켓. (재사용 시 안전하게 초기화해야 한다.)       |

### **비동기 소켓 처리 구조**

1. **`RegisterAccept()` 호출**: 비동기 수신을 등록한다.
2. **`AcceptAsync()` 호출**: 비동기 수신 요청을 보낸다.
3. **연결 완료 시 `OnAcceptCompleted()` 호출**: 요청이 처리되면 클라이언트 소켓을 받아 핸들러를 호출한다.
4. **반복 처리**: 한 번 수신 완료 후 다시 `RegisterAccept()`를 호출해 지속적으로 연결을 처리합니다.
  
마치 낚시대를 처음에 던지고, 물고기가 낚였을 때 낚시대를 다시 한번 던져주는 느낌
{: .notice}

---
## 5. 고려해야 할 사항

- **무한 반복 시 스택 오버플로우**: `RegisterAccept()` 내에서 `pending`이 계속 `false`라면, `RegisterAccept()`와 `OnAcceptCompleted()`가 꼬리를 물며 반복되는 구조로 인해 스택 오버플로우가 발생할 수 있다. 이론적으로는 그러나 악의적인 공격 없이는 현실적으로 발생하기 힘들다. 찝찝하다면 수정을 고려해볼 수 있겠다.
    
- **클라이언트 수용 확장**: 동시에 많은 클라이언트를 처리하기 위해 `SocketAsyncEventArgs` 인스턴스를 반복문으로 여러 개 등록할 수 있다. 이는 낚싯대를 여러 개 사용하는 것과 비슷한 개념이다.
    
    ```csharp
    // 기존 코드
    SocketAsyncEventArgs args = new SocketAsyncEventArgs();
    args.Completed += new EventHandler<SocketAsyncEventArgs>(OnAcceptCompleted);
    RegisterAccept(args);
    
    // 확장된 코드
    for (int i = 0; i < 10; i++)
    {
        SocketAsyncEventArgs args = new SocketAsyncEventArgs();
        args.Completed += new EventHandler<SocketAsyncEventArgs>(OnAcceptCompleted);
        RegisterAccept(args);
    }
    ```
    
- **멀티스레드 환경**: `AcceptAsync()`는 내부적으로 다른 스레드를 사용해 작업을 처리하므로, `OnAcceptCompleted()`는 멀티스레드 환경에서 실행된다. 따라서 공용 자원에 접근할 때, `lock`을 사용하는 등으로 레이스 컨디션을 방지해야 한다.

---

## 6. 실행 결과
더미 클라이언트에서 반복문으로 여러번 접속 요청을 시도하게 하였다. 따라서 연결 성공 메세지가 반복적으로 뜨게 된다.

### **서버 콘솔 출력**

```
서버가 클라이언트를 기다리고 있습니다...
[From Client] Hello World!
[From Client] Hello World!
[From Client] Hello World!
...
```

### **클라이언트 콘솔 출력**

```
서버 [~~~~]:7777에 연결됨
[From Server] Welcome to Server !
서버 [~~~~]:7777에 연결됨
[From Server] Welcome to Server !
서버 [~~~~]:7777에 연결됨
[From Server] Welcome to Server !
...
```

---

## 6. 마무리

비동기 소켓 프로그래밍을 통해 프로그램의 응답성을 유지하면서도 다중 클라이언트 연결을 처리할 수 있다. `SocketAsyncEventArgs`의 `AcceptSocket`를 안전하게 재사용하기 위해 null로 꼭 초기화해주자. 또한 멀티스레드 환경에서는 동기화 문제를 고려하여 안전하게 공용 자원을 처리해야 한다.