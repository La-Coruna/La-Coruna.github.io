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
1. 목표를 설정하기<br/>

Schedule
---
1. 목표를 설정한다.<br/>
2. 계획표를 짠다.<br/>
3. 계획대로 실행한다.<br/>

# html 태그 실험
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