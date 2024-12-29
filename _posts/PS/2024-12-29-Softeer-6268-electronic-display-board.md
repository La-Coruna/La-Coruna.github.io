---
title: "[21년 재직자 대회 예선] 전광판"
categories:
  - PS
  - Softeer
comments: true
tags:
  - Simulation
toc: true
toc_sticky: true
---
## 🔗Link
{:.no-top-margin}
[문제](https://softeer.ai/practice/6268)  
[풀이1](https://github.com/La-Coruna/PS/blob/main/softeer/21%EB%85%84%20%EC%9E%AC%EC%A7%81%EC%9E%90%20%EB%8C%80%ED%9A%8C%20%EC%98%88%EC%84%A0/6268_1.cpp)  
[풀이2](https://github.com/La-Coruna/PS/blob/main/softeer/21%EB%85%84%20%EC%9E%AC%EC%A7%81%EC%9E%90%20%EB%8C%80%ED%9A%8C%20%EC%98%88%EC%84%A0/6268_2.cpp)  
## 💡Idea
간단한 시뮬레이션 문제.  
숫자 0~9외에 공백도 고려해야 함.

## 🔑Code
```c++
#include <bits/stdc++.h>
using namespace std;

bool digit[11][7] = {
    /*
     0
    1 2
     3
    4 5
     6
    */

    // 0
    {1,
    1,1,
     0,
    1,1,
     1},
    
    // 1
    {0,
    0,1,
     0,
    0,1,
     0},
    
    // 2
    {1,
    0,1,
     1,
    1,0,
     1},
    
    // 3
    {1,
    0,1,
     1,
    0,1,
     1},
    
    // 4
    {0,
    1,1,
     1,
    0,1,
     0},
    
    // 5
    {1,
    1,0,
     1,
    0,1,
     1},
    
    // 6
    {1,
    1,0,
     1,
    1,1,
     1},
    
    // 7
    {1,
    1,1,
     0,
    0,1,
     0},
    
    // 8
    {1,
    1,1,
     1,
    1,1,
     1},
    
    // 9
    {1,
    1,1,
     1,
    0,1,
     1},

    // x
    {0,
    0,0,
     0,
    0,0,
     0},
};

int compare1Digit(int a, int b){
    int cnt = 0;
    for(int i = 0; i < 7; i++){
        if(digit[a][i] != digit[b][i]) cnt++;
    }
    return cnt;
}

int compareAllDigit(int A, int B){
    int cnt = 0, a, b;
    for(int i = 0; i < 5; i++){
        // A
        if(A != 0){
            a = A % 10;
            A /= 10;
        } else
            a = 10;
        // B
        if(B != 0){
            b = B % 10;
            B /= 10;
        } else
            b = 10;
        // compare
        cnt += compare1Digit(a,b);
    }
    return cnt;
}

int main(void){
    ios_base::sync_with_stdio(0);
    cin.tie(0);

    int T, A, B;
    cin >> T;
    while(T--){
        cin >> A >> B;
        cout << compareAllDigit(A,B) << '\n';
    }

    return 0;
}
```

## 🗨️ Side Notes
C++에서 배열이나 객체를 선언할 때 마지막 요소 뒤에 쉼표(`,`)를 붙여도 된다.  
C++ 초기 버전인 **C++98** 와 **C++03** 에서는 안 됐었지만 **C++11** 이후로는 가능하다.