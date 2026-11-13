// src/components/LoadingIndicator.jsx
import { useEffect, useState } from "react";

const LoadingIndicator = ({ text = "불러오는 중" }) => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // 문구 끝의 "..."은 제거하고 동적 점을 붙임
  const cleanText = text.replace(/\.+$/, "").trim();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "240px",
        padding: "48px 20px",
        textAlign: "center",
        color: "#2c5f4c",
        fontSize: "15px",
        fontWeight: "600",
        letterSpacing: "-0.02em",
      }}
      role="status"
      aria-live="polite"
    >
      <span>
        {cleanText}
        <span style={{ display: "inline-block", width: "1.4em", textAlign: "left" }}>
          {".".repeat(dotCount)}
        </span>
      </span>
    </div>
  );
};

export default LoadingIndicator;