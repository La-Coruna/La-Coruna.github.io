---
title: "[C#][Server] 4. 비동기 Send와 SendQueue 구현"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: 비동기 SendQueue와 SendAsync 클래스 구현**

이번 포스팅에서는 네트워크 송신 부하를 줄이기 위해 `SendQueue`를 도입하고, `Send`를 비동기 방식으로 처리하는 방법을 다룬다. `SendAsync`를 사용하여 멀티스레드 환경에서도 안정적으로 동작하도록 구현하였다.

---

## 1. 진행 상황

- `SendQueue`와 `_pending` 플래그를 활용하여 네트워크 송신을 비동기 방식으로 구현하였다.
- 멀티스레드 환경에서 안전한 송신 처리를 위해 `lock`을 사용하였다.

---

## 2. SendQueue의 필요성과 구현

### **문제점**

MMORPG와 같은 대규모 네트워크 게임에서는 네트워크 송수신이 가장 큰 성능 병목 지점이다. 만약 송신 작업을 요청할 때마다 `SendAsync`가 호출된다면, CPU 부하가 급격히 증가하고 성능 저하로 이어질 수 있다.

### **해결 방법: SendQueue**

메시지를 `Queue`에 저장하고 한 번에 여러 메시지를 처리하도록 구현하면 부하를 줄일 수 있다.

```csharp
public void Send(byte[] sendBuff)
{
    lock (_lock)
    {
        _sendQueue.Enqueue(sendBuff);
        if (_pending == false)
            RegisterSend();
    }
}
```

- **`_pending` 플래그**: 현재 송신 작업 중인지 여부를 나타낸다.
- **`RegisterSend()`**: 큐에 있는 데이터를 `SocketAsyncEventArgs`를 통해 송신한다.

---

## 3. 코드 분석

### **RegisterSend와 OnSendCompleted 흐름**

- `RegisterSend()`는 큐에서 데이터를 가져와 송신을 시작.
- 송신 작업이 완료되면 `OnSendCompleted()`가 호출.
- `OnSendCompleted()`에서 다른 스레드에 의해 큐에 추가된 남은 데이터가 있다면, `RegisterSend()`를 호출하여 데이터를 처리.
- 그렇지 않다면 `_pending`을 `false`로 설정하여 송신 상태 초기화.

```csharp
void RegisterSend()
{
    _pending = true;
    byte[] buff = _sendQueue.Dequeue();
    _sendArgs.SetBuffer(buff, 0, buff.Length);

    bool pending = _socket.SendAsync(_sendArgs);
    if (pending == false)
        OnSendCompleted(null, _sendArgs);
}

void OnSendCompleted(object sender, SocketAsyncEventArgs args)
{
    lock (_lock)
    {
        if (args.BytesTransferred > 0 && args.SocketError == SocketError.Success)
        {
			/*
			어떤 스레드에서 RegisterSend()를 처리 중이라 _pending이 true가 된 상태에서,
			다른 스레드가 Send()를 하게 되면, 그 스레드에선 _pending이 true이기 때문에 RegisterSend()를 못하게 되고,
			그러면 _sendQueue에 있는 데이터들이 처리되지 못하고 남아 있게 된다.
			(Dequeue해서 처리해주는 것은 RegisterSend()에서 처리해주기 때문)

			따라서, _sendQueue에 남아 있는 데이터도 처리 되도록 RegisterSend를 다시 해주자.
			 */
            if (_sendQueue.Count > 0)
                RegisterSend();
            else
                _pending = false;
        }
        else
        {
            Disconnect();
        }
    }
}
```

### 아직 해결되지 못한 문제점
`_sendQueue`를 사용하여 구조를 개선했지만, 아직은 `Send()`를 호출할 때마다 `SendAsync()`도 같은 횟수만큼 호출되어 비효율적이다.
`Send()`는 `_pending`이 `false`일 때만 `RegisterSend()`를 호출하지만, `RegisterSend()`에서 `_sendQueue`의 원소를 하나씩 `Dequeue()`해서 전부 비워내기 때문이다.
따라서 `_sendQueue`의 원소들을 한번에 뭉쳐서 보낼 수 있도록 개선해야 한다.

---

## 4. 멀티스레드 환경에서의 안전한 처리

### **`lock`의 필요성**

- `_pending`과 `_sendQueue`는 여러 스레드가 접근할 수 있는 공유 자원이므로, 동기화가 필요하다.
- `lock`을 통해 데이터 경쟁을 방지하고 안정적으로 송신 작업을 수행할 수 있다.

```csharp
lock (_lock)
{
    _sendQueue.Enqueue(sendBuff);
    if (_pending == false)
        RegisterSend();
}
```

---

## 5. `SocketAsyncEventArgs`의 주요 속성 및 메서드

`SocketAsyncEventArgs`는 비동기 소켓 작업을 처리하기 위한 클래스이다. 아래는 주요 속성 및 메서드이다:

### **주요 속성**

- **`Buffer`**: 송수신 데이터를 저장하는 바이트 배열.
- **`Offset`**: 버퍼 내에서 데이터가 시작되는 위치.
- **`BytesTransferred`**: 송수신된 데이터의 바이트 수.
- **`SocketError`**: 작업 완료 상태를 나타내는 소켓 오류 정보.
- **`UserToken`**: 사용자 정의 데이터를 저장할 수 있는 객체.

### **주요 메서드**

- **`SetBuffer(byte[], int, int)`**: 버퍼를 설정하여 송수신 데이터를 지정한다.
- **`Dispose()`**: 리소스를 해제한다.

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

이번 구현에서는 `Send`를 비동기 방식으로 변경하였고, 멀티스레드 환경에서도 안전하게 송신 작업을 처리할 수 있도록 하였다. 
하지만 `SendAsync` 호출이 너무 빈번하게 발생하는 문제가 남아 있으며, 다음 포스팅에서는 메시지를 뭉쳐서 보낼 수 있도록 개선할 예정이다.