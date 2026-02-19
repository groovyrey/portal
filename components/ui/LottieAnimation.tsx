'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LottieAnimationProps {
  animationData?: any;
  animationPath?: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function LottieAnimation({
  animationData,
  animationPath,
  loop = true,
  autoplay = true,
  className,
  style,
}: LottieAnimationProps) {
  const [data, setData] = useState<any>(animationData);

  useEffect(() => {
    if (animationPath && !animationData) {
      fetch(animationPath)
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch((err) => console.error('Error loading Lottie animation:', err));
    }
  }, [animationPath, animationData]);

  if (!data) return <div className={className} style={style} />;

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  );
}
