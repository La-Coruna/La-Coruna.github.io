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
**C# Socket Programming TIL: struct list 변수의 직렬화**

---
## 1. 진행 상황

- 구조체 리스트를 직렬화하고 이를 패킷으로 처리할 수 있는 구조를 구현.
- `PlayerInfoReq` 패킷에 `skills` 리스트 필드를 추가하여 직렬화 및 역직렬화 로직 작성.

---

## 2. 코드 분석

### 1) 구조체 리스트 직렬화 구현
`PlayerInfoReq`클래스에 `SkillInfo` 구조체를 정의하고, 해당 구조체 안에 버퍼에 읽고 쓰는 `Read()`와 `Write()`함수를 구현하였다.
- `Write`: 구조체 데이터를 `Span<byte>`에 기록.
- `Read`: `ReadOnlySpan<byte>`에서 데이터를 읽어 구조체를 복원.

```csharp
class PlayerInfoReq : Packet
{
	public struct SkillInfo
	{
	    public int id;
	    public short level;
	    public float duration;
	
	    public bool Write(Span<byte> s, ref ushort count)
	    {
	        bool success = true;
	
	        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), this.id);
	        count += sizeof(int);
	        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), this.level);
	        count += sizeof(short);
	        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), this.duration);
	        count += sizeof(float);
	
	        return success;
	    }
	
	    public void Read(ReadOnlySpan<byte> s, ref ushort count)
	    {
	        this.id = BitConverter.ToInt32(s.Slice(count, s.Length - count));
	        count += sizeof(int);
	        this.level = BitConverter.ToInt16(s.Slice(count, s.Length - count));
	        count += sizeof(short);
	        this.duration = BitConverter.ToSingle(s.Slice(count, s.Length - count));
	        count += sizeof(float);
	    }
	}
	/* 생략 */
}
```

---

### 2) PlayerInfoReq 패킷

**for문**을 돌며, 각 `SkillInfo` 구조체 원소별로 구조체 내부에 정의한 `Read()`와 `Write()`를 호출하여 데이터를 읽고 씀.

```csharp
class PlayerInfoReq : Packet
{
    public long playerId;
    public string name;
    public List<SkillInfo> skills = new List<SkillInfo>();

    public override void Read(ArraySegment<byte> segment)
    {
        ushort count = 0;
        ReadOnlySpan<byte> s = new Span<byte>(segment.Array, segment.Offset, segment.Count);

        count += sizeof(ushort); // size
        count += sizeof(ushort); // packetId

        // playerId와 name는 생략

		// skills
        ushort skillCount = BitConverter.ToUInt16(s.Slice(count, s.Length - count));
        count += sizeof(ushort);
        for (int i = 0; i < skillCount; i++)
        {
            SkillInfo skill = new SkillInfo();
            skill.Read(s, ref count);
            this.skills.Add(skill);
        }
    }

    public override ArraySegment<byte> Write()
    {
        ArraySegment<byte> segment = SendBufferHelper.Open(4096);

        ushort count = 0;
        bool success = true;

        Span<byte> s = new Span<byte>(segment.Array, segment.Offset, segment.Count);

        // size
        count += sizeof(ushort);

        // packetId
        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), this.packetId);
        count += sizeof(ushort);

        // playerId와 name는 생략
		
        // skills
        success &= BitConverter.TryWriteBytes(s.Slice(count, s.Length - count), (ushort)this.skills.Count);
        count += sizeof(ushort);
        foreach (SkillInfo skill in this.skills)
            success &= skill.Write(s, ref count);

        // 헤더에 size 기록
        success &= BitConverter.TryWriteBytes(s, count);

        if (!success)
            return null;

        return SendBufferHelper.Close(count);
    }
}
```

---

## 3. 실행 결과

```plaintext
OnConnected: [fe80::75d0:c382:a9b5:5a58%7]:7777
Transferred bytes: 64
OnDisconnected: [fe80::75d0:c382:a9b5:5a58%7]:7777

서버가 클라이언트를 기다리고 있습니다...
OnConnected: [fe80::75d0:c382:a9b5:5a58%7]:51979
PlayerInfoReq: 1001 ABCD
Skill(101)(1)(3)
Skill(201)(2)(4)
Skill(301)(3)(5)
Skill(401)(4)(6)
RecvPacketId: 1, Size: 64
OnDisconnected: [fe80::75d0:c382:a9b5:5a58%7]:51979
```

# 4. 마무리
다음으로는 패킷을 만드는 과정을 자동화하여 반복적인 작업을 최소화하겠다.