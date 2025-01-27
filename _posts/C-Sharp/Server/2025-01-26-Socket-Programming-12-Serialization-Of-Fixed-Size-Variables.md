---
title: "[C#][Server] 12. 정적 크기 변수의 직렬화"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: 정적 크기 변수의 직렬화**

---

## 1. 진행 상황

- `Packet`클래스에 직렬화와 역직렬화 추상 함수(`Write()`와 `Read()`)를 선언하고, 자식 클래스에게 구현 강제.
- 이를 통해, 세션에서 packet을 보내거나 처리하기 위해 직렬화 또는 역직렬화를 하는 코드를 패킷 클래스의 `Write()`와 `Read()`로 간단하게 호출할 수 있음
- `recvBuff`에서 byte단위 데이터를 해당 자료형으로 읽어들일 때, `ReadOnlySpan<byte>`를 활용하여 비교적 안전한 방식으로 개선.
- 현재는 크기가 고정적인 변수만 직렬화하였음.

---

## 2. 서버 개발 시 클라를 항상 의심해라
### 1) 신뢰할 수 없는 클라이언트 데이터

- 항상 서버를 설계할 때, 클라이언트가 잘못된 데이터를 보낼 가능성을 염두에 두어야 한다.
- **패킷 헤더**에 포함된 정보는 완전히 신뢰할 수 없으며, 참고 자료로만 사용해야 한다.

### 2) 안전한 데이터 변환

#### 기존 방식

```csharp
this.playerId = BitConverter.ToInt64(s.Array, s.Offset + count);
```

- 이 방식은 변환 범위가 제한되지 않아, 잘못된 데이터를 처리하거나 예상치 못한 버그를 유발할 가능성이 있다.

#### 개선된 방식

```csharp
this.playerId = BitConverter.ToInt64(new ReadOnlySpan<byte>(s.Array, s.Offset + count, s.Count - count));
```

- **`ReadOnlySpan<byte>`**를 사용하면 지정된 범위를 넘어서 데이터 변환이 불가능하다.
- 범위를 초과한 접근 시 예외가 발생하므로, 문제를 빠르게 감지하고 수정 가능하다.
---
## 3. 패킷 클래스 설계

추후에 Packet을 상속받는 클래스들의 `Read()`와  `Write()`를 자동화할 것이다. 현재는 자동화를 어떻게 할지 간단하게 설계해본다.

### 1) Packet 클래스와 상속 구조

#### 공통 구조

```csharp
public abstract class Packet
{
    public ushort size;
    public ushort packetId;

    public abstract ArraySegment<byte> Write();
    public abstract void Read(ArraySegment<byte> s);
}
```

- **`Packet` 클래스**:
    - 모든 패킷의 기본 클래스.
    - 패킷 크기와 ID를 포함하며, 읽기(`Read`)와 쓰기(`Write`) 메서드를 추상화하여 구현 강제.

#### `PlayerInfoReq` 클래스

```csharp
class PlayerInfoReq : Packet
{
    public long playerId;

    public PlayerInfoReq()
    {
        this.packetId = (ushort)PacketID.PlayerInfoReq;
    }

    public override void Read(ArraySegment<byte> s)
    {
        ushort count = 0;
        count += 2; // Header size
        count += 2; // Packet ID
        this.playerId = BitConverter.ToInt64(new ReadOnlySpan<byte>(s.Array, s.Offset + count, s.Count - count));
        count += 8; // Player ID
    }

    public override ArraySegment<byte> Write()
    {
        ArraySegment<byte> s = SendBufferHelper.Open(4096);
        ushort count = 0;
        bool success = true;

        count += 2; // Header size 공간 확보
        success &= BitConverter.TryWriteBytes(new Span<byte>(s.Array, s.Offset + count, s.Count - count), this.packetId);
        count += 2;
        success &= BitConverter.TryWriteBytes(new Span<byte>(s.Array, s.Offset + count, s.Count - count), this.playerId);
        count += 8;
        success &= BitConverter.TryWriteBytes(new Span<byte>(s.Array, s.Offset, s.Count), count);

        if (!success)
            return null;

        return SendBufferHelper.Close(count);
    }
}
```

#### PacketID 열거형

```csharp
public enum PacketID
{
    PlayerInfoReq = 1,
    PlayerInfoOk = 2,
}
```

- 패킷 종류를 식별하기 위한 열거형.

---

## 4. 클라이언트 측 구현

### 패킷 생성 및 전송

- `PlayerInfoReq` 패킷 객체를 생성하고, `Write()`를 통해 직렬화한 데이터를 서버로 전송.

#### 코드

```csharp
class ServerSession : PacketSession
{
    public override void OnConnected(EndPoint endPoint)
    {
        Console.WriteLine($"OnConnected: {endPoint}");

        PlayerInfoReq packet = new PlayerInfoReq() { playerId = 1001 };

        ArraySegment<byte> s = packet.Write();
        if (s != null)
            Send(s);

        Disconnect();
    }
}
```

---

## 5. 서버 측 구현

### 패킷 수신 및 처리

- 서버에서 수신한 데이터를 패킷 ID를 기준으로 분기 처리하고, `Read()`를 호출해 패킷 데이터를 파싱.

#### 코드

```csharp
class ClientSession : PacketSession
{
    public override void OnRecvPacket(ArraySegment<byte> buffer)
    {
        ushort count = 0;

        ushort size = BitConverter.ToUInt16(buffer.Array, buffer.Offset);
        count += 2;

        ushort id = BitConverter.ToUInt16(buffer.Array, buffer.Offset + count);
        count += 2;

        switch ((PacketID)id)
        {
            case PacketID.PlayerInfoReq:
                {
                    PlayerInfoReq p = new PlayerInfoReq();
                    p.Read(buffer);
                    Console.WriteLine($"PlayerInfoReq: {p.playerId}");
                }
                break;
        }

        Console.WriteLine($"RecvPacketId: {id}, Size: {size}");
    }
}
```

---
## 5. 마무리

현재는 정적 크기의 데이터를 처리하고 있으며, 다음은 리스트나 문자열 등 가변 데이터 처리 로직을 추가할 것이다.