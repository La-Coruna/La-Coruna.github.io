---
title: "[C#][Server] 10. PacketSession"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: PacketSession 클래스 구현**

---

## 1. 진행 상황

- `PacketSession` 클래스를 도입하여 패킷 기반의 데이터를 처리할 수 있도록 구현하였다.
- 기존의 `Session` 클래스에서 데이터 송수신을 처리하던 방식을 확장하여, 데이터의 헤더와 패킷 ID를 기반으로 처리하도록 개선하였다.

---

## 2. 주요 변경 사항

### **1) PacketSession 클래스 도입**

#### **역할**

- 수신된 데이터를 바이트 단위로 처리하여, 패킷 단위로 분리하고 이를 전달하는 역할을 수행.
- 헤더 정보(패킷 크기와 ID)를 기반으로 패킷의 경계를 파악하여 안정적으로 데이터를 처리.

#### **코드**

```csharp
public abstract class PacketSession : Session
{
    public static readonly int HeaderSize = 2;
    // [size(2)][packetId(2)][ ... ]
    public sealed override int OnRecv(ArraySegment<byte> buffer)
    {
        int processLen = 0;

        while (true)
        {
            // 최소한 헤더는 파싱할 수 있는지 확인
            if (buffer.Count < HeaderSize)
                break;

            // 패킷이 완전체로 도착했는지 확인
            ushort dataSize = BitConverter.ToUInt16(buffer.Array, buffer.Offset);
            if (buffer.Count < dataSize)
                break;

            // 여기까지 왔으면, 패킷 조립 가능
            OnRecvPacket(new ArraySegment<byte>(buffer.Array, buffer.Offset, dataSize));

            processLen += dataSize;
            buffer = new ArraySegment<byte>(buffer.Array, buffer.Offset + dataSize, buffer.Count - dataSize);
        }

        return processLen;
    }

    public abstract void OnRecvPacket(ArraySegment<byte> buffer);
}
```

#### **주요 메서드**

1. **`OnRecv(ArraySegment<byte> buffer)`**:
    - 수신된 데이터를 반복적으로 읽어 패킷 단위로 분리.
    - 헤더를 읽고 패킷의 경계를 파악하여 처리.
    - 반환된 `processLen`값만큼 `_recvBuffer`의 Read커서(`_readPos`)가 이동하게 됨.
    - 처리되지 못한 데이터는 `_recvBuffer`에 남아 있음.
1. **`OnRecvPacket(ArraySegment<byte> buffer)`**:
    - 각 패킷 데이터를 처리하는 추상 메서드로, 세션별로 구체적인 로직을 구현하도록 강제.

---

### **2) GameSession 클래스 변경**

#### **변경 내용**

- `PacketSession`을 상속받아 패킷 단위로 데이터를 처리하도록 구현.
- 클라이언트에서 전송된 패킷의 ID와 크기를 로그로 출력.

#### **코드**

```csharp
class GameSession : PacketSession
{
    public override void OnConnected(EndPoint endPoint)
    {
        Console.WriteLine($"OnConnected: {endPoint}");

        Thread.Sleep(5000);
        Disconnect();
    }

    public override void OnDisconnected(EndPoint endPoint)
    {
        Console.WriteLine($"OnDisconnected: {endPoint}");
    }

    public override void OnRecvPacket(ArraySegment<byte> buffer)
    {
        ushort size = BitConverter.ToUInt16(buffer.Array, buffer.Offset);
        ushort id = BitConverter.ToUInt16(buffer.Array, buffer.Offset + sizeof(ushort));
        Console.WriteLine($"RecvPacketId: {id}, Size: {size}");
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
Transferred bytes: 4
Transferred bytes: 4
Transferred bytes: 4
Transferred bytes: 4
Transferred bytes: 4
OnDisconnected: [~~~~]:7777
```

### **서버 실행 결과**

```
서버가 클라이언트를 기다리고 있습니다...
OnConnected: [~~~~]:55257
RecvPacketId: 7, Size: 4
RecvPacketId: 7, Size: 4
RecvPacketId: 7, Size: 4
RecvPacketId: 7, Size: 4
RecvPacketId: 7, Size: 4
OnDisconnected: [~~~~]:55257
```