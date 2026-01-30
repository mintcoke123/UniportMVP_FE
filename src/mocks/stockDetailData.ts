export const stockDetailData = {
  1: {
    id: 1,
    name: '삼성전자',
    code: '005930',
    currentPrice: 71500,
    change: 1200,
    changeRate: 1.71,
    logoColor: '#1428A0',
    myHolding: {
      quantity: 50,
      avgPrice: 68000,
      totalValue: 3575000,
      totalProfit: 175000,
      profitRate: 5.15
    },
    marketData: {
      openPrice: 70500,
      closePrice: 71500,
      volume: 15234567,
      lowPrice: 70200,
      highPrice: 72100
    },
    financialData: [
      { quarter: '2024 Q1', revenue: 71920, grossProfit: 28450, operatingProfit: 6610 },
      { quarter: '2023 Q4', revenue: 67400, grossProfit: 25800, operatingProfit: 2820 },
      { quarter: '2023 Q3', revenue: 67400, grossProfit: 24900, operatingProfit: 2430 },
      { quarter: '2023 Q2', revenue: 60010, grossProfit: 22100, operatingProfit: 670 }
    ],
    companyInfo: '삼성전자는 대한민국의 대표적인 글로벌 전자기업으로, 반도체, 스마트폰, 가전제품 등 다양한 전자제품을 생산하고 있습니다. 특히 메모리 반도체 분야에서 세계 1위의 시장 점유율을 보유하고 있으며, 갤럭시 시리즈로 대표되는 스마트폰 사업에서도 글로벌 선두 기업입니다. 최근에는 AI, 5G, IoT 등 미래 기술 분야에 대한 투자를 확대하고 있습니다.',
    news: [
      {
        id: 1,
        title: '삼성전자, AI 반도체 시장 공략 본격화',
        source: '한국경제',
        date: '2024-01-15',
        summary: '삼성전자가 인공지능(AI) 반도체 시장 공략에 본격 나섰다. 차세대 AI 칩 개발에 대규모 투자를 단행할 예정이다.'
      },
      {
        id: 2,
        title: '갤럭시 S24 시리즈, 글로벌 판매 호조',
        source: '매일경제',
        date: '2024-01-14',
        summary: '삼성전자의 최신 플래그십 스마트폰 갤럭시 S24 시리즈가 출시 첫 주 판매량에서 전작 대비 20% 증가한 것으로 나타났다.'
      },
      {
        id: 3,
        title: '삼성전자, 반도체 부문 실적 개선 기대',
        source: '서울경제',
        date: '2024-01-13',
        summary: '메모리 반도체 가격 상승세가 지속되면서 삼성전자의 반도체 부문 실적 개선에 대한 기대감이 높아지고 있다.'
      },
      {
        id: 4,
        title: '삼성전자, 친환경 경영 강화',
        source: '이데일리',
        date: '2024-01-12',
        summary: '삼성전자가 2030년까지 탄소중립 달성을 목표로 친환경 경영 전략을 대폭 강화한다고 밝혔다.'
      }
    ]
  },
  2: {
    id: 2,
    name: 'SK하이닉스',
    code: '000660',
    currentPrice: 128000,
    change: -2500,
    changeRate: -1.92,
    logoColor: '#EA002C',
    myHolding: null,
    marketData: {
      openPrice: 130000,
      closePrice: 128000,
      volume: 8456234,
      lowPrice: 127500,
      highPrice: 131200
    },
    financialData: [
      { quarter: '2024 Q1', revenue: 13160, grossProfit: 5240, operatingProfit: 3480 },
      { quarter: '2023 Q4', revenue: 11310, grossProfit: 4120, operatingProfit: 2670 },
      { quarter: '2023 Q3', revenue: 10980, grossProfit: 3890, operatingProfit: 1820 },
      { quarter: '2023 Q2', revenue: 7340, grossProfit: 1560, operatingProfit: -2880 }
    ],
    companyInfo: 'SK하이닉스는 메모리 반도체 전문 기업으로, DRAM과 NAND 플래시 메모리 분야에서 세계적인 경쟁력을 보유하고 있습니다. 특히 서버용 고성능 메모리와 모바일 DRAM 시장에서 강점을 가지고 있으며, 최근에는 AI와 데이터센터 시장을 겨냥한 차세대 메모리 제품 개발에 주력하고 있습니다.',
    news: [
      {
        id: 1,
        title: 'SK하이닉스, HBM3E 양산 본격화',
        source: '전자신문',
        date: '2024-01-15',
        summary: 'SK하이닉스가 차세대 고대역폭 메모리(HBM) HBM3E의 양산을 본격화하며 AI 반도체 시장 공략에 나섰다.'
      },
      {
        id: 2,
        title: 'DRAM 가격 상승세, 실적 개선 기대',
        source: '파이낸셜뉴스',
        date: '2024-01-14',
        summary: 'DRAM 가격이 지속적인 상승세를 보이면서 SK하이닉스의 1분기 실적 개선에 대한 기대감이 커지고 있다.'
      },
      {
        id: 3,
        title: 'SK하이닉스, AI 메모리 수요 급증',
        source: '디지털타임스',
        date: '2024-01-13',
        summary: '생성형 AI 붐으로 인해 SK하이닉스의 고성능 메모리 제품에 대한 수요가 급증하고 있다.'
      }
    ]
  },
  3: {
    id: 3,
    name: 'LG에너지솔루션',
    code: '373220',
    currentPrice: 445000,
    change: 8500,
    changeRate: 1.95,
    logoColor: '#A50034',
    myHolding: {
      quantity: 10,
      avgPrice: 420000,
      totalValue: 4450000,
      totalProfit: 250000,
      profitRate: 5.95
    },
    marketData: {
      openPrice: 438000,
      closePrice: 445000,
      volume: 2345678,
      lowPrice: 437500,
      highPrice: 447000
    },
    financialData: [
      { quarter: '2024 Q1', revenue: 8920, grossProfit: 1340, operatingProfit: 450 },
      { quarter: '2023 Q4', revenue: 8560, grossProfit: 1180, operatingProfit: 310 },
      { quarter: '2023 Q3', revenue: 8230, grossProfit: 980, operatingProfit: 180 },
      { quarter: '2023 Q2', revenue: 7890, grossProfit: 1120, operatingProfit: 240 }
    ],
    companyInfo: 'LG에너지솔루션은 전기차 배터리 분야의 글로벌 선도 기업으로, 리튬이온 배터리 기술에서 세계 최고 수준의 경쟁력을 보유하고 있습니다. GM, 테슬라, 현대차 등 주요 완성차 업체들과 파트너십을 맺고 있으며, 북미, 유럽, 아시아 등 전 세계에 생산 거점을 확대하고 있습니다.',
    news: [
      {
        id: 1,
        title: 'LG에너지솔루션, 북미 배터리 공장 증설',
        source: '조선비즈',
        date: '2024-01-15',
        summary: 'LG에너지솔루션이 북미 지역 배터리 생산 능력 확대를 위해 대규모 투자를 단행한다.'
      },
      {
        id: 2,
        title: '전기차 배터리 수요 증가, 실적 호조',
        source: '머니투데이',
        date: '2024-01-14',
        summary: '글로벌 전기차 시장 성장에 힘입어 LG에너지솔루션의 배터리 수주량이 크게 증가하고 있다.'
      },
      {
        id: 3,
        title: 'LG에너지솔루션, 차세대 배터리 기술 개발',
        source: '비즈니스워치',
        date: '2024-01-13',
        summary: 'LG에너지솔루션이 에너지 밀도를 획기적으로 높인 차세대 배터리 기술 개발에 성공했다.'
      }
    ]
  }
};

export const getStockDetail = (id: number) => {
  return stockDetailData[id as keyof typeof stockDetailData] || null;
};