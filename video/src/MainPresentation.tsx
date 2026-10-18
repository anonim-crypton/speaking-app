import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "./components/Background";
import { Scene1_Intro } from "./scenes/Scene1_Intro";
import { Real_Scene_Login } from "./scenes/Real_Scene_Login";
import { Real_Scene_Onboarding } from "./scenes/Real_Scene_Onboarding";
import { Real_Scene_Dashboard } from "./scenes/Real_Scene_Dashboard";
import { Real_Scene_Friends } from "./scenes/Real_Scene_Friends";
import { Scene5_MobileExperience } from "./scenes/Scene5_MobileExperience";
import { Real_Scene_Help } from "./scenes/Real_Scene_Help";
import { Scene6_Outro } from "./scenes/Scene6_Outro";

// Frame Timings (60 FPS)
export const SCENE_DURATIONS = {
  intro: 270,        // 0 - 270 (4.5s)
  login: 360,        // 270 - 630 (6.0s)
  onboarding: 390,   // 630 - 1020 (6.5s)
  dashboard: 840,    // 1020 - 1860 (14.0s)
  friends: 480,      // 1860 - 2340 (8.0s)
  mobile: 420,       // 2340 - 2760 (7.0s)
  help: 300,         // 2760 - 3060 (5.0s)
  outro: 300,        // 3060 - 3360 (5.0s)
};

export const TOTAL_DURATION = 3360; // 56.00 seconds @ 60 FPS

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

      {/* 2. Real Login Screen with Smooth Zoom & Cursor */}
      <Sequence from={270} durationInFrames={SCENE_DURATIONS.login}>
        <SceneWrapper duration={SCENE_DURATIONS.login}>
          <Real_Scene_Login />
        </SceneWrapper>
      </Sequence>

      {/* 3. Real Onboarding & Profile Setup with Click Animation */}
      <Sequence from={630} durationInFrames={SCENE_DURATIONS.onboarding}>
        <SceneWrapper duration={SCENE_DURATIONS.onboarding}>
          <Real_Scene_Onboarding />
        </SceneWrapper>
      </Sequence>

      {/* 4. Real Main Speaking Dashboard with Dynamic Zoom onto START Button */}
      <Sequence from={1020} durationInFrames={SCENE_DURATIONS.dashboard}>
        <SceneWrapper duration={SCENE_DURATIONS.dashboard}>
          <Real_Scene_Dashboard />
        </SceneWrapper>
      </Sequence>

      {/* 5. Real Friends & Messages Messenger View */}
      <Sequence from={1860} durationInFrames={SCENE_DURATIONS.friends}>
        <SceneWrapper duration={SCENE_DURATIONS.friends}>
          <Real_Scene_Friends />
        </SceneWrapper>
      </Sequence>

      {/* 6. 3D iPhone Mockup showcasing Responsive Floating Capsule & Avatar */}
      <Sequence from={2340} durationInFrames={SCENE_DURATIONS.mobile}>
        <SceneWrapper duration={SCENE_DURATIONS.mobile}>
          <Scene5_MobileExperience />
        </SceneWrapper>
      </Sequence>

      {/* 7. Real Help & Support FAQ Center */}
      <Sequence from={2760} durationInFrames={SCENE_DURATIONS.help}>
        <SceneWrapper duration={SCENE_DURATIONS.help}>
          <Real_Scene_Help />
        </SceneWrapper>
      </Sequence>

      {/* 8. Grand Outro & Call to Action */}
      <Sequence from={3060} durationInFrames={SCENE_DURATIONS.outro}>
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
