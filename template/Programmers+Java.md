<%*
const problemInput = await tp.system.prompt(
  "프로그래머스 문제 URL 또는 문제 ID를 입력하세요"
);
if (!problemInput) return;

// URL을 입력한 경우 lessons/{문제 ID} 부분에서 ID 추출
const matchedId = problemInput.match(/lessons\/(\d+)/);
const problemId = matchedId ? matchedId[1] : problemInput.trim();

if (!/^\d+$/.test(problemId)) {
  new Notice("문제 ID를 확인해 주세요.");
  return;
}

const problemTitle = await tp.system.prompt("문제 제목을 입력하세요");
if (!problemTitle) return;

const level = await tp.system.suggester(
  ["Lv. 0", "Lv. 1", "Lv. 2", "Lv. 3", "Lv. 4", "Lv. 5"],
  ["0", "1", "2", "3", "4", "5"],
  false,
  "문제 레벨을 선택하세요"
);
if (level === null || level === undefined) return;

// 1) 알고리즘 기법 태그 후보
const algoTags = [
  "implementation",
  "simulation",
  "brute-force",
  "bfs",
  "dfs",
  "backtracking",
  "dp",
  "greedy",
  "sorting",
  "binary-search",
  "two-pointer",
  "sliding-window",
  "prefix-sum",
  "graph",
  "shortest-path",
  "topological-sort",
  "union-find",
  "string",
  "math"
];

// 2) 자료구조·문제 유형 태그 후보
const typeTags = [
  "array",
  "hash",
  "stack",
  "queue",
  "deque",
  "heap",
  "set",
  "tree",
  "grid",
  "interval",
  "sequence",
  "geometry",
  "string-processing",
  "lis",
  "mst",
  "knapsack"
];

// 공통: 반복 선택 함수
async function pickMultipleTags(candidates, title) {
  const picked = [];

  while (true) {
    const choice = await tp.system.suggester(
      [...candidates, "✅ 선택 완료"],
      [...candidates, null],
      false,
      picked.length === 0 ? title : `선택됨: ${picked.join(", ")}`
    );

    if (!choice) break;
    if (!picked.includes(choice)) picked.push(choice);
  }

  return picked;
}

// 1단계: 알고리즘 기법 선택
const pickedAlgos = await pickMultipleTags(
  algoTags,
  "사용한 알고리즘 기법을 선택하세요 (여러 개 가능)"
);

// 2단계: 자료구조·문제 유형 선택
const pickedTypes = await pickMultipleTags(
  typeTags,
  "자료구조 또는 문제 유형을 선택하세요 (여러 개 가능)"
);

// tags 통합 및 중복 제거
const mergedTags = Array.from(new Set([...pickedAlgos, ...pickedTypes]));

const date = tp.date.now("YYYY-MM-DD");
const safeTitle = problemTitle
  .replace(/[\\/:*?"<>|]/g, "")
  .replace(/\s+/g, " ")
  .trim();

await tp.file.rename(`${date}-Programmers-${problemId}-${safeTitle}`);

const problemLink =
  `https://school.programmers.co.kr/learn/courses/30/lessons/${problemId}`;

// 실제 GitHub 폴더 구조가 다르면 이 줄만 수정하세요.
const githubLink =
  `https://github.com/La-Coruna/PS/blob/main/programmers/${problemId}.java`;

const tagsYaml =
  mergedTags.length > 0
    ? mergedTags.map(tag => `  - ${tag}`).join("\n")
    : "  - ";

const escapedTitle = problemTitle.replace(/"/g, '\\"');

tR += `---
title: "[Programmers Lv.${level}] ${escapedTitle}"
date: ${date}
categories:
  - PS
  - Programmers
platform: Programmers
problem_id: ${problemId}
difficulty: "Lv.${level}"
language: Java
comments: true
tags:
${tagsYaml}
toc: true
toc_sticky: true
---

## 🔗 Link
{:.no-top-margin}
[문제](${problemLink})  
[풀이](${githubLink})

## 📝 Problem Summary

문제를 한두 문장으로 요약합니다.

## 💡 Idea

### 핵심 관찰

### 풀이 과정

## ⏱ Complexity

- 시간 복잡도: \`O()\`
- 공간 복잡도: \`O()\`

## 🔑 Code

\`\`\`java

\`\`\`

## 🗨️ Side Notes

- 막힌 부분:
- 새로 배운 점:
- 다시 풀 때 주의할 점:
`;
-%>
