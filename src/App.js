import React, { useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const intervalRef = useRef();
  const emojiRef = useRef();

  const expressionToEmoji = {
    happy: "😄",
    sad: "🙁",
    angry: "😡",
    surprised: "😮",
    disgusted: "🤢",
    fearful: "😨",
    neutral: "😐",
  };

  useEffect(() => {
    const MODEL_URL = process.env.PUBLIC_URL + "/models";

    const start = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      // ✅ Ensure video dimensions are ready before detection
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };

      videoRef.current.onplay = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };
        faceapi.matchDimensions(canvas, displaySize);

        intervalRef.current = setInterval(async () => {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          const resized = faceapi.resizeResults(detections, displaySize);
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // faceapi.draw.drawDetections(canvas, resized);
          // faceapi.draw.drawFaceLandmarks(canvas, resized);
          // faceapi.draw.drawFaceExpressions(canvas, resized);

          if (detections.length > 0) {
            const detection = resized[0];
            const expressions = detection.expressions;
            const maxExp = Object.keys(expressions).reduce((a, b) =>
              expressions[a] > expressions[b] ? a : b
            );
            const emoji = expressionToEmoji[maxExp] || "😐";
            emojiRef.current.textContent = emoji;

            // Position emoji above the detected face
            const box = detection.detection.box;
            emojiRef.current.style.left = `${box.x + box.width / 2 - 32}px`;
            emojiRef.current.style.top = `${box.y - 60}px`;
          } else {
            emojiRef.current.textContent = "😐";
          }
        }, 100);
      };
    };

    start();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Real-time Face & Emotion Recognition</h2>
      <div style={{ position: "relative", display: "inline-block" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          width="720"
          height="560"
          style={{ borderRadius: "10px" }}
        />
        <canvas
          ref={canvasRef}
          width="720"
          height="560"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        <div
          ref={emojiRef}
          style={{
            position: "absolute",
            fontSize: "64px",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          😐
        </div>
      </div>
      <p>Allow webcam access and see your emotions detected live!</p>
    </div>
  );
}

export default App;
