import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "./components/Background";
import { Scene1_Intro } from "./scenes/Scene1_Intro";
import { Scene2_HeroLanding } from "./scenes/Scene2_HeroLanding";
import { Scene3_LiveMatching } from "./scenes/Scene3_LiveMatching";
import { Scene4_DashboardFeatures } from "./scenes/Scene4_DashboardFeatures";
import { Scene5_MobileExperience } from "./scenes/Scene5_MobileExperience";
import { Scene6_Outro } from "./scenes/Scene6_Outro";

// Frame Timings (60 FPS)
export const SCENE_DURATIONS = {
  intro: 270,        // 0 - 270 (4.5s)
  landing: 360,      // 270 - 630 (6.0s)
  liveCall: 390,     // 630 - 1020 (6.5s)
  dashboard: 390,    // 1020 - 1410 (6.5s)
  mobile: 390,       // 1410 - 1800 (6.5s)
  outro: 300,        // 1800 - 2100 (5.0s)
};

export const TOTAL_DURATION = 2100; // 35 seconds @ 60 FPS

export const MainPresentation: React.FC = () => {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070412] text-white font-sans">
      {/* Persistent Animated 4K Backdrop */}
      <Background />

      {/* 1. Intro */}
      <Sequence from={0} durationInFrames={SCENE_DURATIONS.intro}>
        <SceneWrapper duration={SCENE_DURATIONS.intro}>
          <Scene1_Intro />
        </SceneWrapper>
      </Sequence>

      {/* 2. Hero Landing */}
      <Sequence from={270} durationInFrames={SCENE_DURATIONS.landing}>
        <SceneWrapper duration={SCENE_DURATIONS.landing}>
          <Scene2_HeroLanding />
        </SceneWrapper>
      </Sequence>

      {/* 3. Live 1-on-1 Call */}
      <Sequence from={630} durationInFrames={SCENE_DURATIONS.liveCall}>
        <SceneWrapper duration={SCENE_DURATIONS.liveCall}>
          <Scene3_LiveMatching />
        </SceneWrapper>
      </Sequence>

      {/* 4. Full Dashboard Features */}
      <Sequence from={1020} durationInFrames={SCENE_DURATIONS.dashboard}>
        <SceneWrapper duration={SCENE_DURATIONS.dashboard}>
          <Scene4_DashboardFeatures />
        </SceneWrapper>
      </Sequence>

      {/* 5. Mobile Responsive Experience */}
      <Sequence from={1410} durationInFrames={SCENE_DURATIONS.mobile}>
        <SceneWrapper duration={SCENE_DURATIONS.mobile}>
          <Scene5_MobileExperience />
        </SceneWrapper>
      </Sequence>

      {/* 6. Grand Outro & Call to Action */}
      <Sequence from={1800} durationInFrames={SCENE_DURATIONS.outro}>
        <SceneWrapper duration={SCENE_DURATIONS.outro} isLast>
          <Scene6_Outro />
        </SceneWrapper>
      </Sequence>
    </div>
  );
};

// Smooth cross-fade wrapper for each scene
const SceneWrapper: React.FC<{
  children: React.ReactNode;
  duration: number;
  isLast?: boolean;
}> = ({ children, duration, isLast = false }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = isLast
    ? 1
    : interpolate(frame, [duration - 20, duration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <div
      className="h-full w-full"
      style={{
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      {children}
    </div>
  );
};
