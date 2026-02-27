import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface OngoingCompetitionCardProps {
  id: number;
  name: string;
  endDate: Date;
}

const OngoingCompetitionCard = ({
  id,
  name,
  endDate,
}: OngoingCompetitionCardProps) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState("00:00:00:00");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("00:00:00:00");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatTime = (num: number) => num.toString().padStart(2, "0");
      setTimeRemaining(
        `${formatTime(days)}:${formatTime(hours)}:${formatTime(
          minutes
        )}:${formatTime(seconds)}`
      );
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  const handleWatch = () => {
    navigate("/ranking");
  };

  return (
    <button
      type="button"
      className="w-full text-left bg-gradient-to-br from-[#0088FF] to-[#6155F5] rounded-2xl p-5 sm:p-8 cursor-pointer hover:shadow-xl active:scale-[0.99] transition-all duration-300 min-h-[44px]"
      onClick={handleWatch}
      aria-label={`${name} 진행 중인 대회 보기`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-2xl font-semibold text-white mb-3 sm:mb-4 truncate">{name}</h2>
          <p className="text-xl sm:text-3xl text-white font-mono tabular-nums">
            <span className="text-sm sm:text-lg mr-2">종료까지</span>
            {timeRemaining}
          </p>
        </div>
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <i className="ri-arrow-right-line text-2xl sm:text-3xl text-white" aria-hidden />
        </div>
      </div>
    </button>
  );
};

export default OngoingCompetitionCard;
