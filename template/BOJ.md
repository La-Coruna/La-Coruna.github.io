<%*
const problemNumber = await tp.system.prompt("BOJ 문제 번호를 입력하세요");
if (!problemNumber) return;

const problemTitle = await tp.system.prompt("문제 제목을 입력하세요 (예: 연구소 3)");
if (!problemTitle) return;

const date = tp.date.now("YYYY-MM-DD");
await tp.file.rename(`${date}-BOJ-${problemNumber}`);

const bojLink = `https://boj.kr/${problemNumber}`;
const githubLink = `https://github.com/La-Coruna/PS/blob/main/baekjoon/${problemNumber}.cpp`;

tR += `---
title: "[BOJ ${problemNumber}] ${problemTitle}"
categories:
  - PS
  - BOJ
comments: true
tags:
  - 
toc: true
toc_sticky: true
---
## 🔗Link
{:.no-top-margin}
[문제](${bojLink})  
[풀이](${githubLink})

## 💡Idea

## 🔑Code
\`\`\`c++
\`\`\`

## 🗨️ Side Notes
\`\`\`
\`\`\`
`;
-%>