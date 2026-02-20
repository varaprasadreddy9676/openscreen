interface AudioLevelMeterProps {
  level: number; // 0-100
  className?: string;
}

export function AudioLevelMeter({ level, className = "" }: AudioLevelMeterProps) {
  // Determine color based on level
  const getBarColor = () => {
    if (level > 80) return 'bg-red-500';
    if (level > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex items-center gap-1 h-4 ${className}`}>
      {/* 5 level bars */}
      {[20, 40, 60, 80, 100].map((threshold, index) => (
        <div
          key={threshold}
          className={`w-1 h-full rounded-sm transition-all duration-75 ${
            level >= threshold
              ? getBarColor()
              : 'bg-white/20'
          }`}
          style={{
            height: `${40 + index * 15}%`, // Bars get progressively taller
          }}
        />
      ))}
    </div>
  );
}
