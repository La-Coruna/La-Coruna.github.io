<%*
const problemNumber = await tp.system.prompt("BOJ 문제 번호를 입력하세요");
if (!problemNumber) return;

const problemTitle = await tp.system.prompt("문제 제목을 입력하세요");
if (!problemTitle) return;

// 1) 알고리즘 기법 태그 후보
const algoTags = [
  "bfs",
  "dfs",
  "simulation",
  "backtracking",
  "dp",
  "greedy",
  "graph",
  "tree",
  "shortest-path",
  "binary-search",
  "two-pointer",
  "string",
  "math",
  "topological-sort"
];

// 2) 문제 유형 태그 후보
const typeTags = [
  "lis",
  "mst",
  "knapsack",
  "grid",
  "interval",
  "sequence",
  "geometry",
  "string-processing",
  "implementation-heavy",
  "query",
  "offline-query"
];

// 공통: 반복 선택 함수
async function pickMultipleTags(candidates, title) {
  let picked = [];
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

// 2단계: 문제 유형 선택
const pickedTypes = await pickMultipleTags(
  typeTags,
  "문제 유형을 선택하세요 (여러 개 가능)"
);

// tags 통합 (중복 제거)
const mergedTags = Array.from(new Set([...pickedAlgos, ...pickedTypes]));

const date = tp.date.now("YYYY-MM-DD");
await tp.file.rename(`${date}-BOJ-${problemNumber}`);

const bojLink = `https://boj.kr/${problemNumber}`;
const githubLink = `https://github.com/La-Coruna/PS/blob/main/baekjoon/${problemNumber}.cpp`;

// tags YAML 문자열 생성
const tagsYaml =
  mergedTags.length > 0
    ? mergedTags.map(t => `  - ${t}`).join("\n")
    : "  - ";

tR += `---
title: "[BOJ ${problemNumber}] ${problemTitle}"
categories:
  - PS
  - BOJ
comments: true
tags:
${tagsYaml}
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
`;
-%>
