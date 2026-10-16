"use client";

const loaderStyles = `
.loader-wrapper {
  color: #fff;
  -webkit-user-select: none;
  user-select: none;
  background-color: transparent;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  width: 180px;
  height: 180px;
  font-family: Inter, sans-serif;
  font-size: 1.2em;
  font-weight: 300;
  display: flex;
  position: relative;
}
.loader {
  aspect-ratio: 1;
  z-index: 0;
  background-color: transparent;
  border-radius: 50%;
  width: 100%;
  animation: 2s linear infinite loader-rotate;
  position: absolute;
  top: 0;
  left: 0;
}
@keyframes loader-rotate {
  0% {
    transform: rotate(90deg);
    box-shadow: inset 0 10px 20px #fff, inset 0 20px 30px #ad5fff, inset 0 60px 60px #471eec;
  }
  50% {
    transform: rotate(270deg);
    box-shadow: inset 0 10px 20px #fff, inset 0 20px 10px #d60a47, inset 0 40px 60px #311e80;
  }
  to {
    transform: rotate(450deg);
    box-shadow: inset 0 10px 20px #fff, inset 0 20px 30px #ad5fff, inset 0 60px 60px #471eec;
  }
}
.loader-letter {
  opacity: 0.4;
  z-index: 1;
  border: none;
  border-radius: 50ch;
  animation: 2s infinite loader-letter-anim;
  display: inline-block;
  transform: translateY(0);
}
.loader-letter:first-child { animation-delay: 0s; }
.loader-letter:nth-child(2) { animation-delay: 0.1s; }
.loader-letter:nth-child(3) { animation-delay: 0.2s; }
.loader-letter:nth-child(4) { animation-delay: 0.3s; }
.loader-letter:nth-child(5) { animation-delay: 0.4s; }
.loader-letter:nth-child(6) { animation-delay: 0.5s; }
.loader-letter:nth-child(7) { animation-delay: 0.6s; }
.loader-letter:nth-child(8) { animation-delay: 0.7s; }
.loader-letter:nth-child(9) { animation-delay: 0.8s; }
.loader-letter:nth-child(10) { animation-delay: 0.9s; }
@keyframes loader-letter-anim {
  0%, to { opacity: 0.4; transform: translateY(0); }
  20% { opacity: 1; transform: scale(1.15); }
  40% { opacity: 0.7; transform: translateY(0); }
}
`;

export const Component = ({ showText = false }: { showText?: boolean }) => {
  return (
    <>
      <style>{loaderStyles}</style>
      <div className="loader-wrapper">
        {showText ? (
          <>
            <span className="loader-letter">G</span>
            <span className="loader-letter">e</span>
            <span className="loader-letter">n</span>
            <span className="loader-letter">e</span>
            <span className="loader-letter">r</span>
            <span className="loader-letter">a</span>
            <span className="loader-letter">t</span>
            <span className="loader-letter">i</span>
            <span className="loader-letter">n</span>
            <span className="loader-letter">g</span>
          </>
        ) : null}
        <div className="loader" />
      </div>
    </>
  );
};

export default Component;
