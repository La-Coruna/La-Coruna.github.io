---
title: jekyll을 위한 obsidian 설정
categories: [Blog]
comments: true
tags: [obsidian, jekyll]
---
# 서론
blog를 쓰자고 다짐했지만, 여러 글들이 그저 메모 단계에서 그쳤다.
메모는 주로 Obsidian을 통해 하는데, blog 또한 obsidian을 통해 관리하면 조금이나마 손이 더 갈까해서, blog를 위한 obsidian vault를 하나 파고 설정을 하고자 한다.

# 설정하기
설정하려는 obsidian vault를 들어가 왼쪽 하단의 톱니바퀴 아이콘을 눌러 설정창을 열 수 있다.

## 옵션 > 편집기
- 읽기 쉬운 행 길이: off

## 옵션 > 파일 및 링크
- 내부 링크를 항상 업데이트: on
- 새로 만드는 링크 형식: 파일에 대한 상대 경로
- [[wikilink]] 사용: off
- 새 첨부 파일을 만들 위치: 아래에 지정된 폴더 
- 첨부 파일 폴더 경로: assets/images

## 코어 플러그인 > 데일리 노트 
- 날짜 서식: YYYY-MM-DD
- 새 파일 경로: _posts
- 템플릿 파일 경로: template/post
```md
---
title:
categories: []
comments: true
tags: []
---
```


