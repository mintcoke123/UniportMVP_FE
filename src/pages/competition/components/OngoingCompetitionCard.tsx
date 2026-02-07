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
    <div
      className="bg-gradient-to-br from-[#0088FF] to-[#6155F5] rounded-2xl p-8 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
      onClick={handleWatch}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">{name}</h2>
          <p className="text-3xl text-white font-mono">
            <span className="text-lg mr-2">종료까지</span>
            {timeRemaining}
          </p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
          <i className="ri-arrow-right-line text-3xl text-white"></i>
        </div>
      </div>
    </div>
  );
};

export default OngoingCompetitionCard;
