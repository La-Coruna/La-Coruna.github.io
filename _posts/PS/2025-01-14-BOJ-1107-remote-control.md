---
title: "[BOJ 1107] 리모컨"
categories:
  - PS
  - BOJ
comments: true
tags:
  - simulation
toc: true
toc_sticky: true
---
## 🔗Link
{:.no-top-margin}
[문제](https://boj.kr/1107)  
[풀이](https://github.com/La-Coruna/PS/blob/main/baekjoon/1107.cpp)  
## 💡Idea
주의해야 하는 케이스가 많다.
1. 누를 수 있는 인접한 채널이 자릿수가 다른 경우
	- 인접한 채널로 숫자 버튼을 눌러 이동할 때, 원하는 채널보다 자릿수가 하나 크거나 작을 수 있다.
2. 숫자 버튼이 전부 고장난 경우
3. 0번만 누를 수 있는 경우

## 🔑Code
```c++
#include <bits/stdc++.h>
using namespace std;

int N, M; // (0 ≤ N ≤ 500,000)
bool isBroken[10];
bool hasBigNum = true;
bool hasSmallNum = true;

bool hasBroken(int num){
    if(num == 0) return isBroken[0]; // 이거 빼먹어서 틀렸었음.
    while(num != 0){
        if(isBroken[(num % 10)])
            return true;
        num /= 10;
    }
    return false;
}

int FindBigger(int N){
    // 0번만 누를 수 있는 경우, 더 큰 숫자 못 만듬.
    if(M==9 && !isBroken[0]){
        hasBigNum = false;
        return -1;
    }
    while(hasBroken(N)) N++;
    return N;
}

int FindSmaller(int N){
    while(hasBroken(N) && N >=0) N--;
    if(N < 0){
        // 0까지 훑어봤는데, 가능한 숫자가 없음.
        hasSmallNum = false;
        return -1;
    }
    return N;
}

int CalDigits(int N){
    if(N==0) return 1;
    int i = 0;
    while(N!=0){
        N /= 10;
        i++;
    }
    return i;
}

int main(void){
    ios_base::sync_with_stdio(0);
    cin.tie(0);

    cin >> N >> M;
    
    int directBtnCnt = abs(N - 100);
    if(M == 10){
        cout << directBtnCnt;
        return 0;
    }

    for(int i = 0; i < M; i++){
        int btn;
        cin >> btn;
        isBroken[btn] = true;
    }

    int bigNum = FindBigger(N);
    int smallNum = FindSmaller(N);

    int bigNumCnt = CalDigits(bigNum) + (bigNum - N);
    int smallNumCnt = CalDigits(smallNum) + (N - smallNum);

    int ans = directBtnCnt;
    if(hasBigNum) ans = min(ans, bigNumCnt);
    if(hasSmallNum) ans = min(ans, smallNumCnt);

    cout << ans;

    return 0;
}
```

## 🗨️ Side Notes
테스트 케이스들을 모아봤다.
```
889
9  
0 2 3 4 5 6 7 8 9  
ans: 226  
```
  
```
10  
1  
0  
ans: 2  
```

```
1555  
8  
0 1 3 4 5 6 7 9  
ans: 670  
```

```
0  
9  
1 2 3 4 5 6 7 8 0  
ans: 10
```