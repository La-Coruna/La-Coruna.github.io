---
title: "[C#][Server] 13. string 변수의 직렬화"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: string 변수의 직렬화**

---

## 1. 진행 상황

- 크기가 가변적인 **String 타입**을 **직렬화(Serialization)**하여 송신하고, 수신하여 **역직렬화(Unserialization)**하도록 하였다.

---
## 2. 패킷 클래스 설계

### String의 직렬화와 역직렬화
**Serialization**
> sendBuff에 문자열을 직렬화한 크기를 먼저 기록하고, 직렬화된 문자열 바이트를 넣는다.

**Unserialization**
> readBuff에서 문자열의 크기를 먼저 읽어오고, 그 크기만큼 문자열을 읽어온다.

### 코드 구현
String 변수의 직렬화하는 상황을 위해, `PlayerInfoReq`패킷에 `name`이란 속성 추가.

```csharp
class PlayerInfoReq : Packet
{
    public long playerId;
    public string name;

    public PlayerInfoReq()
    {
        this.packetId = (ushort)PacketID.PlayerInfoReq;
    }

    public override void Read(ArraySegment<byte> segment)
    {
        ushort count = 0;
        ReadOnlySpan<byte> s = new Span<byte>(segment.Array, segment.Offset, segment.Count);

        count += sizeof(ushort); // size
        count += sizeof(ushort); // packetId

        this.playerId = BitConverter.ToInt64(s.Slice(count, s.Length - count));
        count += sizeof(long);

		// String Unserialization ----------------------------------------------------------------------------------------------
        ushort nameLen = BitConverter.ToUInt16(s.Slice(count, s.Length - count));
        count += sizeof(ushort);
        this.name = Encoding.Unicode.GetString(s.Slice(count, nameLen));
        count += nameLen;
        // ---------------------------------------------------------------------------------------------------------------------
    }

    public override ArraySegment<byte> Write()
    {
        ArraySegment<byte> segment = SendBufferHelper.Open(4096);
        ushort count = 0;
        bool success = true;

        Span<byte> s = new Span<byte>(segment.Array, segment.Offset, segment.Count);

        count += sizeof(ushort); // size 공간 확보

        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), this.packetId);
        count += sizeof(ushort);

        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), this.playerId);
        count += sizeof(long);

		// String Serialization ------------------------------------------------------------------------------------------------
        ushort nameLen = (ushort)Encoding.Unicode.GetBytes(this.name, 0, this.name.Length, segment.Array, segment.Offset + count + sizeof(ushort));
        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), nameLen);
        count += sizeof(ushort);
        count += nameLen;
        // ---------------------------------------------------------------------------------------------------------------------

        success &= BitConverter.TryWriteBytes(s, count);

        if (!success)
            return null;

        return SendBufferHelper.Close(count);
    }
}
```

### String 처리 과정 중 Tip
String을 Serialization할 때 `Encoding.Unicode.GetBytes()`를 사용하게 되는데, 이때 팁이 하나 있다. String Serialization을 수행하는 다음 2가지 방식을 비교해보자.

#### 방식 1: `Encoding.Unicode.GetBytes`와 `Array.Copy` 활용
**직렬화된 문자열 바이트의 크기**와 **직렬화된 문자열 바이트를** 순차적으로 기록하게 되는데, 기록하는 순서대로 코드를 짜게 된다면, 다음과 같이 짤 수 있겠다. 여기서 `Encoding.Unicode.GetBytes`는 Serialization된 Byte배열을 반환한다.

```csharp
ushort nameLen = (ushort)Encoding.Unicode.GetByteCount(this.name);
success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), nameLen);
count += sizeof(ushort);
Array.Copy(Encoding.Unicode.GetBytes(this.name), 0, segment.Array, count, nameLen);
count += nameLen;
```
**특징**
- 문자열 길이를 계산하고, 별도의 바이트 배열을 생성하여 데이터를 복사.
- 추가적인 바이트 배열 생성으로 메모리 사용량이 증가.

#### 방식 2: `Encoding.Unicode.GetBytes`로 직접 버퍼에 쓰기
하지만 `Encoding.Unicode.GetBytes`의 오버로딩된 함수들을 살펴보면 직접 destination에 직렬화된 값을 붙여 넣고, 그 값의 크기를 반환하는 함수를 발견할 수 있다. 이를 활용하면 추가적인 메모리 사용 없이 효율적으로 버퍼에 작성할 수 있겠다. 또한 직렬화된 값의 크기를 알기 위해 `Encoding.Unicode.GetByteCount()`를 호출하지 않아도 된다.

```csharp
ushort nameLen = (ushort)Encoding.Unicode.GetBytes(this.name, 0, this.name.Length, segment.Array, segment.Offset + count + sizeof(ushort));
success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), nameLen);
count += sizeof(ushort);
count += nameLen;
```
**특징**
- 문자열을 별도의 바이트 배열로 생성하지 않고, 바로 버퍼에 기록.
- 추가적인 메모리 사용 없이 효율적인 데이터 기록.

---

## 3. 클라이언트 측 구현
패킷을 생성하며, 이름을 `ABCD`로 설정.

```csharp
class ServerSession : PacketSession
{
    public override void OnConnected(EndPoint endPoint)
    {
        Console.WriteLine($"OnConnected: {endPoint}");

        PlayerInfoReq packet = new PlayerInfoReq() { playerId = 1001, name = "ABCD" };

        ArraySegment<byte> s = packet.Write();
        if (s != null)
            Send(s);

        Disconnect();
    }
}
```

---

## 4. 서버 측 구현

패킷을 수신하면, 이름을 플레이어ID(`1001`)와 String변수 이름`ABCD`을 출력하도록 함.

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
                    Console.WriteLine($"PlayerInfoReq: {p.playerId} {p.name}");
                }
                break;
        }

        Console.WriteLine($"RecvPacketId: {id}, Size: {size}");
    }
}
```

---
## 5. 실행 결과

```
OnConnected: [~~~~]:7777
Transferred bytes: 22
OnDisconnected: [~~~~]:7777

서버가 클라이언트를 기다리고 있습니다...
OnConnected: [~~~~]:65124
PlayerInfoReq: 1001 ABCD
RecvPacketId: 1, Size: 22
OnDisconnected: [~~~~]:65124
```
