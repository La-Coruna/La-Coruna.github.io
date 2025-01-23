---
title: "[BOJ 2110] 공유기 설치"
categories:
  - PS
  - BOJ
comments: true
tags:
  - binary search
  - parametric search
toc: true
toc_sticky: true
---
## 🔗Link
{:.no-top-margin}
[문제](https://boj.kr/2110)  
[풀이](https://github.com/La-Coruna/PS/blob/main/baekjoon/2110.cpp)  
## 💡Idea
"C개의 공유기를 N개의 집에 적당히 설치해서, 가장 인접한 두 공유기 사이의 거리를 최대로 하는 프로그램을 작성하시오."
{: .my_notice}
<br>**가장 인접한 두 공유기 사이의 거리를 최대로** 하는 **최적화 문제**{: .text-blue}를 **가장 인접한 두 공유기 사이의 거리를 X로 했을 때 주어진 개수만큼 공유기 설치가 가능한가**의 **결정 문제**{: .text-green}로 바꾸어 풀어야 한다.

## 🔑Code
```c++
#include <bits/stdc++.h>
using namespace std;

int N, C;
int x[200'001];

bool solve(int minDist){
    int cnt = 1; // 맨 처음 집에 하나 설치
    int prev = 0;
    int cur = 1;
    while(cur < N){
        if(x[cur] - x[prev] >= minDist){
            if(++cnt == C)
                return true;
            prev = cur++;
        } else
            cur++;
    }
    return false;
}

int main(void){
    ios_base::sync_with_stdio(0);
    cin.tie(0);

    cin >> N >> C;
    for(int i = 0; i < N; i++){
        cin >> x[i];
    }

    int st = 1;
    int en = x[N-1] - x[0];
    sort(x, x+N);
    while(st < en){
        int mid = (st + en+1)/2;
        if(solve(mid))
            st = mid;
        else
            en = mid - 1;
    }
    cout << st;

    return 0;
}
```

## 🗨️ Side Notes
이분탐색을 구현할 때, 무한 루프에 빠지지 않도록 다음을 주의해야 한다.
- 탐색 종료 조건
- 가운데 지점(mid)을 구하는 방법
	> - st와 en이 1차이 날 때 어떻게 동작하는지 살펴보면 쉽다.
	> - mid = (st + en) / 2 의 경우, st와 en이 1차이 날 때 mid는 st가 됨.
	> - mid = (st + en + 1)/2의 경우, st와 en이 1차이 날 때 mid는 en이 됨.
- 시작 지점(st)와 끝 지점(en)의 갱신 방법

### 예시
- **값을 찾는 이분탐색**: `st`와 `en`의 업데이트에서 항상 범위가 줄어들도록 갱신.
```c++
while(st <= en){
	int mid = (st + en)/2;
	if (target == mid) return true;
	else if(target > mid)
		st = mid + 1;
	else
		en = mid - 1;
}
return false;
```

- **Parametric Search**: `mid` 계산을 `(st + en + 1) / 2`로 하여, `st`와 `en`의 차이가 1인 경우에도 무한 루프에 빠지지 않고 올바르게 작동함.
```c++
while(st < en){
	int mid = (st + en+1)/2;
	if(solve(mid))
		st = mid;
	else
		en = mid - 1;
}
```