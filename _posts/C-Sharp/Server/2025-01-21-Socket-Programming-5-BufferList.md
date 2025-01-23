---
title: "[C#][Server] 5. SetBuffer 대신 BufferList 사용하기"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: BufferList와 ArraySegment의 활용**

---

## 1. 진행 상황

이전에 단일 데이터를 처리하던 방식에서 사용하던 `SetBuffer()`대신, `BufferList`를 사용하여 한 번의 Send로 여러 데이터를 처리하도록 개선하였다.

---

## 2. BufferList란?

- **타입**: `BufferList`는 `SocketAsyncEventArgs` 클래스에서 제공하는 속성으로, **`IList<ArraySegment<byte>>`** 타입이다.
- **역할**: 여러 개의 데이터를 한 번에 송신할 수 있도록 지원하며, 배열이나 버퍼를 관리하기 쉽게 만들어준다.
    - 예를 들어, 큐에 여러 개의 버퍼가 있을 때 `BufferList`에 각 버퍼를 추가해 한 번에 송신 가능하다.

---

## 3. ArraySegment란?

- **역할**: 배열의 특정 부분을 참조하는 구조체이다. 배열 전체를 복사하지 않고, 특정 구간을 가리키기만 하므로 성능적으로 효율적이다.
- **속성** ([.NET 문서 참조](https://learn.microsoft.com/ko-kr/dotnet/api/system.arraysegment-1?view=net-8.0))

| 속성                                                                                                                                           | 설명                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [Array](https://learn.microsoft.com/ko-kr/dotnet/api/system.arraysegment-1.array?view=net-8.0#system-arraysegment-1-array)                   | 배열 세그먼트가 구분하는 요소의 범위를 포함하는 원래 배열을 가져옵니다.              |
| [Count](https://learn.microsoft.com/ko-kr/dotnet/api/system.arraysegment-1.count?view=net-8.0#system-arraysegment-1-count)                   | 배열 세그먼트로 구분된 범위의 요소 수를 가져옵니다.                         |
| [Empty](https://learn.microsoft.com/ko-kr/dotnet/api/system.arraysegment-1.empty?view=net-8.0#system-arraysegment-1-empty)                   | 빈 배열 세그먼트를 나타냅니다. 이 필드는 읽기 전용입니다.                     |
| [Item[Int32]](https://learn.microsoft.com/ko-kr/dotnet/api/system.arraysegment-1.item?view=net-8.0#system-arraysegment-1-item(system-int32)) | 지정된 인덱스에서 요소를 가져오거나 설정합니다.                            |
| [Offset](https://learn.microsoft.com/ko-kr/dotnet/api/system.arraysegment-1.offset?view=net-8.0#system-arraysegment-1-offset)                | 원래 배열의 시작을 기준으로 배열 세그먼트로 구분된 범위에서 첫 번째 요소의 위치를 가져옵니다. |

### C#에서 `ArraySegment`를 사용하는 이유

1. **메모리 복사 방지**: 데이터를 다른 배열로 복사하지 않고 참조를 통해 작업을 수행.
2. **효율성**: 네트워크 송수신에서 대량 데이터를 다룰 때 메모리 사용량을 줄이고 속도를 개선.

> **C++과의 비교**
> - **C++에서는** 포인터를 사용하여 배열의 특정 위치를 직접 참조할 수 있다.
> - **C#에서는** 안전한 메모리 관리를 위해 포인터 대신 `ArraySegment`를 사용하여 배열의 구간을 참조한다.

---

## 4. 코드 분석

### 주요 코드

```csharp
public void Send(byte[] sendBuff)
{
    lock (_lock)
    {
        _sendQueue.Enqueue(sendBuff);
        // SendAsync가 이미 진행 중이라면 큐에만 추가하고 종료
        if (_pendingList.Count == 0)
            RegisterSend();
    }
}

void RegisterSend()
{
    while (_sendQueue.Count > 0)
    {
        byte[] buff = _sendQueue.Dequeue();
        _pendingList.Add(new ArraySegment<byte>(buff, 0, buff.Length));
    }
    _sendArgs.BufferList = _pendingList;

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
            try
            {
                _sendArgs.BufferList = null; // 초기화
                _pendingList.Clear();

                // 송신 대기 중인 데이터가 있으면 다시 송신 등록
                if (_sendQueue.Count > 0)
                    RegisterSend();
            }
            catch (Exception e)
            {
                Console.WriteLine($"OnSendCompleted Failed {e}");
            }
        }
        else
        {
            Disconnect();
        }
    }
}
```

---

## 5. 개선점과 한계

### 현재 개선 사항

- `SendAsync()` 호출이 여러 데이터 조각을 한 번에 처리하므로, 호출 빈도가 줄어들어 부하를 줄일 수 있음.

### 한계

#### 1. 송신 데이터량 조절

- 현재 `_sendQueue`에 쌓인 모든 데이터를 무조건 송신한다. 이는 **송신량이 과도한 경우** 문제를 야기할 수 있다.
- 일정 시간 동안 송신한 데이터의 총량을 추적하고, 과도한 송신이 발생하면 속도를 조절하거나 잠시 대기하는 로직이 필요하다.
- 이러한 조치는 다음과 같은 상황을 대비하기 위함이다:
    - **수신 불가능 상태**: 상대방이 패킷을 처리하지 못할 경우 문제가 발생.
    - **악의적 공격 방어**: 디도스 공격 등 의미 없는 패킷이 다량으로 들어올 경우, 이를 감지하고 연결을 끊는 기능이 필요.

#### 2. 패킷 모으기와 송신 최적화

- 현재는 `_sendQueue`에서 데이터가 추가되면 바로 송신 작업을 시작하지만, 패킷을 모아서 한 번에 송신하는 방식이 더 효율적일 수 있음.
- 예를 들면, 한 명의 유저마다 움직인 것을 바로 Send하는 것이 아니라, 하나의 커다란 버퍼에 천 명의 유저들이 움직이고 스킬을 쓴 행위들을 모두 기록하고, 그 버퍼를 다른 유저들한테 돌아가면서 샌드를 해주는 것이, 더 성능이 좋을 것이다.


---

## 6. 마무리

기존에 사용했던 `SetBuffer()` 대신 `BufferList`를 사용해 `_sendQueue`에 쌓인 데이터를 한 번의 `SendAsync()`로 보낼 수 있도록 개선하였다.