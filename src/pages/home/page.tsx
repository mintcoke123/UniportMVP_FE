export default function Home() {
  const winners = [
    {
      rank: 1,
      profitPct: "+101.24%",
      name: "가즈아~",
      assets: "20,123,800원",
    },
    {
      rank: 2,
      profitPct: "+28.79%",
      name: "배민내꺼",
      assets: "12,878,933원",
    },
    {
      rank: 3,
      profitPct: "+26.67%",
      name: "엄",
      assets: "12,666,600원",
    },
  ] as const;
  const surveyUrl =
    "https://docs.google.com/forms/d/1nvWJjVSmeMY6Ev2s-etKNf6teg8HF-haVaTBj5PSeKM/viewform?hl=ko&hl=ko&edit_requested=true";

  return (
    <div className="min-h-screen bg-gray-50 min-w-0 overflow-x-hidden">
      <main className="pt-4 pb-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full box-border">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-700 font-semibold">
                모의투자 대회가 종료되었습니다.
              </p>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                상품 지급은 차주(3월 넷째주)에 순위에 따라 지급됩니다.
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <i className="ri-award-line text-2xl text-teal-600" aria-hidden />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {winners.map((w) => (
              <div
                key={w.rank}
                className={`rounded-2xl p-4 border ${
                  w.rank === 1
                    ? "bg-yellow-50 border-yellow-200"
                    : w.rank === 2
                      ? "bg-gray-50 border-gray-200"
                      : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {w.rank}위
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {w.profitPct}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-gray-900 truncate">
                  {w.name}
                </p>
                <p className="text-sm text-gray-700 mt-1">{w.assets}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              상품 안내
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>1등(1명): 배민 5만원 권</li>
              <li>2등(1명): 배민 3만원 권</li>
              <li>3등(2명): 배민 1만원 권</li>
              <li>참여상(2명): 스타벅스 기프티콘</li>
            </ul>
          </div>
        </section>

        <section className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <a
            href={surveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
          >
            대회 피드백 설문조사 참여하기
          </a>
          <p className="text-xs text-gray-500 mt-2">
            설문조사를 진행하면 소정의 상품(추첨을 통해 스타벅스 기프티콘 3명)을
            드립니다.
          </p>
        </section>
      </main>
    </div>
  );
}
