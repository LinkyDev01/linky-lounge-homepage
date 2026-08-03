# home-v3 시안 전용 셀프호스팅 폰트

서체 비교 시안(`/lazyday/preview/home-v3?type=a|b|c`)의 로컬 렌더 검증을 위해
서브셋(라틴 + 한글 전역 U+AC00-D7A3 + 자모·문장부호)해 셀프호스팅한다.
실사이트 이식 단계에서 로드 방식(CDN vs 셀프호스팅)을 재결정할 것.

| 파일 | 원본 | 라이선스 |
|---|---|---|
| MaruBuri-Bold.subset.woff2 | 네이버 마루 부리 Bold (hangeul.pstatic.net) | SIL OFL 1.1 |
| NotoSerifKR-900.subset.woff2 | Noto Serif KR 가변(google/fonts) → wght=900 인스턴스 | SIL OFL 1.1 |
| PretendardVariable.subset.woff2 | Pretendard v1.3.9 가변 (orioncactus) | SIL OFL 1.1 |
| SUIT-Variable.subset.woff2 | SUIT 가변 (sunn-us) | SIL OFL 1.1 |

서브셋 도구: fonttools `varLib.instancer`(Noto 900 인스턴스화) + `pyftsubset`
(`--flavor=woff2 --layout-features='*'`, 유니코드 범위: ASCII·Latin-1·문장부호·
한글 자모/호환자모/음절 전역·꺾쇠류·전각 기호)
