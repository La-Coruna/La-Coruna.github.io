---
title: "[21년 재직자 대회 예선] 비밀 메뉴"
categories:
  - PS
  - Softeer
comments: true
tags:
  - string
  - pattern_matching
  - strstr
  - find
---
# 🔗Link
[문제](https://softeer.ai/practice/6269)  
[풀이1](https://github.com/La-Coruna/PS/blob/main/softeer/21%EB%85%84%20%EC%9E%AC%EC%A7%81%EC%9E%90%20%EB%8C%80%ED%9A%8C%20%EC%98%88%EC%84%A0/6269_1.cpp)  
[풀이2](https://github.com/La-Coruna/PS/blob/main/softeer/21%EB%85%84%20%EC%9E%AC%EC%A7%81%EC%9E%90%20%EB%8C%80%ED%9A%8C%20%EC%98%88%EC%84%A0/6269_2.cpp)  
# 💡Idea
패턴 매칭 문제이다.  
바로 string에 find를 사용하는 풀이가 떠올랐다.  
사용자가 누른 조작에서 비밀 메뉴 조작법이 들어있는지 매칭해보면 된다.  
혹은 strstr를 사용할 수도 있겠다.  
g++환경에서 strstr함수가 KMP처럼 문자열과 패턴의 길이에 대한 선형시간에 매칭 결과를 준다고 한다.

# 🔑Code
```c++
#include <bits/stdc++.h>
using namespace std;

int main(void){
    ios_base::sync_with_stdio(0);
    cin.tie(0);

    string secretCode, order, input;
    int M, N, K;
    cin >> M >> N >> K;
    for(int  i = 0; i < M; i++){
        cin >> input;
        secretCode += input;
    }

    for(int  i = 0; i < N; i++){
        cin >> input;
        order += input;
    }

    if(order.find(secretCode) == string::npos)
        cout << "normal";
    else
        cout << "secret";
    
    return 0;
}
```

# 🗨️ Side Notes
`find` 함수는 문자열을 찾는데 성공하였다면, 해당 문자열의 시작 위치 를 반환하고, 찾지 못한다면 상수 `string::npos` 를 반환한다.  
`npos`는 **no position**의 약자로 유효한 위치가 없다는 의미이다.