const canvas = document.querySelector("#lab-canvas");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let scale = 1;

function resize() {
  scale = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function drawHex(cx, cy, radius, stroke, fill) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.4;
  ctx.fill();
  ctx.stroke();
}

function drawCircuit(time) {
  const startX = width * 0.08;
  const startY = height * 0.18;
  ctx.strokeStyle = "rgba(0, 166, 214, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 7; i += 1) {
    const x = startX + i * 86;
    const y = startY + Math.sin(time * 0.0012 + i) * 20;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 64 + (i % 2) * 24);
    ctx.moveTo(x, y);
  }
  ctx.stroke();

  for (let i = 0; i < 7; i += 1) {
    const x = startX + i * 86;
    const y = startY + Math.sin(time * 0.0012 + i) * 20;
    ctx.fillStyle = i % 2 === 0 ? "rgba(112, 191, 68, 0.75)" : "rgba(245, 166, 35, 0.72)";
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWaves(time) {
  const lines = [
    ["rgba(0, 166, 214, 0.48)", 0.52, 30, 0],
    ["rgba(236, 95, 103, 0.38)", 0.6, 24, 1.7],
    ["rgba(112, 191, 68, 0.34)", 0.68, 18, 2.4],
  ];

  lines.forEach(([stroke, yRatio, amp, phase]) => {
    ctx.beginPath();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.4;
    for (let x = -20; x <= width + 20; x += 12) {
      const baseY = height * yRatio;
      const y =
        baseY +
        Math.sin(x * 0.017 + time * 0.002 + phase) * amp +
        Math.sin(x * 0.043 + time * 0.0015) * (amp * 0.32);
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

function drawHexField(time) {
  const radius = Math.max(24, Math.min(42, width / 34));
  const spacingX = radius * 1.75;
  const spacingY = radius * 1.52;
  const originX = width * 0.62;
  const originY = height * 0.22;
  const colors = [
    "rgba(0, 166, 214, 0.12)",
    "rgba(245, 166, 35, 0.14)",
    "rgba(112, 191, 68, 0.12)",
  ];

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const pulse = Math.sin(time * 0.0014 + row * 0.8 + col * 0.5) * 0.5 + 0.5;
      const x = originX + col * spacingX + (row % 2) * (spacingX / 2);
      const y = originY + row * spacingY;
      drawHex(
        x,
        y,
        radius,
        `rgba(17, 24, 39, ${0.08 + pulse * 0.08})`,
        colors[(row + col) % colors.length],
      );
    }
  }
}

function drawSensor(time) {
  const x = width * 0.74;
  const y = height * 0.77;
  const w = Math.min(320, width * 0.28);
  const h = 56;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.12);
  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.strokeStyle = "rgba(17, 24, 39, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(245, 166, 35, 0.72)";
  ctx.fillRect(-w * 0.38, -6, w * 0.3, 12);
  ctx.fillRect(w * 0.08, -6, w * 0.3, 12);
  const spark = Math.sin(time * 0.006) * 0.5 + 0.5;
  ctx.strokeStyle = `rgba(0, 166, 214, ${0.28 + spark * 0.55})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.07, 0);
  ctx.bezierCurveTo(-18, -22, 18, 22, w * 0.07, 0);
  ctx.stroke();
  ctx.restore();
}

function draw(time = 0) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(247, 251, 255, 1)";
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = "multiply";
  drawHexField(time);
  drawCircuit(time);
  drawWaves(time);
  drawSensor(time);
  ctx.globalCompositeOperation = "source-over";

  requestAnimationFrame(draw);
}

resize();
draw();
window.addEventListener("resize", resize);
