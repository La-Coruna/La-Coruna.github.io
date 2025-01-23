---
title: "[C#][Server] 8. RecvBuffer"
categories:
  - C#
  - Server
comments: true
tags:
  - socket
toc: true
toc_sticky: true
---
**C# Socket Programming TIL: RecvBuffer 클래스 도입과 기능 개선**

---

## 1. 진행 상황

- `RecvBuffer` 클래스를 도입하여 네트워크 수신 버퍼의 효율성을 개선하였다.
- 수신 데이터를 처리하는 기존의 단순 배열 방식에서 `RecvBuffer`를 활용한 방식으로 전환하였다.

---

## 2. 주요 변경 사항

### 1) RecvBuffer 클래스의 도입

#### 역할

- 네트워크 데이터를 효율적으로 관리하기 위해 가변적인 읽기/쓰기 영역을 제공.
- 데이터를 수신하는 과정에서 **읽기(write)**와 **처리(read)**를 명확히 구분하여 데이터 손실 방지.
#### 주요 메서드 및 동작

- **`ReadSegment`**: 아직 처리되지 않은, 읽어야 할 데이터 영역을 반환.
- **`WriteSegment`**: 데이터를 새로 기록할 수 있는 영역을 반환.
- `Clean`: Read커서와 Write커서를 앞쪽으로 당김.
- **`OnRead`**: 처리된 데이터의 길이를 전달, Read 커서 업데이트.
- **`OnWrite`**: 실제로 데이터를 기록한 바이트 수를 전달, Write 커서 업데이트.
#### RecvBuffer 코드

```csharp
public class RecvBuffer
{
    ArraySegment<byte> _buffer;
    int _readPos;  // Read 커서
    int _writePos; // Write 커서

    public RecvBuffer(int bufferSize)
    {
        _buffer = new ArraySegment<byte>(new byte[bufferSize], 0, bufferSize);
    }

    public int DataSize { get { return _writePos - _readPos; } }
    public int FreeSize { get { return _buffer.Count - _writePos; } }

    public ArraySegment<byte> ReadSegment
    {
        get { return new ArraySegment<byte>(_buffer.Array, _buffer.Offset + _readPos, DataSize); }
    }
    public ArraySegment<byte> WriteSegment
    {
        get { return new ArraySegment<byte>(_buffer.Array, _buffer.Offset + _writePos, FreeSize); }
    }

    public void Clean()
    {
        int dataSize = DataSize;
        if (dataSize == 0)
        {
            _readPos = _writePos = 0;
        }
        else
        {
            Array.Copy(_buffer.Array, _buffer.Offset + _readPos, _buffer.Array, _buffer.Offset, DataSize);
            _readPos = 0;
            _writePos = dataSize;
        }
    }

    public bool OnRead(int numOfBytes)
    {
        if (numOfBytes > DataSize)
            return false;
        _readPos += numOfBytes;
        return true;
    }

    public bool OnWrite(int numOfBytes)
    {
        if (numOfBytes > FreeSize)
            return false;
        _writePos += numOfBytes;
        return true;
    }
}
```

---

### 2) Session 클래스 변경 사항

`RegisterRecv` 및 `OnRecvCompleted` 로직이 `RecvBuffer`에 맞게 변경.
#### 변경 전

- 고정 크기의 버퍼를 사용하여 데이터를 수신하고 처리.
- 유연성이 부족하며, 데이터가 여러 번에 걸쳐 들어올 경우 관리가 어려움
	- TCP 특성에 의해 데이터가 일부만 먼저 전달되고 나머지는 늦게 올 수 있음.

```csharp
public void Start(Socket socket)
{
	_recvArgs.SetBuffer(new byte[1024], 0, 1024);
}

void RegisterRecv()
{
    bool pending = _socket.ReceiveAsync(_recvArgs);
    if (!pending)
        OnRecvCompleted(null, _recvArgs);
}

void OnRecvCompleted(object sender, SocketAsyncEventArgs args)
{
	// (생략)
    OnRecv(new ArraySegment<byte>(args.Buffer, args.Offset, args.BytesTransferred));
    RegisterRecv();
    // (생략)
}
```

#### 변경 후

- `RecvBuffer`를 사용하여 데이터를 효율적으로 관리.

```csharp
public void Start(Socket socket)
{
	// _recvArgs.SetBuffer(new byte[1024], 0, 1024); // 삭제
}

void RegisterRecv()
{
	_recvBuffer.Clean();
	ArraySegment<byte> segment = _recvBuffer.WriteSegment;
	_recvArgs.SetBuffer(segment.Array, segment.Offset, segment.Count);
	
    bool pending = _socket.ReceiveAsync(_recvArgs);
    if (!pending)
        OnRecvCompleted(null, _recvArgs);
}

void OnRecvCompleted(object sender, SocketAsyncEventArgs args)
{
	// (생략)
    if (!_recvBuffer.OnWrite(args.BytesTransferred))
    {
        Disconnect();
        return;
    }

    int processLen = OnRecv(_recvBuffer.ReadSegment);
    if (processLen < 0 || processLen > _recvBuffer.DataSize)
    {
        Disconnect();
        return;
    }

    if (!_recvBuffer.OnRead(processLen))
    {
        Disconnect();
        return;
    }

    RegisterRecv();
    // (생략)
}
```

---

### 3) OnRecv 메서드 변경

#### 변경 전

- 데이터를 수신하여 단순히 로그로 출력.

```csharp
public override void OnRecv(ArraySegment<byte> buffer)
{
    string recvData = Encoding.UTF8.GetString(buffer.Array, buffer.Offset, buffer.Count);
    Console.WriteLine($"[From Client] {recvData}");
}
```

#### 변경 후

- 데이터를 처리한 길이 또한 반환하도록 변경.
- 이 값을 인자로 `RecvBuffer`에서 `OnRead()`실행.

```csharp
public override int OnRecv(ArraySegment<byte> buffer)
{
    string recvData = Encoding.UTF8.GetString(buffer.Array, buffer.Offset, buffer.Count);
    Console.WriteLine($"[From Client] {recvData}");
    return buffer.Count;
}
```

---

## 3. 개선 효과

1. **유연성 향상**: 고정 크기 배열에서 가변적인 버퍼 관리 방식으로 전환하여 대규모 네트워크 트래픽 처리에 유리.
2. **안정성 증가**: 데이터 손실 방지 및 비정상 데이터 처리 시 연결 해제 로직 추가.