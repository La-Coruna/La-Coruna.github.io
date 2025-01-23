---
title: "[C#][Server] 9. SendBuffer"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**9번째 TIL: SendBuffer 클래스 도입**

---

## 1. 진행 상황

- 데이터 송신 시, `SendBufferHelper`를 통해 `SendBuffer`를 동적으로 할당하여 이를 기반으로 송신 작업을 수행하도록 구현하였다.

---

## 2. 주요 변경 사항

### 1) SendBuffer 클래스 구현

- 송신 데이터를 임시로 저장하고 이를 관리하는 역할을 수행한다.
- 데이터 크기와 메모리 관리 효율성을 고려해 동적 버퍼를 활용.

```csharp
public class SendBufferHelper
{
    public static ThreadLocal<SendBuffer> CurrentBuffer = new ThreadLocal<SendBuffer>(() => { return null; });

    public static int ChunkSize { get; set; } = 4096 * 100;

    public static ArraySegment<byte> Open(int reserveSize)
    {
        if (CurrentBuffer.Value == null)
            CurrentBuffer.Value = new SendBuffer(ChunkSize);

        if(CurrentBuffer.Value.FreeSize < reserveSize)
            CurrentBuffer.Value = new SendBuffer(ChunkSize);

        return CurrentBuffer.Value.Open(reserveSize);
    }
    public static ArraySegment<byte> Close(int usedSize)
    {
        return CurrentBuffer.Value.Close(usedSize);
    }
}
```

### 2) SendBufferHelper 클래스 구현

- **중앙화된 버퍼 관리**: `SendBufferHelper`는 `ThreadLocal`을 사용해 각 스레드에서 독립적인 `SendBuffer`를 관리하도록 돕는다. 이를 통해 데이터를 동적으로 생성하고 각 스레드별로 처리 가능하다.
- **동적 버퍼 할당과 재사용**: `Open(size)` 메서드를 통해 필요한 크기의 버퍼를 할당하고, `Close(size)` 메서드로 실제 데이터를 송신 가능한 상태로 반환한다. 이 방식은 메모리 복사를 줄여준다.
- **사용 예시**: 데이터를 송신하기 전, `Open`으로 데이터를 기록할 버퍼를 열고, `Close`로 이를 송신 가능한 `ArraySegment<byte>`로 변환하여 효율적으로 관리한다.

``` csharp
public class SendBuffer
{
    byte[] _buffer;
    int _usedSize = 0;

    public SendBuffer(int chunkSize)
    {
        _buffer = new byte[chunkSize];
    }

    public int FreeSize { get { return _buffer.Length - _usedSize; } }

    public ArraySegment<byte> Open(int reserveSize)
    {
        if (reserveSize > FreeSize)
            return null;

        return new ArraySegment<byte>(_buffer, _usedSize, reserveSize);
    }
    public ArraySegment<byte> Close(int usedSize)
    {
        ArraySegment<byte> segment = new ArraySegment<byte>(_buffer, _usedSize, usedSize);
        _usedSize += usedSize;
        return segment;
    }
}
```

---

### 3) GameSession의 송신 부분 변경

#### **변경 전**

- 송신 데이터를 직접 생성하고, 배열 복사 등을 처리.

```csharp
byte[] buffer = Encoding.UTF8.GetBytes("Hello World!");
Send(new ArraySegment<byte>(buffer, 0, buffer.Length));
```

#### **변경 후**

- 테스트를 위해 Knight 클래스 생성.
- `SendBufferHelper`를 사용하여 버퍼를 동적으로 생성하고 송신하도록 변경.

```csharp
class Knight
{
	public int hp;
	public int attack;
}

ArraySegment<byte> openSegment = SendBufferHelper.Open(4096);
byte[] buffer = BitConverter.GetBytes(knight.hp);
byte[] buffer2 = BitConverter.GetBytes(knight.attack);
Array.Copy(buffer, 0, openSegment.Array, openSegment.Offset, buffer.Length);
Array.Copy(buffer2, 0, openSegment.Array, openSegment.Offset + buffer.Length, buffer2.Length);
ArraySegment<byte> sendBuff = SendBufferHelper.Close(buffer.Length + buffer2.Length);
Send(sendBuff);
```

---

## 3. ThreadLocal의 사용

#### **역할**

- `ThreadLocal<T>`는 각 스레드에서 독립적으로 데이터를 유지할 수 있는 스레드 로컬 저장소를 제공한다.
- `SendBuffer`는 각 스레드에서 별도로 관리되어, 동시 작업 시 데이터 충돌을 방지한다.

#### **코드 분석**

```csharp
public static ThreadLocal<SendBuffer> CurrentBuffer = new ThreadLocal<SendBuffer>(() => { return null; });
```

- **`ThreadLocal<SendBuffer>`**:
    - 각 스레드마다 독립적인 `SendBuffer` 인스턴스를 유지.
- **`(() => { return null; })`**:
    - 초기화 콜백으로, 각 스레드가 `ThreadLocal`에 접근할 때 실행되어 기본값을 설정한다.
    - 여기서는 초기값으로 `null`을 반환하도록 설정.

---

## 4. 마무리

1. **송신 데이터 관리 효율화**:
    - 동적 버퍼를 활용하여 송신 데이터를 효율적으로 관리.
2. **스레드 안정성 확보**:
    - `ThreadLocal`을 통해 송신 버퍼를 각 스레드에서 독립적으로 관리하여 동시 작업 시 충돌 방지.