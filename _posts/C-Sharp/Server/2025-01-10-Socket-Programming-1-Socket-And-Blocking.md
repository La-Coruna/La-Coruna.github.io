---
title: "[C#][Server] 1. Blocking 함수를 이용한 소켓 프로그래밍"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: 서버-클라이언트 소켓 예제**

C#으로 작성한 기본적인 소켓 프로그래밍 예제를 정리했다. 테스트의 편의를 위해 클라이언트와 서버가 같은 컴퓨터에서 실행되는 상황을 가정했다.

---

## 1. 프로젝트 구조

- **ServerCore**: 서버의 핵심 기능들을 구현할 프로젝트
- **DummyClient**: 테스트를 위해 여러 개의 클라이언트 역할을 수행해줄 더미 클라이언트

---

## 2. 코드 분석

### **1) 서버 코드 (ServerCore)**

```csharp
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace ServerCore
{
    class Program
    {
        static void Main(string[] args)
        {
            // DNS (Domain Name System)에서 호스트 이름과 IP 주소를 가져오기
            string host = Dns.GetHostName();
            IPHostEntry ipHost = Dns.GetHostEntry(host);
            IPAddress ipAddr = ipHost.AddressList[0];
            IPEndPoint endPoint = new IPEndPoint(ipAddr, 7777); // 포트 번호 7777

            // 소켓 생성
            Socket listenSocket = new Socket(endPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);

            try
            {
                // 소켓 바인딩 및 대기 설정
                listenSocket.Bind(endPoint);
                listenSocket.Listen(10); // 최대 대기 연결 수 설정

                Console.WriteLine("서버가 클라이언트를 기다리고 있습니다...");

                while (true)
                {
                    // 클라이언트 연결 수락
                    Socket clientSocket = listenSocket.Accept();
                    Console.WriteLine("클라이언트 연결 수락됨");

                    // 클라이언트 메시지 수신
                    byte[] recvBuff = new byte[1024];
                    int recvBytes = clientSocket.Receive(recvBuff);
                    string recvData = Encoding.UTF8.GetString(recvBuff, 0, recvBytes);
                    Console.WriteLine($"[From Client] {recvData}");

                    // 서버 응답 전송
                    byte[] sendBuff = Encoding.UTF8.GetBytes("Welcome to Server!");
                    clientSocket.Send(sendBuff);

                    // 연결 종료
                    clientSocket.Shutdown(SocketShutdown.Both);
                    clientSocket.Close();
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"서버 오류: {e}");
            }
        }
    }
}
```

---

### **2) 클라이언트 코드 (DummyClient)**

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
            // DNS (Domain Name System) 정보 가져오기
            string host = Dns.GetHostName();
            IPHostEntry ipHost = Dns.GetHostEntry(host);
            IPAddress ipAddr = ipHost.AddressList[0];
            IPEndPoint endPoint = new IPEndPoint(ipAddr, 7777);

            // 클라이언트 소켓 생성
            Socket socket = new Socket(endPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);

            try
            {
                // 서버 연결 시도
                socket.Connect(endPoint);
                Console.WriteLine($"서버 {socket.RemoteEndPoint.ToString()}에 연결됨");

                // 메시지 전송
                byte[] sendBuff = Encoding.UTF8.GetBytes("Hello World!");
                socket.Send(sendBuff);

                // 서버 응답 수신
                byte[] recvBuff = new byte[1024];
                int recvBytes = socket.Receive(recvBuff);
                string recvData = Encoding.UTF8.GetString(recvBuff, 0, recvBytes);
                Console.WriteLine($"[From Server] {recvData}");

                // 연결 종료
                socket.Shutdown(SocketShutdown.Both);
                socket.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine($"클라이언트 오류: {e}");
            }
        }
    }
}
```

---


## 3. 주요 개념 설명

| **용어**              | **설명**                                         |
| ------------------- | ---------------------------------------------- |
| `host`              | 현재 실행 중인 컴퓨터의 호스트 이름을 나타낸다.                    |
| `Dns.GetHostName()` | 로컬 컴퓨터의 호스트 이름을 반환한다.                          |
| `IPHostEntry`       | DNS 조회 결과로 반환되는 호스트 정보 객체로, IP 주소 목록을 포함한다.    |
| `IPAddress`         | IP 주소를 나타내는 클래스입니다. IPv4 또는 IPv6 주소를 관리할 수 있다. |
| `IPEndPoint`        | 네트워크 엔드포인트(주소와 포트 번호)를 나타낸다.                   |
| `Socket`            | 네트워크 연결을 위한 소켓 클래스. 연결 생성, 데이터 송수신에 사용된다.      |

---

## 4. 함수 대응 표

서버와 클라이언트에서 사용된 주요 함수들을 기능에 따라 표로 정리했습니다.

| **기능**     | **서버 측 함수**              | **클라이언트 측 함수**           | **설명**                |
| ---------- | ------------------------ | ------------------------ | --------------------- |
| DNS 조회     | `Dns.GetHostName()`      | `Dns.GetHostName()`      | 현재 호스트 이름을 가져옴        |
| IP 주소 설정   | `Dns.GetHostEntry(host)` | `Dns.GetHostEntry(host)` | 호스트 이름을 기반으로 IP 주소 확인 |
| 바인드(포트 설정) | `Bind(endPoint)`         | -                        | 서버 소켓에 포트 번호 연결       |
| 연결 대기      | `Listen(10)`             | -                        | 최대 대기 수 설정            |
| 클라이언트 연결   | `Accept()`               | `Connect()`              | 연결 수락 및 연결 시도         |
| 메시지 전송     | `Send()`                 | `Send()`                 | 메시지를 전송               |
| 메시지 수신     | `Receive()`              | `Receive()`              | 메시지를 수신               |
| 연결 종료      | `Shutdown()` & `Close()` | `Shutdown()` & `Close()` | 연결 해제 및 소켓 종료         |

---

## 5. Blocking 함수 특징

현재 사용된 소켓 함수들은 **Blocking 함수**다. Blocking 함수는 작업을 완료할 때까지 호출을 반환하지 않는다.

| **함수**       | **설명**                                 |
| ------------ | -------------------------------------- |
| `Accept()`   | 클라이언트가 연결 요청을 하기 전까지 대기 상태로 머무른다.      |
| `Receive()`  | 상대방이 데이터를 보낼 때까지 대기한다.                 |
| `Send()`     | 데이터가 전송될 때까지 대기한다.                     |
| `Connect()`  | 서버가 응답할 때까지 대기한다.                      |
| `Shutdown()` | 연결 종료 시까지 대기하며 모든 전송 작업이 완료될 때까지 기다린다. |

### **Blocking 함수의 주요 특징**

- **대기 상태**: 특정 작업이 완료될 때까지 프로그램이 중단된다.
- **CPU 사용**: 대기 중 프로그램은 CPU 사용률을 최소화하지만, 동시에 다른 작업을 처리할 수 없다.
- **프로그램 응답성**: 네트워크 작업이 지연되면 프로그램 전체가 멈출 수 있다.

---

## 6. 실행 결과

### **서버 콘솔 출력**

```
서버가 클라이언트를 기다리고 있습니다...
클라이언트 연결 수락됨
[From Client] Hello World!
```

### **클라이언트 콘솔 출력**

```
서버 [~~~~]:7777에 연결됨
[From Server] Welcome to Server!
```

---

## 7. 마무리

간단한 소켓 프로그래밍을 해보았다. 다음은 Non-Blocking방식으로 개선할 차례다.