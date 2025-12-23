// data/mockData.ts
export interface CharacterMap {
  [key: string]: string;
}

export interface SceneData {
  scene: number;
  location: string;
  dn: string;
  ie: string;
  summary: string;
  characters: CharacterMap;
  extras: string;
}

export const CHARACTER_NAMES = ["정서", "인기", "민지"];

export const MOCK_SCENE_DATA: SceneData[] = [
  {
    scene: 1,
    location: "서울대학교 - 도서관",
    dn: "D",
    ie: "I",
    summary: "정서가 혼자 공부하고 있다. 인기가 커피를 들고 들어온다. 서로 어색한 눈빛을 교환한다.",
    characters: { "정서": "✓", "인기": "✓" },
    extras: "2"
  },
  {
    scene: 2,
    location: "캠퍼스 중앙광장",
    dn: "D",
    ie: "E",
    summary: "학생들이 푸드트럭 주변에 모여있다. 민지가 시위 모임을 조직하고 있다.",
    characters: { "정서": "", "인기": "✓", "민지": "✓" },
    extras: "15"
  },
  {
    scene: 3,
    location: "교수 연구실",
    dn: "N",
    ie: "I",
    summary: "정서와 교수 사이의 긴장된 대립. 논문 마감 연장에 대한 논쟁이 벌어진다.",
    characters: { "정서": "✓", "인기": "", "민지": "" },
    extras: "0"
  },
  {
    scene: 4,
    location: "버스 정류장 - 비 오는 밤",
    dn: "N",
    ie: "E",
    summary: "정서와 인기가 함께 기다린다. 가족의 압박에 대한 첫 진솔한 대화를 나눈다.",
    characters: { "정서": "✓", "인기": "✓", "민지": "" },
    extras: "3"
  }
];