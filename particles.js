(() => {
  const canvas = document.getElementById('particle-sphere');
  const context = canvas?.getContext('2d');
  const button = document.querySelector('.motion-toggle');
  if (!context || !button) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const points = Array.from({ length: 1100 }, (_, index) => {
    const y = 1 - (index / 1099) * 2;
    const radius = Math.sqrt(1 - y * y);
    const longitude = index * Math.PI * (3 - Math.sqrt(5));
    return { x: Math.cos(longitude) * radius, y, z: Math.sin(longitude) * radius };
  });
  let size = 0;
  let angle = 0.3;
  let pointer = 0;
  let visible = true;
  let paused = reducedMotion.matches;
  let frame = null;
  let lastTime = null;

  function draw() {
    context.clearRect(0, 0, size, size);
    const rotation = angle + pointer;
    const projected = points.map((point, index) => {
      const x = point.x * Math.cos(rotation) + point.z * Math.sin(rotation);
      const z = point.z * Math.cos(rotation) - point.x * Math.sin(rotation);
      const y = point.y * Math.cos(0.25) - z * Math.sin(0.25);
      const depth = point.y * Math.sin(0.25) + z * Math.cos(0.25);
      const scale = 2.8 / (2.8 - depth);
      return { x: size / 2 + x * size * 0.31 * scale, y: size / 2 + y * size * 0.31 * scale, depth, index };
    }).sort((a, b) => a.depth - b.depth);

    for (const point of projected) {
      context.fillStyle = `rgba(33,32,28,${0.15 + (point.depth + 1) * 0.36})`;
      const radius = 0.45 + (point.depth + 1) * 0.45;
      if (point.index % 37 === 0 && point.depth > 0) {
        context.font = '9px Menlo, monospace';
        context.fillText(point.index % 2 ? '+' : ':', point.x, point.y);
      } else {
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  function tick(time) {
    frame = null;
    if (lastTime !== null) angle += Math.min(time - lastTime, 60) * 0.00012;
    lastTime = time;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
    button.textContent = paused ? 'Play motion' : 'Pause motion';
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  new ResizeObserver(() => {
    size = canvas.getBoundingClientRect().width;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }).observe(canvas);

  button.hidden = false;
  button.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  canvas.addEventListener('pointermove', event => {
    if (reducedMotion.matches || paused) return;
    const bounds = canvas.getBoundingClientRect();
    pointer = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.25;
  });
  canvas.addEventListener('pointerleave', () => { pointer = 0; });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updatePlayback(); });
  document.addEventListener('visibilitychange', updatePlayback);
  updatePlayback();
})();
