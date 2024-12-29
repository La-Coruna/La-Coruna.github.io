---
title: 한 장으로 끝내는 코딩 테스트
last_modified_at: 2024-09-03T00:02:00+09:00
categories: [PS]
comments: true
tags:
toc: true
toc_sticky: true
---
## 서론
이 포스팅 한 장으로 코딩 테스트 끝내자.

## 자료구조
- Array
- Linked List
- Stack
- Queue
- Deque
- Hash
- Binary Search Tree
- ### Priority Queue 
  - priority queue는 '원소 추가', '우선순위가 가장 높은 원소 확인', '우선순위가 가장 높은 원소 제거'의 기능을 제공한다.
  - heap을 통해 구현하면, O(lgN), O(1), O(lgN)의 시간 복잡도를 가지게 된다.
  - stl::priority_queue
```cpp
// max-heap
std::priority_queue<int> maxHeap;
// min-heap
std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
```
- ### Graph
  - 인접 행렬 : 두 점의 연결 여부를 자주 확인할 때, E가 V^2에 가까울 때 효율적
  - 인접 리스트 : 특정 정점에 연결된 모든 정점을 자주 확인할 때, E가 V^2보다 훨씬 작을 때 효율적

- ### Tree
  - 부모 배열 채우기 (트리에선 BFS나 DFS할 때 부모인지 아닌지로 함)
  - depth 배열 채우기
  - 레벨 순회, 전위/중의/후의 순회


## 알고리즘
- BFS, DFS
- Recursion
- Backtracking
- Simulation
- Sorting
- ### Dynamic Programing
  DP 문제를 푸는 과정
  1. 테이블 정의하기
  2. 점화식 찾기
  3. 초기값 정하기
   
  - #### LCS
    ---
    - **dp[i] 정의**   

      D[i][j] : A[i]와 B[j]까지 비교했을 때의 LCS 길이.
      {: .my_notice}

	- **점화식**  
  
      <div class="my_notice" markdown="1">
	    **case 1)** A[i] == B[j]  
          &emsp;&rarr; D[i][j] = D[i-1][j-1] + 1  
	    **case 2)** A[i] != B[j]  
          &emsp;&rarr; D[i][j] = max(D[i-1][j], D[i][j-1])  
        - AC'A'와 CA'P'를 비교할 때, A와 P가 다르기 때문에, 'ACA와 CA -> AC(2)'의 경우와 'AC와 CAP -> A(1)'의 경우 중 더 긴 전자를 선택해야함.
      

    - **초기값**  

      d[0][i]와 dp[i][0]을 전부 0으로 초기화.
      {: .my_notice}

    - **예제 코드**
        ```cpp
        string A, B;
        cin >> A >> B;

        int len_A = A.length();
        int len_B = B.length();

        for(int i = 1; i <= len_A; i++){
          for(int j = 1; j <= len_B; j++){
            if(A[i-1] == B[j-1]) dp[i][j] = dp[i-1][j-1] +1;
            else dp[i][j] = max(dp[i][j-1], dp[i-1][j]);
          }
        }

        cout << dp[len_A][len_B];
        ```
   
- Greedy
- ### Math
  - ### 소수
    ```cpp
    //  O(√n)
    bool isPrime(int n){
        if(n == 1) return 0;
        for(int i = 2; i*i <= n; i++)
            if(n % i == 0) return false;
        return true;
    }
    ```
    ```cpp
    // O(nlglgn)
    vector<bool> isPrime(10000, true);
    void sieve(int n){
        isPrime[1] = false;
        for(int i = 2; i * i <= n; i++){
            if(!isPrime[i]) continue;
            for(int j = i*i; j <= n; j += i)
                isPrime[i] = false;
        }
    }
    ```
  - 
  - 
- Binary Search
- Two Pointers

## Graph 관련
- ### Topological sorting
  사이클이 없는 방향 그래프에서만 올바른 위상 정렬이 존재한다.
  - 구현 : indgree 배열, indgree가 0인 정점들의 큐
- ### Minimum Spanning Tree
  - 신장 트리: 주어진 방향성이 없는 그래프의 부분 그래프들 중에서, 모든 정점을 포함하는 트리
  - 최소 신장 트리: 신장 트리들 중에서 간선 비용의 합이 최소인 트리 
	#### 1. 크루스칼 알고리즘
	특정 두 정점이 같은 그룹인지 다른 그룹인지 알 수 있어야 함.
	이 방법으로 2가지가 있는데, (1) Flood Fill (2) Union Find
	Union Find를 이용하면 O(ElgE)로 구현 가능.
	#### 2. 프림 알고리즘
	우선순위 큐를 사용하여 구현
- ### Floyd's Algorithm
  - 모든 정점 쌍 사이의 최단 거리를 구해주는 알고리즘
  - 방향 무방향 상관 x, 음수 간선 ㄱㅊ, 음수 사이클은 문제
  - D[s][1] + D[1][t] = s에서 1을 거쳐서 t로 가는 비용
  - brute force로 구현 가능 (3중 for문)

- ### Dijkstra's Algorithm
  - 다익스트라 알고리즘은 하나의 시작점으로부터 다른 모든 정점까지의 최단 거리를 구하는 알고리즘
  - 다익스트라 알고리즘은 음수의 가중치를 가지는 간선이 있으면 아예 사용을 할 수가 없다.
  - 시작 점으로부터 거리가 가장 짧은 노드를 확정해 나가는 식으로 작동.
  - 거리(가중치)와 이어진 정점을 저장하는 priority queue로 구현 가능.
    ```csharp
    #include <bits/stdc++.h>
    using namespace std;

    #define X first
    #define Y second

    #define INF 4'000'000

    int V, E, K;
    vector<pair<int,int>> adj[20'001];
    priority_queue< pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>> > pq;
    int d[20'001];

    int main(void){
      ios_base::sync_with_stdio(0);
      cin.tie(0);

      cin >> V >> E >> K;

      for(int i = 0; i < E; i++){
          int u, v, w;
          cin >> u >> v >> w;
          adj[u].emplace_back(w,v);
      }
      fill(d+1, d+1+V, INF);

      d[K] = 0;
      pq.push({0,K});
      while(!pq.empty()){
          auto cur = pq.top(); pq.pop();
          int cur_dist = cur.X, cur_idx = cur.Y;
          if(cur_dist != d[cur_idx]) continue;
          for(auto e: adj[cur_idx]){
              int nxt_dist = cur_dist + e.X, nxt_idx = e.Y;
              if(nxt_dist >= d[nxt_idx]) continue;
              d[nxt_idx] = nxt_dist;
              pq.push({nxt_dist, nxt_idx});
          }
      }

      for(int i = 1; i <= V; i++){
          if(d[i] == INF) cout << "INF\n";
          else cout << d[i] << '\n';
      }
      
      return 0;
    }
    ```

- KMP Algorithm
- Trie Algorithm

---

## 문자열 관련
- 문자열 기본 함수
- ### Pattern Matching
  - #### std::strstr
  단순하게 패턴의 등장 여부만 확인해야 한다면, g++ 기준 선형으로 동작하는 strstr 함수를 사용하면 된다.
    ```csharp
    #include <iostream>
    #include <cstring>
    #include <string>

    int main() {
        std::string text = "hello world";
        std::string pattern = "world";

        const char* found = strstr(text.c_str(), pattern.c_str());

        if (found) {
            std::cout << "Pattern found at index: " << found - text.c_str() << std::endl;
        } else {
            std::cout << "Pattern not found" << std::endl;
        }

        return 0;
    }
    ```
  - #### KMP Algorithm
- ### Trie

## 구현 팁
- ### 홀수 판별
  ```cpp
  if(num & 1) cout << "홀수";
  else cout << "짝수";
```
- ### 순열
  `stl::next_permutation()`을 사용하면 쉽게 구현할 수 있다. **단, 대상 배열이 정렬되어 있어야 모든 경우의 수가 구해진다.**
  ```cpp
    vector<int> arr = {1,2,3};
    do
    {
        for(int n : arr) cout << n;
        cout << '\n';
    } while(next_permutation(arr.begin(), arr.end()));
```
	
	**결과**  
	123  
	132  
	213  
	231  
	312  
	321  
	{: .notice}

- ### 조합
  0과 1로 이루어진 배열의 순열들을 `stl::next_permutation()`로 순회하고, 0일 때 뽑힌 것으로 구현하면 된다. **0일 때 뽑힌 것으로 해야, 오름차순으로 정렬이 된다. 또한, 순회 시작 시 bool 배열이 정렬되어 있어야 모든 경우의 수가 구해진다.**
  ```cpp
    vector<int> arr = {1,2,3,4};
    vector<bool> passed = {0,0,1,1}; // 4C2
    do
    {
        for(int i = 0; i < arr.size(); i++){
	        if(!passed[i]) cout << arr[i];
        }
        cout << '\n';
    } while(next_permutation(passed.begin(), passed.end()));
  ```
  > `if(!passed[i]) cout << arr[i];` 임에 주의  
	
	**결과**  
  12
  13
  14
  23
  24
  34
	{: .notice}

---
## 문제 유형과 사용 알고리즘
- 누적합
	- dp
	- 투 포인터

- 배낭문제 (knapsack problem)
	- 1. 분할 가능한 배낭 문제 (fractional knapsack problem) -> Greedy
	- 2. 0-1 배낭 문제 (0-1 Knapsack Problem) -> dp or backtracking


---
## Are you stupid?
멍청한 실수들을 모아뒀다.
머릿속 풀이는 맞지만, 코드로 잘못 옮겨 적은 사례들을 모았다.

1. 지역변수 선언 시, 초기화를 꼭 해주자.
초기화 안한 변수를 사용하며, 왜 안 되지? 시전 금지

특히 자동으로 0을 채워주는 cpp의 전역변수를 자주 사용한다면, 지역변수 사용 시 초기화를 자주 까먹을 수도 있다.

2. 변수 이름 잘못 사용했는지 확인해보자.
아예 없는 변수명을 가져다 쓰면 컴파일 에러가 뜰 텐데, 이미 어딘가에 선언한 변수를 가져와서 쓰면 컴파일은 또 돼서, 뭐가 문제인지 모를 수도 있다.

특히, 좌표를 두고 푸는 문제들에서 for문 안에서 (i,j)와 (x,y) 둘 다 있을 때, 서로를 헷갈려서 반대로 쓰는 경우가 있다.

```cpp
if(nx < 0|| ny< 0|| nx >= h|| ny >= w) continue;
if(vis[i][j] || !board[i][j]) continue;
```
3. 중괄호 좀 잘 써라.
종종 코드가 깔끔하게 보이기 위해, if문과 for문을 한 줄로 적는 경우가 있다.
이 때, 이 코드 뒤에 수평으로 statement를 추가하며, if문과 for문의 범위 내로 작동할 것이라고 생각하는 실수를 하기도 한다.

이런 실수가 빈번하다면, if문과 for문을 한 줄로 쓰지를 말자. 괜히 K&R, Allman 같은 불문율을 깨며, 스스로로를 믿은 안일함에 몇 십분을 할애하고 눈물을 흘리지 말자... 하.. 흑..

```cpp
if(!Q.empty()) cout << Q.front(); Q.pop();
```

4. 0-indexed, 1-indexed
특히 이중 배열 만들었을 때.

5. 문자열 파싱
파싱하는 문제는  파싱 부분 검토
여러자리 숫자가 가능한데 이를 char로 받아서 한 자리씩으로 잘린다든지.