/** Flag marks used by the language switcher, 1:1 with production. */

export function UzFlag({ className = "w-6 h-6" }: { className?: string }) {
  const stars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
    const x = 300 + (i % 4) * 40;
    const y = 70 + Math.floor(i / 4) * 30;
    return (
      <polygon
        key={i}
        points={`${x},${y - 8} ${x + 2.5},${y - 2.5} ${x + 8},${y} ${x + 2.5},${y + 2.5} ${x},${y + 8} ${x - 2.5},${y + 2.5} ${x - 8},${y} ${x - 2.5},${y - 2.5}`}
        fill="#fff"
      />
    );
  });
  return (
    <svg
      viewBox="0 0 900 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="900" height="600" fill="#1EB53A" />
      <rect width="900" height="400" fill="#fff" />
      <rect width="900" height="200" fill="#0099B5" />
      <rect y="210" width="900" height="10" fill="#CE1126" />
      <rect y="380" width="900" height="10" fill="#CE1126" />
      <circle cx="200" cy="100" r="50" fill="#fff" />
      <circle cx="215" cy="100" r="45" fill="#0099B5" />
      {stars}
    </svg>
  );
}

export function RuFlag({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="900" height="200" fill="#ffffff" />
      <rect y="200" width="900" height="200" fill="#0C47B7" />
      <rect y="400" width="900" height="200" fill="#E53B35" />
    </svg>
  );
}
