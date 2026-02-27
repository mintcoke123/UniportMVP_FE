import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UpcomingCompetitionCardProps {
  id: number;
  name: string;
  startDate: Date;
}

const UpcomingCompetitionCard = ({
  id,
  name,
  startDate,
}: UpcomingCompetitionCardProps) => {
  const navigate = useNavigate();
  const [timeUntilStart, setTimeUntilStart] = useState("00:00:00:00");

  useEffect(() => {
    const calculateTimeUntilStart = () => {
      const now = new Date();
      const diff = startDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilStart("00:00:00:00");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatTime = (num: number) => num.toString().padStart(2, "0");
      setTimeUntilStart(
        `${formatTime(days)}:${formatTime(hours)}:${formatTime(
          minutes
        )}:${formatTime(seconds)}`
      );
    };

    calculateTimeUntilStart();
    const interval = setInterval(calculateTimeUntilStart, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  const handleJoin = () => {
    navigate("/");
  };

  return (
    <button
      type="button"
      className="w-full text-left bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all duration-300 min-h-[44px]"
      onClick={handleJoin}
      aria-label={`${name} 예정된 대회`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 truncate">{name}</h3>
          <p className="text-sm sm:text-base text-gray-600 font-mono tabular-nums">
            <span className="text-xs sm:text-sm mr-2">시작까지</span>
            {timeUntilStart}
          </p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors duration-300">
          <i className="ri-arrow-right-line text-xl sm:text-2xl text-gray-700" aria-hidden />
        </div>
      </div>
    </button>
  );
};

export default UpcomingCompetitionCard;
