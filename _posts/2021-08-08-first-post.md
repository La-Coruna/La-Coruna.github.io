---
date: 2021-08-08
title: "어찌 됐든 살아가야 한다"
categories: 
    - schedule
tags: 
    - goal
    - schedule
toc: true  
toc_sticky: true 
---

Goal
---
1. 그대와 사이 좋게 다시 보기<br/>
    * 보고 싶다
2. 프론트엔드를 위한 기초 다지기 (with html, css, js)<br/>
    * tetris 만들기
3. 동적 웹 사이트를 위한 간단한 서버 만들기 (with node.js)<br/>
    * 간단한 discord bot 개발
4. Unity 개발을 위한 C# 기초 다지기<br/>
    * 휴가 나가기 3개월 전
5. 알고리즘 공부
    * 단계별로 풀어보기
6. 나와서 과외할 능력 키우기
    * python...?

Schedule
---
1. 목표를 설정한다.<br/>
2. 계획표를 짠다.<br/>
3. 계획대로 실행한다.<br/>

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