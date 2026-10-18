import React from "react";
import { HelpCircle } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { RealVideoWindow } from "../components/RealVideoWindow";
import { GlassBadge } from "../components/GlassBadge";

export const Real_Scene_Help: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15 } });

  const zoom = interpolate(frame, [0, 80, 260, 360], [1, 1.3, 1.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotY = interpolate(frame, [0, 360], [-2, 2]);

  return (
    <div className="relative flex h-full w-full items-center justify-center p-16 select-none">
      {/* Top Floating iOS Glass Badge */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30">
        <GlassBadge
          icon={HelpCircle}
          step="05 / Qo'llab-quvvatlash"
          title="Yordam & FAQ Markazi"
          subtitle="Tez-tez beriladigan savollar va batafsil yo'riqnomalar"
        />
      </div>

      {/* 3D Real Video Window */}
      <div
        className="mt-24 transition-transform"
        style={{
          transform: `perspective(1600px) rotateY(${rotY}deg) scale(${enter})`,
          opacity: enter,
        }}
      >
        <RealVideoWindow
          startFromFrame={3480} // ~58s in recording
          scale={zoom}
          originX={50}
          originY={45}
          url="https://lingospeek.uz/help"
        />
      </div>
    </div>
  );
};
