
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UpcomingTournamentCardProps {
  id: number;
  name: string;
  startDate: Date;
}

const UpcomingTournamentCard = ({ id, name, startDate }: UpcomingTournamentCardProps) => {
  const navigate = useNavigate();
  const [timeUntilStart, setTimeUntilStart] = useState('00:00:00:00');

  useEffect(() => {
    const calculateTimeUntilStart = () => {
      const now = new Date();
      const diff = startDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilStart('00:00:00:00');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatTime = (num: number) => num.toString().padStart(2, '0');
      setTimeUntilStart(`${formatTime(days)}:${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`);
    };

    calculateTimeUntilStart();
    const interval = setInterval(calculateTimeUntilStart, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  const handleJoin = () => {
    navigate('/');
  };

  return (
    <div 
      className="bg-white rounded-2xl p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-300"
      onClick={handleJoin}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {name}
          </h3>
          <p className="text-base text-gray-600 font-mono">
            <span className="text-sm mr-2">시작까지</span>
            {timeUntilStart}
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors duration-300">
          <i className="ri-arrow-right-line text-2xl text-gray-700"></i>
        </div>
      </div>
    </div>
  );
};

export default UpcomingTournamentCard;
