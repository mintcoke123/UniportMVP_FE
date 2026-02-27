import { useState, useEffect } from "react";
import OngoingCompetitionCard from "./components/OngoingCompetitionCard";
import UpcomingCompetitionCard from "./components/UpcomingCompetitionCard";
import { getOngoingCompetitions, getUpcomingCompetitions } from "../../services";

const CompetitionPage = () => {
  const [ongoingCompetitions, setOngoingCompetitions] = useState<
    Awaited<ReturnType<typeof getOngoingCompetitions>>
  >([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<
    Awaited<ReturnType<typeof getUpcomingCompetitions>>
  >([]);

  useEffect(() => {
    getOngoingCompetitions().then(setOngoingCompetitions);
    getUpcomingCompetitions().then(setUpcomingCompetitions);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 min-w-0 overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full box-border">
        {/* Page Title */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">대회</h1>
          <p className="text-gray-600 text-base sm:text-lg">
            주어진 기간 동안 투자하고, 최종 수익률로 순위를 겨루세요
          </p>
        </div>

        {/* Ongoing Competition Section - Single Large Block */}
        <section className="mb-10 sm:mb-16">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-1 h-6 sm:h-8 bg-blue-600 rounded-full flex-shrink-0" aria-hidden />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              진행 중 대회
            </h2>
          </div>
          {ongoingCompetitions.length > 0 && (
            <OngoingCompetitionCard
              id={ongoingCompetitions[0].id}
              name={ongoingCompetitions[0].name}
              endDate={ongoingCompetitions[0].endDate}
            />
          )}
        </section>

        {/* Upcoming Competitions Section - Vertical List */}
        <section>
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-1 h-6 sm:h-8 bg-teal-600 rounded-full flex-shrink-0" aria-hidden />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              예정된 대회
            </h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {upcomingCompetitions.map((competition) => (
              <UpcomingCompetitionCard
                key={competition.id}
                id={competition.id}
                name={competition.name}
                startDate={competition.startDate}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CompetitionPage;
