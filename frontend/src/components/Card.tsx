import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import GameModeComponent from './GameModeComponent';

export function PlayCard() {
  const navigate = useNavigate();

  const gameModeData = [
    {
      icon: (
        <img
          src="/lightning-bolt.png"
          className="inline-block h-6 w-6 object-contain"
          alt="online"
        />
      ),
      title: 'Play Online',
      description: 'Play vs a person of similar rating',
      onClick: () => {
        navigate('/game/random');
      },
      disabled: false,
    },
    {
      icon: (
        <img
          src="/computer.png"
          className="inline-block h-6 w-6 object-contain"
          alt="computer"
        />
      ),
      title: 'Play Computer',
      description: 'Challenge an AI bot from novice to grandmaster',
      onClick: () => {
        navigate('/computer');
      },
      disabled: false,
    },
    {
      icon: (
        <img
          src="/friendship.png"
          className="inline-block h-6 w-6 object-contain"
          alt="friend"
        />
      ),
      title: 'Play a Friend',
      description: 'Invite a friend with an instant game link',
      disabled: false,
      onClick: () => {
        navigate('/game/random');
      },
    },
    {
      icon: (
        <img
          src="/trophy.png"
          className="inline-block h-6 w-6 object-contain"
          alt="tournament"
        />
      ),
      title: 'Tournaments',
      description: 'Join competitive Swiss and Arena tournaments',
      onClick: () => {
        navigate('/tournaments');
      },
      disabled: false,
    },
    {
      icon: (
        <img
          src="/strategy.png"
          className="inline-block h-6 w-6 object-contain"
          alt="variants"
        />
      ),
      title: 'Chess Variants',
      description: 'Chess960, King of the Hill, Three-Check and more',
      onClick: () => {
        navigate('/variants');
      },
      disabled: false,
    },
  ];

  return (
    <Card className="bg-transparent border-none shadow-none w-full max-w-md">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="font-bold tracking-tight flex flex-col items-center justify-center">
          <div className="text-3xl font-extrabold text-white flex items-center gap-2">
            Play <span className="text-green-500">Pak Chess</span>
          </div>
          <img className="w-24 mt-4 drop-shadow-lg" src="/chess.png" alt="Pak Chess" />
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-0 mt-2">
        {gameModeData.map((data, index) => (
          <GameModeComponent key={index} {...data} />
        ))}
      </CardContent>
    </Card>
  );
}
