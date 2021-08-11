---
date: 2021-08-08
title: "[Diary] 어찌 됐든 살아가야 한다"
categories: 
    - diary
tags: 
    - goal
    - schedule
toc: true  
toc_sticky: true 
---

의식의 흐름
---
하루가 어찌저찌 흘러가긴 한다. 뒤돌아보면 시간이 빠르게 흐르는 것처럼 느껴지지만, 다시 지나보내야 하는 앞날들을 마주보면 이 시간들이 또 언제 다 흘러가나 싶다. 그렇기에 더더욱 이 거대한 시간들이 다 지나간 후에, 아무것도 건질 수 없었던 짧은 순간처럼 여겨지게 두고 싶지 않다.  
현재 하루 중 자유롭게 사용할 수 있는 시간은 `오전 1시간(불확실)`, `오후 2시간`, `밤 2시간`이다. 주단위 목표를 세우고, 이 목표를 위해 일간 계획을 짤 것이다.

Goal
---
1. 그대와 사이 좋게 다시 보기<br/>
    * 보고 싶다
2. 프론트엔드를 위한 기초 다지기 (with html, css, js)<br/>
    * tetris 만들기
        * SRS 적용
        * multiplayer mode (battle mode) 구현
3. 동적 웹 사이트를 위한 간단한 서버 만들기 (with node.js)<br/>
    * 간단한 discord bot 개발
4. 알고리즘 공부
    * 단계별로 풀어보기
5. Unity 개발을 위한 C# 기초 다지기<br/>
    * 휴가 나가기 3개월 전
6. 나와서 과외할 능력 키우기
    * python...?

Detail
---
1. 그대를 항상 진심으로 대하기
2. js로 게임 만들기 <span style="color:orange">-> 오전에 컴퓨터 이용 가능할 때</span>
    * ~~minesweeper~~
    * tetris single mode
    * tetris multiplayer mode
3. Node.js 교과서 정독 (16단원)
4. 백준 - 단계별 문제 풀기
5. <span style="color:green">python과 c#은..?</span>

Schedule
---
1. 목표를 설정한다.<br/>
2. 계획표를 짠다.<br/>
3. 계획대로 실행한다.<br/>

그 외 소소한...
---
1. 뜨개질
2. 영어 실력

# html 태그 실험
---
<canvas id = "canvas" width = 200 height = 200></canvas>
<script>
  var canvas = document.getElementById('canvas');
  if (canvas.getContext) {
     var ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
    ctx.moveTo(110, 75);
    ctx.arc(75, 75, 35, 0, Math.PI, false);  // Mouth (clockwise)
    ctx.moveTo(65, 65);
    ctx.arc(60, 65, 5, 0, Math.PI * 2, true);  // Left eye
    ctx.moveTo(95, 65);
    ctx.arc(90, 65, 5, 0, Math.PI * 2, true);  // Right eye
    ctx.stroke();
  }
</script>