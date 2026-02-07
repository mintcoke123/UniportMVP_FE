# Uniport MVP API 명세서

Mock 데이터와 프론트엔드 구조를 기준으로 정의한 API 스펙입니다. 백엔드 연동 시 이 명세에 맞춰 구현하면 프론트엔드와 호환됩니다.

---

## 목차

1. [인증·사용자 (Auth / User)](#1-인증사용자-auth--user)
2. [내 투자·홈 (My Investment / Home)](#2-내-투자홈-my-investment--home)
3. [시장·종목 (Market / Stock)](#3-시장종목-market--stock)
4. [대회 (Competition) — 랭킹 방식](#4-대회-competition--랭킹-방식)
5. [랭킹 (Ranking)](#5-랭킹-ranking)
6. [그룹 포트폴리오 (Group)](#6-그룹-포트폴리오-group)
7. [채팅 (Chat)](#7-채팅-chat)
8. [투표 (Vote)](#8-투표-vote)
9. [매칭방 (Matching Room)](#9-매칭방-matching-room)
10. [관리자 (Admin)](#10-관리자-admin)
11. [페이지–API 매핑 요약](#11-페이지api-매핑-요약)
12. [공통](#12-공통)
13. [Mock 데이터·프론트 구조](#13-mock-데이터프론트-구조)

---

## 1. 인증·사용자 (Auth / User)

| 항목       | 내용                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------- |
| **용도**   | 로그인, 회원가입, 세션·역할(관리자) 제공                                                      |
| **사용처** | `AuthContext`, `src/pages/login/page.tsx`, `src/pages/signup/page.tsx`, `AdminProtectedRoute` |

### 1-1. 로그인

**POST** `/api/auth/login`

**Request (Body)**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "user": {
    "id": "string",
    "email": "string",
    "nickname": "string",
    "totalAssets": number,
    "investmentAmount": number,
    "profitLoss": number,
    "profitLossRate": number,
    "teamId": "string | null",
    "role": "user" | "admin"
  }
}
```

- **teamId**: 팀 소속 여부. `null`이면 팀 미소속(매칭방 참가 후 팀 확정).
- **role**: `"admin"`이면 어드민 페이지(`/admin`) 접근 가능. 미제공 시 `"user"`로 간주.

**Response (실패)**  
`success: false`, `message`: 에러 메시지

---

### 1-2. 회원가입

**POST** `/api/auth/signup`

**Request (Body)**

```json
{
  "email": "string",
  "password": "string",
  "nickname": "string"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "user": {
    "id": "string",
    "email": "string",
    "nickname": "string",
    "totalAssets": number,
    "investmentAmount": number,
    "profitLoss": number,
    "profitLossRate": number,
    "teamId": null,
    "role": "user"
  }
}
```

- 신규 가입 시 초기 자산은 서버 정책 적용. **role**은 일반 사용자이므로 `"user"`.

---

## 2. 내 투자·홈 (My Investment / Home)

| 항목       | 내용                                                  |
| ---------- | ----------------------------------------------------- |
| **용도**   | 홈 화면: 내 자산 요약, 보유 종목, 진행 중인 대회 요약 |
| **사용처** | `src/pages/home/page.tsx`                             |

### 2-1. 내 투자 요약

**GET** `/api/me/investment` (또는 `/api/users/me/portfolio`)

**Response (200)**

```json
{
  "investmentData": {
    "totalAssets": number,
    "profitLoss": number,
    "profitLossPercentage": number,
    "investmentPrincipal": number,
    "cashBalance": number
  },
  "stockHoldings": [
    {
      "id": number,
      "name": "string",
      "quantity": number,
      "currentValue": number,
      "profitLoss": number,
      "profitLossPercentage": number,
      "logoColor": "string"
    }
  ],
  "competitionData": {
    "name": "string",
    "endDate": "string",
    "daysRemaining": number
  }
}
```

- **대회**: 랭킹 방식. 모든 팀이 주어진 기간 동안 투자하고, 기간 종료 후 최종 수익률로 순위·승자 결정.
- `endDate`: ISO 날짜 문자열 (예: `"2025-02-28"`).

---

## 3. 시장·종목 (Market / Stock)

| 항목       | 내용                                                |
| ---------- | --------------------------------------------------- |
| **용도**   | 시장 지수, 거래량/상승/하락 순 종목, 종목 상세      |
| **사용처** | `mock-investment/page.tsx`, `stock-detail/page.tsx` |

### 3-1. 시장 지수

**GET** `/api/market/indices`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "value": number,
    "change": number,
    "changeRate": number
  }
]
```

### 3-2. 거래량 순 종목

**GET** `/api/market/stocks?sort=volume`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "code": "string",
    "currentPrice": number,
    "change": number,
    "changeRate": number,
    "logoColor": "string"
  }
]
```

### 3-3. 상승률 순 종목

**GET** `/api/market/stocks?sort=rising`

- 응답 배열 구조는 3-2와 동일.

### 3-4. 하락률 순 종목

**GET** `/api/market/stocks?sort=falling`

- 응답 배열 구조는 3-2와 동일.

### 3-5. 종목 상세

**GET** `/api/stocks/:id`

**Response (200)**

```json
{
  "id": number,
  "name": "string",
  "code": "string",
  "currentPrice": number,
  "change": number,
  "changeRate": number,
  "logoColor": "string",
  "myHolding": {
    "quantity": number,
    "avgPrice": number,
    "totalValue": number,
    "totalProfit": number,
    "profitRate": number
  } | null,
  "marketData": {
    "openPrice": number,
    "closePrice": number,
    "volume": number,
    "lowPrice": number,
    "highPrice": number
  },
  "financialData": [
    {
      "quarter": "string",
      "revenue": number,
      "grossProfit": number,
      "operatingProfit": number
    }
  ],
  "companyInfo": "string",
  "news": [
    {
      "id": number,
      "title": "string",
      "source": "string",
      "date": "string",
      "summary": "string"
    }
  ]
}
```

- `myHolding`: 해당 사용자 보유 정보 없으면 `null`.

### 3-6. 주식 매수/매도 체결 (주문)

| 항목       | 내용                                                       |
| ---------- | ---------------------------------------------------------- |
| **용도**   | 종목 상세에서 매수/매도 주문 실행                          |
| **사용처** | `src/pages/stock-detail/page.tsx` (계획 공유 후 연동 예정) |

**POST** `/api/trades` (또는 `/api/orders`)

**Request (Body)**

```json
{
  "stockId": number,
  "side": "buy" | "sell",
  "quantity": number,
  "pricePerShare": number,
  "reason": "string",
  "tags": ["string"]
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "orderId": "string",
  "executedAt": "string"
}
```

- 실패 시 `success: false`, `message`: 에러 메시지.

---

## 4. 대회 (Competition) — 랭킹 방식

| 항목       | 내용                              |
| ---------- | --------------------------------- |
| **용도**   | 진행 중/예정 대회 목록 (사용자용) |
| **사용처** | `src/pages/competition/page.tsx`  |

- **대회는 토너먼트가 아님.** 랭킹 방식: 모든 팀이 주어진 기간 동안 투자하고, 기간 종료 후 **최종 수익률**로 순위를 매겨 승자를 정함.

### 4-1. 진행 중인 대회

**GET** `/api/competitions/ongoing`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "endDate": "string"
  }
]
```

- `endDate`: ISO 8601 (예: `"2025-02-15T23:59:59.000Z"`). 기간 종료 시점에 랭킹 확정.

### 4-2. 예정 대회

**GET** `/api/competitions/upcoming`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "startDate": "string"
  }
]
```

---

## 5. 랭킹 (Ranking)

| 항목       | 내용                         |
| ---------- | ---------------------------- |
| **용도**   | 그룹 랭킹 목록, 내 그룹 순위 |
| **사용처** | `src/pages/ranking/page.tsx` |

### 5-1. 전체 그룹 랭킹

**GET** `/api/ranking/groups`

**Response (200)**

```json
[
  {
    "id": number,
    "groupName": "string",
    "currentAssets": number,
    "profitRate": number
  }
]
```

### 5-2. 내 그룹 랭킹

**GET** `/api/ranking/my-group`

**Response (200)**

```json
{
  "id": number,
  "rank": number,
  "groupName": "string",
  "currentAssets": number,
  "profitRate": number
}
```

---

## 6. 그룹 포트폴리오 (Group)

| 항목       | 내용                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| **용도**   | 그룹 정보, 보유 종목 요약, 멤버 목록, 경쟁 팀                           |
| **사용처** | `group-portfolio/page.tsx`, `feedback-report/page.tsx`, `chat/page.tsx` |

### 6-1. 그룹 포트폴리오 상세

**GET** `/api/groups/:groupId` (또는 `/api/groups/me`)

**Response (200)**

```json
{
  "groupId": number,
  "groupName": "string",
  "totalValue": number,
  "investmentAmount": number,
  "profitLoss": number,
  "profitLossPercentage": number,
  "holdings": [
    {
      "id": number,
      "stockName": "string",
      "stockCode": "string",
      "currentPrice": number,
      "quantity": number,
      "averagePrice": number,
      "currentValue": number
    }
  ]
}
```

### 6-2. 그룹 보유 종목 요약 (차트/카드용)

**GET** `/api/groups/:groupId/holdings-summary`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "logoColor": "string",
    "currentValue": number,
    "profitLoss": number,
    "profitLossPercentage": number
  }
]
```

### 6-3. 그룹 멤버 목록

**GET** `/api/groups/:groupId/members`

**Response (200)**

```json
[
  {
    "id": number,
    "nickname": "string"
  }
]
```

### 6-4. 경쟁 중인 팀 (대회 실시간 투자금·순위)

| 항목       | 내용                                                      |
| ---------- | --------------------------------------------------------- |
| **용도**   | 현재 대회에 참가 중인 팀 목록 — 실시간 투자금·수익률·순위 |
| **사용처** | `group-portfolio/page.tsx`, `home/page.tsx`               |

**GET** `/api/competitions/:competitionId/teams`  
또는 **GET** `/api/me/competition/competing-teams`

**Response (200)**

```json
[
  {
    "teamId": "string",
    "groupName": "string",
    "totalValue": number,
    "investmentAmount": number,
    "profitLoss": number,
    "profitLossPercentage": number,
    "rank": number,
    "isMyTeam": boolean
  }
]
```

- `rank`: 해당 대회(랭킹 기간) 내 순위 (1부터). 기간 종료 시 최종 수익률로 확정.
- `isMyTeam`: 요청 사용자가 속한 팀이면 `true`.

---

## 7. 채팅 (Chat)

| 항목       | 내용                                   |
| ---------- | -------------------------------------- |
| **용도**   | 그룹 채팅 — WebSocket 실시간 구현 예정 |
| **사용처** | `src/pages/chat/page.tsx`              |

### 7-0. 채팅 WebSocket (백엔드 구현)

- 연결: 팀(그룹) 단위 채널. **쿼리 파라미터 `token`에 JWT 필수.**  
  예: `ws://localhost:8080/groups/1/chat?token=eyJ...`
- 서버: token으로 사용자 검증, 해당 groupId(매칭방) 멤버인지 확인.  
  토큰 없음/잘못됨/멤버 아님 → `CloseStatus.POLICY_VIOLATION`으로 연결 종료.
- 이벤트: 메시지 전송/수신, 매수·매도 계획 카드 공유 등. 프로토콜은 백엔드 명세 따름.

### 7-1. 채팅 메시지 목록 (초기 로드 / 폴백)

**GET** `/api/groups/:groupId/chat/messages`

- **인증**: `Authorization: Bearer {token}` 필수.
- **권한**: 해당 그룹(매칭방) 멤버만 조회 가능.
  - 로그인 안 되어 있으면 **401**.
  - 멤버가 아니면 **403**. (멤버 여부: `MatchingRoomMemberRepository.existsByMatchingRoomIdAndUserId(groupId, userId)`)

**Response (200)**

```json
{
  "roomId": number,
  "messages": [
    {
      "id": number,
      "type": "user" | "trade",
      "userId": number,
      "userNickname": "string",
      "userProfileImage": "string",
      "message": "string | null",
      "timestamp": "string",
      "tradeData": {
        "action": "매수" | "매도",
        "stockName": "string",
        "quantity": number,
        "pricePerShare": number,
        "totalAmount": number,
        "reason": "string",
        "tags": ["string"]
      } | null
    }
  ]
}
```

- `roomId`: 해당 방(그룹) ID. `messages`: 해당 방의 과거 메시지 배열.
- `type === "user"` 이면 `message`, `type === "trade"` 이면 `tradeData` 사용.

### 7-2. 채팅 메시지 전송

**POST** `/api/groups/:groupId/chat/messages`

- **인증**: 로그인 필수 (`Authorization: Bearer {token}`).
- **권한**: 해당 그룹(매칭방) 멤버만 전송 가능. 멤버가 아니면 **403**.

**Request (Body)** — 일반 메시지

```json
{
  "message": "string"
}
```

**Request (Body)** — 매수/매도 계획 공유

```json
{
  "type": "trade",
  "tradeData": {
    "action": "매수" | "매도",
    "stockName": "string",
    "quantity": number,
    "pricePerShare": number,
    "totalAmount": number,
    "reason": "string",
    "tags": ["string"]
  }
}
```

**Response (200)**  
`{ "success": true, "messageId": number }`

- WebSocket 전용 구조면 REST 생략 가능.

---

## 8. 투표 (Vote)

| 항목       | 내용                                |
| ---------- | ----------------------------------- |
| **용도**   | 그룹 내 매수/매도 투표 목록 및 제출 |
| **사용처** | `src/pages/chat/page.tsx`           |

### 8-1. 투표 목록

**GET** `/api/groups/:groupId/votes`

**Response (200)**

```json
[
  {
    "id": number,
    "type": "매수" | "매도",
    "stockName": "string",
    "proposerId": number,
    "proposerName": "string",
    "proposerImage": "string",
    "quantity": number,
    "proposedPrice": number,
    "reason": "string",
    "createdAt": "string",
    "expiresAt": "string",
    "votes": [
      {
        "orderId": number,
        "userId": number,
        "userName": "string",
        "userImage": "string",
        "vote": "찬성" | "반대" | "보류"
      }
    ],
    "totalMembers": number,
    "status": "ongoing" | "passed" | "rejected" | "expired"
  }
]
```

### 8-2. 투표 제출

**POST** `/api/groups/:groupId/votes/:voteId` (또는 PATCH)

**Request (Body)**

```json
{
  "vote": "찬성" | "반대" | "보류"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "vote": {}
}
```

- 과반수·동률·만료 등 상태 판단은 서버에서 수행 후 `status` 갱신.

---

## 9. 매칭방 (Matching Room)

| 항목       | 내용                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| **용도**   | 팀 미소속 사용자가 매칭방에 참가하여 팀(3명)을 이루고, 정원 3명이 모이면 모의투자(대회) 시작 |
| **사용처** | `src/pages/matching-rooms/page.tsx`                                                          |

- 팀 미소속(`user.teamId === null`) 사용자는 매칭방 목록에서 방 선택·참가. **정원 3명**이 모이면 해당 방이 팀으로 확정되고 모의투자(대회) 시작 가능.
- 매칭방 목록에서 각 방의 **멤버 목록**(닉네임·프로필 등) 조회 가능. **모의투자방 만들기** 지원.

### 9-0. 매칭방 만들기

**POST** `/api/matching-rooms`

**Request (Body, 선택)**

```json
{
  "name": "string"
}
```

- `name` 생략 시 서버에서 기본 이름(예: 날짜 기반) 부여.

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "room": {
    "id": "string",
    "name": "string",
    "capacity": 3,
    "memberCount": 0,
    "members": [],
    "status": "waiting",
    "createdAt": "string"
  }
}
```

- 참가 중인 방이 없을 때만 방 생성. 생성 시 생성자를 해당 방에 자동 추가.

**Response (400)** — 이미 참가 중인 방이 있을 때

- 로그인한 사용자가 이미 참가 중인 방이 하나라도 있으면 `400 Bad Request`.
- 메시지 예: `"이미 참가 중인 방이 있습니다. 새 방을 만들려면 먼저 방을 나가세요."`

### 9-0-2. 내가 참가 중인 매칭방 (인증)

**GET** `/api/me/matching-rooms`

- **인증**: `Authorization: Bearer {token}` 필요.
- **역할**: 현재 로그인한 사용자가 참가 중인 매칭방(채팅방) 목록만 조회. 최신 참가 순 정렬.
- **Response (200)**: §9-1과 동일한 방 객체 배열. 참가 중인 방이 없으면 `[]`.
- **채팅 화면**: 채팅 진입 시 이 API로 "내가 속한 채팅방 목록"을 불러온 뒤, 선택한 방의 `id`(예: `"room-1"`)에서 숫자 ID(1)를 추출해 `GET /api/groups/1/chat/messages`, `ws://.../groups/1/chat?token=...` 등에 사용.

### 9-1. 매칭방 목록

**GET** `/api/matching-rooms`

- **인증**: 선택. **Authorization** 헤더가 있으면 각 방에 `isJoined`(boolean) 필드가 포함됨.

**Response (200)**

```json
[
  {
    "id": "string",
    "name": "string",
    "capacity": 3,
    "memberCount": number,
    "members": [ { "userId": "string", "nickname": "string", "joinedAt": "string" } ],
    "status": "waiting" | "full" | "started",
    "createdAt": "string",
    "isJoined": true
  }
]
```

- `capacity`: 고정 3명. `status`: `waiting`(대기 중), `full`(3명 모임, 시작 가능), `started`(시작됨).
- `isJoined`: 로그인 후 요청 시만 포함. 현재 사용자가 해당 방에 참가 중이면 `true`.

### 9-2. 매칭방 참가

**POST** `/api/matching-rooms/:roomId/join`

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "room": { "id": "string", "memberCount": number, "members": [ ] }
}
```

- 이미 3명이면 참가 불가(409 등).

### 9-3. 매칭방 나가기

**POST** `/api/matching-rooms/:roomId/leave`

**Response (200)**  
`{ "success": true, "message": "string" }`

### 9-4. 모의투자 시작 (정원 3명일 때)

**POST** `/api/matching-rooms/:roomId/start`

- 해당 방이 3명일 때만 호출. 호출 시 방이 팀으로 확정되고 모의투자(대회)가 시작됨.

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "teamId": "string",
  "competitionId": number
}
```

---

## 10. 관리자 (Admin)

| 항목       | 내용                                                                 |
| ---------- | -------------------------------------------------------------------- |
| **용도**   | 관리자 전용: 대회 관리(시작일·종료일, 추가/수정), 팀 확인, 유저 관리 |
| **사용처** | `src/pages/admin/page.tsx`                                           |
| **접근**   | 로그인 사용자 중 `user.role === "admin"` 인 경우에만 접근 가능.      |

- 모든 Admin API 요청 시 **관리자 인증** 필요 (토큰/세션에서 role 검증).

### 관리자 페이지 ↔ 백엔드 API 요약

| 구분        | Method | Path                                           | 관리자 페이지에서 하는 일               |
| ----------- | ------ | ---------------------------------------------- | --------------------------------------- |
| 대회 목록   | GET    | `/api/admin/competitions`                      | 탭 "대회 관리": 목록 조회               |
| 대회 생성   | POST   | `/api/admin/competitions`                      | 대회 추가 시 body 전송                  |
| 대회 수정   | PATCH  | `/api/admin/competitions/:id`                  | 수정 시 body 전송                       |
| 대회별 팀   | GET    | `/api/admin/competitions/:competitionId/teams` | 탭 "팀 확인": 대회 선택 시 팀 목록 조회 |
| 매칭방 목록 | GET    | `/api/admin/matching-rooms`                    | 탭 "팀 확인": 매칭방 목록 조회          |
| 유저 목록   | GET    | `/api/admin/users`                             | 탭 "유저 관리": 유저 목록 조회          |

### 10-1. 대회 목록 (관리자용)

**GET** `/api/admin/competitions`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "startDate": "string",
    "endDate": "string",
    "status": "upcoming" | "ongoing" | "ended"
  }
]
```

- `startDate`, `endDate`: ISO 8601 (예: `"2025-03-01T00:00:00"`).
- `status`: 조회 시점 기준. `upcoming`(시작 전), `ongoing`(진행 중), `ended`(종료).

### 10-2. 대회 생성

**POST** `/api/admin/competitions`

**Request (Body)**

```json
{
  "name": "string",
  "startDate": "string",
  "endDate": "string"
}
```

- 종료일은 시작일보다 이후여야 함.

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "competition": {
    "id": number,
    "name": "string",
    "startDate": "string",
    "endDate": "string",
    "status": "upcoming" | "ongoing" | "ended"
  }
}
```

**Response (실패)**  
`success: false`, `message`: 예) `"종료일은 시작일보다 이후여야 합니다."`

### 10-3. 대회 수정

**PATCH** `/api/admin/competitions/:id` (또는 PUT)

**Request (Body)** — 일부만 보내도 됨

```json
{
  "name": "string",
  "startDate": "string",
  "endDate": "string"
}
```

**Response (200)**  
`{ "success": true, "message": "string" }`

**Response (실패)**  
`success: false`, `message`: 예) `"대회를 찾을 수 없습니다."`, `"종료일은 시작일보다 이후여야 합니다."`

- 종료일 ≤ 시작일이면 실패.

### 10-4. 대회별 팀 목록 (관리자용)

**GET** `/api/admin/competitions/:competitionId/teams`

**Response (200)**

```json
[
  {
    "teamId": "string",
    "groupName": "string",
    "totalValue": number,
    "investmentAmount": number,
    "profitLoss": number,
    "profitLossPercentage": number,
    "rank": number,
    "isMyTeam": boolean
  }
]
```

- 구조는 §6-4와 동일. 관리자는 특정 대회의 팀 목록 조회.

### 10-5. 매칭방 목록 (관리자용)

**GET** `/api/admin/matching-rooms`

**Response (200)**

- 응답 구조는 **§9-1 매칭방 목록**과 동일. 관리자가 팀 구성 대기 중인 매칭방 전체 조회.

### 10-6. 유저 목록 (관리자용)

**GET** `/api/admin/users`

**Response (200)**

```json
[
  {
    "id": "string",
    "email": "string",
    "nickname": "string",
    "teamId": "string | null",
    "role": "user" | "admin"
  }
]
```

- 비밀번호·프로필 이미지 등 민감/대용량 필드는 제외 가능.

---

## 11. 페이지–API 매핑 요약

| 페이지          | 경로                | 사용 API (명세 섹션)                                                                              |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| 홈              | `/`                 | 내 투자 요약 (2-1), 경쟁 팀 (6-4)                                                                 |
| 모의투자        | `/mock-investment`  | 시장 지수 (3-1), 거래량/상승/하락 종목 (3-2~3-4)                                                  |
| 종목 상세       | `/stock-detail`     | 종목 상세 (3-5), 주문 체결 (3-6)                                                                  |
| 대회            | `/competition`      | 진행 중 (4-1), 예정 (4-2) 대회                                                                    |
| 랭킹            | `/ranking`          | 전체 랭킹 (5-1), 내 그룹 랭킹 (5-2)                                                               |
| 그룹 포트폴리오 | `/group-portfolio`  | 그룹 상세 (6-1), 보유 요약 (6-2), 멤버 (6-3), 경쟁 팀 (6-4)                                       |
| 피드백 리포트   | `/feedback-report`  | 그룹 상세 (6-1)                                                                                   |
| 채팅            | `/chat`             | 그룹 상세 (6-1), 채팅 WebSocket (7-0), 메시지 (7-1), 전송 (7-2), 투표 목록 (8-1), 투표 제출 (8-2) |
| 매칭방          | `/matching-rooms`   | 매칭방 목록 (9-1), 생성 (9-0), 참가 (9-2), 나가기 (9-3), 시작 (9-4)                               |
| **관리자**      | **`/admin`**        | **대회 목록/생성/수정 (10-1~10-3), 대회별 팀 (10-4), 매칭방 목록 (10-5), 유저 목록 (10-6)**       |
| 로그인/회원가입 | `/login`, `/signup` | 로그인 (1-1), 회원가입 (1-2). User.teamId, User.role 연동.                                        |

- `/admin`은 `role === "admin"` 사용자만 접근. 미충족 시 `/login`으로 리다이렉트.

---

## 12. 공통

- **Base URL**: 환경 변수로 관리 (예: `VITE_API_BASE_URL`).
- **인증**: 로그인 후 토큰 또는 세션 쿠키로 API 요청. Admin API는 추가로 `role === "admin"` 검증.
- **에러**: HTTP 4xx/5xx 시 공통 에러 형식 권장 (예: `{ "code": "string", "message": "string" }`).
- **날짜**: 서버는 ISO 8601 문자열 권장. 클라이언트는 필요 시 `Date` 변환.

---

## 13. Mock 데이터·프론트 구조

API로 받아야 할 데이터는 **mock**으로만 두고, **페이지는 서비스를 통해** 가져오도록 구성했습니다.

| 구분            | 위치                 | 설명                                                                                                                                                                                  |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mock 데이터** | `src/mocks/`         | `userData`, `investmentData`, `stockMarketData`, `stockDetailData`, `competitionData`, `rankingData`, `groupPortfolioData`, `competingTeamsData`, `chatData`, `voteData`              |
| **타입**        | `src/types/index.ts` | API 응답·요청 타입 (본 명세 §1~10과 대응)                                                                                                                                             |
| **서비스**      | `src/services/`      | `investmentService`, `marketService`, `stockService`, `competitionService`, `rankingService`, `groupService`, `chatService`, `voteService`, `matchingRoomService`, **`adminService`** |
| **페이지**      | `src/pages/*`        | 서비스 호출 후 state에 저장해 사용. **mocks 직접 import 없음** (AuthContext는 로그인/회원가입용 mock 유지)                                                                            |

- **백엔드 연동 시**: `src/services/*.ts` 내부만 수정 (예: `getMyInvestment()` → `fetch('/api/me/investment')`). 페이지 코드는 그대로 둬도 됨.
- **인증**: 로그인/회원가입은 `AuthContext`에서 mock 사용. 실서비스 시 백엔드 인증 API로 교체.
