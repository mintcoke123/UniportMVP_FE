import Header from '../../components/feature/Header';
import OngoingTournamentCard from './components/OngoingTournamentCard';
import UpcomingTournamentCard from './components/UpcomingTournamentCard';
import { ongoingTournaments, upcomingTournaments } from '../../mocks/tournamentData';

const TournamentPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">토너먼트</h1>
          <p className="text-gray-600 text-lg">실력을 겨루고 보상을 획득하세요</p>
        </div>

        {/* Ongoing Tournament Section - Single Large Block */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">진행 중 토너먼트</h2>
          </div>
          {ongoingTournaments.length > 0 && (
            <OngoingTournamentCard
              id={ongoingTournaments[0].id}
              name="토너먼트 이름"
              endDate={ongoingTournaments[0].endDate}
            />
          )}
        </section>

        {/* Upcoming Tournaments Section - Vertical List */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-teal-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">예정된 토너먼트</h2>
          </div>
          <div className="space-y-4">
            {upcomingTournaments.map((tournament) => (
              <UpcomingTournamentCard
                key={tournament.id}
                id={tournament.id}
                name="토너먼트 이름"
                startDate={tournament.startDate}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TournamentPage;
