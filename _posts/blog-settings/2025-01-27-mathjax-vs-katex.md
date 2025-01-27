---
title: "[Minimal Mistakes] 수식 렌더링 방법: MathJax와 KaTeX 비교"
categories:
  - Blog Management
comments: true
tags:
  - minimal mistakes
  - jekyll
  - MathJax
  - KaTex
toc: true
toc_sticky: true
use_math: "true"
---

Minimal Mistakes 테마에서 수식을 렌더링하려면 **MathJax** 또는 **KaTeX**를 사용할 수 있다.  
이번 포스팅에서는 **MathJax**와 **KaTeX**의 설정 방법을 알아보고 두 방식의 차이점을 비교하고자 한다.  
두 방법 모두 `_includes` 디렉토리에서 설정 파일을 생성하고, 페이지별 조건부 로딩으로 불필요한 스크립트 로드를 방지하도록 설정하였다.  
다음과 같이 수식을 렌더링해 세련된 블로그를 만들어 보자.  
  
**예시**  

$$
Bug = Feature \quad \text{if (PM = Yes)}
$$
```
$Bug = Feature \quad \text{if (PM = Yes)}$
```

## 1. MathJax 설정 방법

**MathJax** 설정을 외부 파일로 관리하여 테마 업데이트 시 충돌을 방지할 수 있다.

1. `_includes/mathjax_support.html` 파일 생성:
    
    ```html
    <script type="text/javascript" async
        src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/latest.js?config=TeX-MML-AM_CHTML">
    </script>
    
    <script type="text/x-mathjax-config">
      MathJax.Hub.Config({
        extensions: ["tex2jax.js"],
        jax: ["input/TeX", "output/HTML-CSS"],
        tex2jax: {
          inlineMath: [['$', '$'], ["\\(", "\\)"]],
          displayMath: [['$$', '$$'], ["\\[", "\\]"]],
          processEscapes: true
        },
        "HTML-CSS": { availableFonts: ["TeX"] }
      });
    </script>
    ```
    
2. `_layouts/default.html` 파일 수정:
    
	```
    {% raw %}
    {% if page.use_math %}
      {% include mathjax_support.html %}
    {% endif %}
    {% endraw %}
    ```
    
3. 수식이 필요한 포스트의 Front Matter에 `use_math: true` 추가:
    
    ```yaml
    ---
    title: "수식 테스트"
    use_math: true
    ---
    ```
    
    MathJax 스크립트는 `use_math`가 설정된 페이지에서만 로드된다.
    

---

## 2. KaTeX 설정 방법

**KaTeX**는 **MathJax**보다 빠르고 가볍다. 단순한 수식 렌더링에 적합하다.

1. `_includes/katex_support.html` 파일 생성:
    
    ```html
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/contrib/auto-render.min.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
          renderMathInElement(document.body, {
              delimiters: [
                  {left: "$$", right: "$$", display: true},
                  {left: "$", right: "$", display: false}
              ]
          });
      });
    </script>
    ```
    
2. `_layouts/default.html` 파일 수정:
    
    ```
    {% raw %}
    {% if page.use_math %}
      {% include katex_support.html %}
    {% endif %}
    {% endraw %}
    ```
    
3. 수식이 필요한 포스트의 Front Matter에 `use_math: true` 추가:
    
    ```yaml
    ---
    title: "수식 테스트"
    use_math: true
    ---
    ```
---

## 3. MathJax와 KaTeX 비교

### 1. 렌더링 속도

- **MathJax**는 DOM 전체를 다시 탐색하며 렌더링하기 때문에 초기 로딩 속도가 느릴 수 있다.
- **KaTeX**는 DOM 탐색 없이 즉각 렌더링하므로 초기 로딩이 빠르다.

### 2. 스크립트 크기

- **MathJax**: 약 227KB.
- **KaTeX**: 약 30KB로 훨씬 가볍다.

### 3. 지원 기능

- **MathJax**: 복잡한 LaTeX 환경(`align`, `cases`)을 포함한 다양한 기능 지원.
- **KaTeX**: 단순한 수식 렌더링에 최적화되어 있지만 복잡한 환경은 제한적이다.

---
## 4. 결론

- 복잡한 수식을 다루거나 다양한 LaTeX 기능이 필요한 경우 **MathJax**를 사용하는 것이 적합하다.
- 단순하고 빠른 렌더링을 원한다면 **KaTeX**가 더 적합하다.

Minimal Mistakes 테마에서 수식을 렌더링할 때는 블로그 성격과 수식의 복잡도를 고려하여 두 기술 중 하나를 선택하면 된다. 본 블로그에서는 포스팅에 수식을 사용하더라도 간단한 수식으로 2~3개 정도만 사용할 것 같아 KaTeX를 사용하기로 했다.