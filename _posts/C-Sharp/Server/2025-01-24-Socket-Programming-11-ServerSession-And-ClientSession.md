---
title: "[C#][Server] 11. PacketSession을 상속받는 ServerSession와 ClientSession"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: 클라이언트와 서버에서의 패킷 처리 로직 개선**

---
## 1. 진행 상황

- 기존 서버와 클라이언트의 `GameSession` 클래스를 각각 `ServerSession`과 `ClientSession` 클래스로 분리하여 명확한 역할을 가지도록 수정하였다.
- **서버 측**: `ClientSession` 클래스가 클라이언트로부터 데이터를 송수신.
- **클라이언트 측**: `ServerSession` 클래스가 서버로부터 데이터를 송수신.

---
## 2. 패킷 구조 정의

간단하게 다음과 같은 상황을 가정해보자.
클라이언트에서 플레이어 ID를 전송하며 플레이어의 정보를 요청하면, 서버에서는 플레이어의 정보인 체력과 공격력을 알려준다.

- **Packet**:
    - 모든 패킷의 기본 클래스이며, 패킷 크기(`size`)와 ID(`packetId`)를 포함.

```csharp
class Packet
{
    public ushort size;
    public ushort packetId;
}
```

- **PlayerInfoReq**:
    - 특정 플레이어의 정보를 요청하는 패킷으로, `playerId`를 포함.

```csharp
class PlayerInfoReq : Packet
{
    public long playerId;
}
```

- **PlayerInfoOk**:
    - 플레이어의 체력(`hp`)과 공격력(`attack`) 정보를 담은 응답 패킷.

```csharp
class PlayerInfoOk : Packet
{
    public int hp;
    public int attack;
}
```

- **PacketID**:
    - 패킷 종류를 정의하는 열거형으로, 패킷의 식별자 역할을 수행.

```csharp
public enum PacketID
{
    PlayerInfoReq = 1,
    PlayerInfoOk = 2,
}
```

---

## 3. DummyClient 구현

### 진행 상황
- `ServerSession` 클래스에서 패킷 요청(`PlayerInfoReq`)을 서버로 전송하는 기능을 구현.
### 코드 분석

```csharp
class PlayerInfoReq : Packet
{
    public long playerId;
}

class ServerSession : PacketSession
{
    public override void OnConnected(EndPoint endPoint)
    {
        Console.WriteLine($"OnConnected: {endPoint}");

        PlayerInfoReq packet = new PlayerInfoReq()
        {
            size = 12, // [size(2)] + [packetId(2)] + [playerId(8)]
            packetId = (ushort)PacketID.PlayerInfoReq,
            playerId = 1001
        };

        ArraySegment<byte> s = SendBufferHelper.Open(4096);
        ushort count = 0;
        bool success = true;

        count += 2; // Header size 공간 확보
        success &= BitConverter.TryWriteBytes(new Span<byte>(s.Array, s.Offset + count, s.Count - count), packet.packetId);
        count += 2; // Packet ID 공간 확보
        success &= BitConverter.TryWriteBytes(new Span<byte>(s.Array, s.Offset + count, s.Count - count), packet.playerId);
        count += 8; // Player ID 공간 확보

        success &= BitConverter.TryWriteBytes(new Span<byte>(s.Array, s.Offset, s.Count), count); // 전체 패킷 크기 설정

        ArraySegment<byte> sendBuff = SendBufferHelper.Close(count);

        if (success)
            Send(sendBuff);

        Disconnect();
    }

    public override void OnRecvPacket(ArraySegment<byte> buffer)
    {
        ushort size = BitConverter.ToUInt16(buffer.Array, buffer.Offset);
        ushort id = BitConverter.ToUInt16(buffer.Array, buffer.Offset + 2);
        Console.WriteLine($"RecvPacketId: {id}, Size: {size}");
    }
}
```
---
## 4. Server 측 구현

### 진행 상황
- 클라이언트가 요청한 `PlayerInfoReq` 패킷을 수신하고, 해당 데이터를 파싱하여 응답을 처리.
### 코드 분석

```csharp
class PlayerInfoReq : Packet
{
    public long playerId;
}

class ClientSession : PacketSession
{
    public override void OnRecvPacket(ArraySegment<byte> buffer)
    {
        ushort count = 0;

        ushort size = BitConverter.ToUInt16(buffer.Array, buffer.Offset);
        count += 2; // Header size 읽기

        ushort id = BitConverter.ToUInt16(buffer.Array, buffer.Offset + count);
        count += 2; // Packet ID 읽기

        switch ((PacketID)id)
        {
            case PacketID.PlayerInfoReq:
                {
                    long playerId = BitConverter.ToInt64(buffer.Array, buffer.Offset + count);
                    count += 8; // Player ID 읽기

                    Console.WriteLine($"PlayerInfoReq: {playerId}");
                }
                break;
        }

        Console.WriteLine($"RecvPacketId: {id}, Size: {size}");
    }
}
```

---

## 3. 실행 결과

### **DummyClient 실행 결과**

```
OnConnected: [~~~~]:7777
Transferred bytes: 12
OnDisconnected: [~~~~]:7777
```

### **Server 실행 결과**

```
서버가 클라이언트를 기다리고 있습니다...
OnConnected: [~~~~]:55257
PlayerInfoReq: 1001
RecvPacketId: 1, Size: 12
OnDisconnected: [~~~~]:55257
```

---
## 4. 추후 고려사항

- **보안 강화**:
    - 패킷 크기 조작이나 ID 위변조를 방지하기 위한 데이터 검증 로직 필요.
- **패킷 관리 자동화**:
    - 패킷 정의를 XML/JSON 파일에 작성하고, 이를 자동으로 직렬화/역직렬화하는 시스템 도입 검토.