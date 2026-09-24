/**
 * 풍성한 한가위 - 움직이는 추석 인사 카드 (script.js)
 * - Canvas 파티클 (별빛, 단풍잎, 은행잎, 소원 풍등, 클릭 스파클)
 * - Web Audio API 기반 한국 전통 펜타토닉 가야금/오르골 사운드 신스
 * - 한옥 대문 인트로 & 보름달 떠오름 연출
 * - 보름달 소원 빌기 모달 및 인터랙션
 * - 고해상도 카드 이미지 (PNG) 저장 & 카톡 복사 기능
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. 상태 및 엘리먼트 참조
  // ==========================================
  const canvas = document.getElementById('sky-canvas');
  const ctx = canvas.getContext('2d');
  const cardElement = document.getElementById('chuseok-card');
  const fullMoon = document.getElementById('full-moon');

  // 문구 표시 요소
  const displayRecipient = document.getElementById('display-recipient');
  const displayTitle = document.getElementById('display-title');
  const displayMessage = document.getElementById('display-message');
  const displaySender = document.getElementById('display-sender');

  // 툴바 버튼
  const btnReplayGate = document.getElementById('btn-replay-gate');
  const btnBgm = document.getElementById('btn-bgm');
  const bgmIcon = document.getElementById('bgm-icon');
  const bgmLabel = document.getElementById('bgm-label');
  const btnWish = document.getElementById('btn-wish');
  const btnSave = document.getElementById('btn-save');
  const btnKakao = document.getElementById('btn-kakao');

  // 대문 및 어린이 인트로 요소
  const hanokGateOverlay = document.getElementById('hanok-gate-overlay');
  const btnOpenGate = document.getElementById('btn-open-gate');
  const boyCharacter = document.querySelector('.boy-character');
  const girlCharacter = document.querySelector('.girl-character');

  // 모달 요소 (소원 빌기 전용)
  const modalWish = document.getElementById('modal-wish');
  const inputWishText = document.getElementById('input-wish-text');
  const btnCloseWish = document.getElementById('btn-close-wish');
  const btnCancelWish = document.getElementById('btn-cancel-wish');
  const btnSendWish = document.getElementById('btn-send-wish');

  const toastMessage = document.getElementById('toast-message');

  // ==========================================
  // 3. 토스트 알림 헬퍼
  // ==========================================
  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = msg;
    toastMessage.classList.add('show');
    toastTimer = setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2800);
  }

  // ==========================================
  // 4. 캔버스 파티클 시스템 (별, 단풍잎, 풍등, 스파클)
  // ==========================================
  let width, height;
  function resizeCanvas() {
    const rect = cardElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // 고해상도(레티나) 화면에서 선명하게
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // (1) 별빛 데이터
  const stars = [];
  const STAR_COUNT = 55;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random() * 0.7, // 상단 70% 영역에 주로 배치
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      color: Math.random() > 0.3 ? '#fef08a' : '#ffffff'
    });
  }

  // (2) 가을 낙엽 데이터 (단풍잎 & 은행잎)
  const leaves = [];
  const LEAF_COUNT = 14;
  for (let i = 0; i < LEAF_COUNT; i++) {
    leaves.push(createLeaf(true));
  }

  function createLeaf(randomY = false) {
    const isGinkgo = Math.random() > 0.55;
    return {
      type: isGinkgo ? 'ginkgo' : 'maple',
      x: Math.random() * (width || 500),
      y: randomY ? Math.random() * (height || 700) : -30,
      size: Math.random() * 10 + 12,
      vx: (Math.random() - 0.5) * 0.7,
      vy: Math.random() * 0.9 + 0.6,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.03,
      swayRange: Math.random() * 30 + 15,
      swaySpeed: Math.random() * 0.02 + 0.015,
      swayOffset: Math.random() * Math.PI * 2,
      color: isGinkgo
        ? (Math.random() > 0.5 ? '#facc15' : '#eab308')
        : (Math.random() > 0.5 ? '#dc2626' : '#ea580c'),
      opacity: Math.random() * 0.3 + 0.65
    };
  }

  // (3) 소원 풍등 (Wish Lanterns)
  const lanterns = [];
  function addLantern(text) {
    lanterns.push({
      x: width * 0.5 + (Math.random() - 0.5) * (width * 0.45),
      y: height + 20,
      targetX: width * 0.5 + (Math.random() - 0.5) * (width * 0.25),
      vy: Math.random() * 0.7 + 0.9,
      size: Math.random() * 8 + 24,
      swayAngle: Math.random() * Math.PI * 2,
      text: text || "뭉치자!",
      alpha: 1,
      glowPulse: 0
    });
  }

  // 초기 웰컴 풍등 2개 살짝 띄우기
  setTimeout(() => addLantern("풍요로운 한가위"), 1500);
  setTimeout(() => addLantern("뭉치자 여러분 행복기원"), 5000);

  // (4) 인터랙티브 클릭 스파클 파티클 및 풍등 트레일
  const morphLantern = document.getElementById('morph-lantern');
  let lastTrailTime = 0;
  const sparkles = [];
  function addSparkles(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      sparkles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        size: Math.random() * 3.5 + 1.5,
        alpha: 1,
        color: Math.random() > 0.3 ? '#fef08a' : '#fb923c'
      });
    }
  }

  // 낙엽 모양 그리기 (화면 캔버스 & 저장 이미지 공용)
  function drawLeafShape(c, type, size) {
    if (type === 'ginkgo') {
      // 은행잎 (부채꼴)
      c.beginPath();
      c.moveTo(0, size * 0.4);
      c.lineTo(-size * 0.5, -size * 0.3);
      c.quadraticCurveTo(0, -size * 0.6, size * 0.5, -size * 0.3);
      c.closePath();
      c.fill();
      // 잎자루
      c.beginPath();
      c.moveTo(0, size * 0.4);
      c.lineTo(0, size * 0.7);
      c.strokeStyle = '#a16207';
      c.lineWidth = Math.max(1, size / 18);
      c.stroke();
    } else {
      // 단풍잎 (별 모양 잎)
      c.beginPath();
      const s = size * 0.5;
      c.moveTo(0, -s);
      c.lineTo(s * 0.3, -s * 0.2);
      c.lineTo(s, -s * 0.3);
      c.lineTo(s * 0.4, s * 0.2);
      c.lineTo(s * 0.7, s * 0.8);
      c.lineTo(0, s * 0.4);
      c.lineTo(-s * 0.7, s * 0.8);
      c.lineTo(-s * 0.4, s * 0.2);
      c.lineTo(-s, -s * 0.3);
      c.lineTo(-s * 0.3, -s * 0.2);
      c.closePath();
      c.fill();
    }
  }

  // 캔버스 렌더링 루프
  let animFrameId;
  function render(time) {
    ctx.clearRect(0, 0, width, height);

    // [1] 별빛 렌더링
    stars.forEach(star => {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;
      const px = star.x * width;
      const py = star.y * height;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#fef08a';
      ctx.fill();
      ctx.restore();
    });

    // [2] 소원 풍등 렌더링
    for (let i = lanterns.length - 1; i >= 0; i--) {
      const l = lanterns[i];
      l.y -= l.vy;
      l.swayAngle += 0.025;
      l.x += Math.sin(l.swayAngle) * 0.45;
      l.glowPulse += 0.05;

      // 소원등 본체 및 촛불 빛무리
      ctx.save();
      ctx.translate(l.x, l.y);
      const glowSize = l.size * 2 + Math.sin(l.glowPulse) * 4;

      // 후광
      const lanternGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, glowSize);
      lanternGlow.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      lanternGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
      lanternGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);

      // 풍등 몸통 (부드러운 사각 기둥)
      ctx.beginPath();
      const hw = l.size * 0.55;
      const hh = l.size * 0.8;
      ctx.moveTo(-hw, -hh);
      ctx.lineTo(hw, -hh);
      ctx.lineTo(hw * 0.85, hh);
      ctx.lineTo(-hw * 0.85, hh);
      ctx.closePath();

      const bodyGrad = ctx.createLinearGradient(0, -hh, 0, hh);
      bodyGrad.addColorStop(0, '#fef08a');
      bodyGrad.addColorStop(0.6, '#f59e0b');
      bodyGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = bodyGrad;
      ctx.globalAlpha = l.alpha;
      ctx.fill();

      // 소원 문구 (작은 텍스트)
      if (l.text) {
        ctx.fillStyle = '#7c2d12';
        ctx.font = 'bold 8.5px "Nanum Myeongjo", serif';
        ctx.textAlign = 'center';
        ctx.fillText(l.text.slice(0, 8), 0, 2);
      }

      ctx.restore();

      // 화면 위로 벗어나면 제거
      if (l.y < -50) {
        lanterns.splice(i, 1);
      }
    }

    // [3] 가을 낙엽 렌더링 (단풍잎/은행잎)
    leaves.forEach(leaf => {
      leaf.y += leaf.vy;
      leaf.angle += leaf.vAngle;
      const swayX = Math.sin(time * 0.001 * leaf.swaySpeed * 100 + leaf.swayOffset) * 0.8;
      leaf.x += leaf.vx + swayX;

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);
      ctx.globalAlpha = leaf.opacity;
      ctx.fillStyle = leaf.color;
      drawLeafShape(ctx, leaf.type, leaf.size);
      ctx.restore();

      // 화면 아래로 떨어지면 위에서 다시 생성
      if (leaf.y > height + 40 || leaf.x < -40 || leaf.x > width + 40) {
        Object.assign(leaf, createLeaf(false));
      }
    });

    // [4] 클릭 스파클 파티클 렌더링
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const sp = sparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.08; // 중력
      sp.alpha -= 0.022;

      if (sp.alpha <= 0) {
        sparkles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = sp.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = sp.color;
      ctx.fill();
      ctx.restore();
    }

    // [5] 승천하는 모핑 풍등의 황금 별빛 트레일 파티클
    if (morphLantern && time - lastTrailTime > 80) {
      const mStyle = window.getComputedStyle(morphLantern);
      const mOpacity = parseFloat(mStyle.opacity);
      if (mOpacity > 0.25) {
        const cardRect = cardElement.getBoundingClientRect();
        const mRect = morphLantern.getBoundingClientRect();
        const mx = mRect.left + mRect.width / 2 - cardRect.left;
        const my = mRect.top + mRect.height * 0.75 - cardRect.top;
        if (my > -40 && my < height + 40) {
          sparkles.push({
            x: mx + (Math.random() - 0.5) * 22,
            y: my + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 0.9,
            vy: Math.random() * 0.9 + 0.4,
            size: Math.random() * 3.2 + 1.2,
            alpha: 0.95,
            color: Math.random() > 0.35 ? '#fef08a' : '#f59e0b'
          });
          lastTrailTime = time;
        }
      }
    }

    animFrameId = requestAnimationFrame(render);
  }
  animFrameId = requestAnimationFrame(render);

  // 카드 클릭 시 스파클 터치 효과
  cardElement.addEventListener('pointerdown', (e) => {
    const rect = cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addSparkles(x, y, 10);
  });

  // 보름달 클릭 시 풍등 띄우기 & 종소리
  fullMoon.parentElement.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = cardElement.getBoundingClientRect();
    const moonRect = fullMoon.getBoundingClientRect();
    const x = moonRect.left + moonRect.width / 2 - rect.left;
    const y = moonRect.top + moonRect.height / 2 - rect.top;
    addSparkles(x, y, 22);
    addLantern("뭉치자 여러분 소원성취!");
    playChimeSound();
    showToast("🌕 소원 풍등이 보름달을 향해 떠오릅니다!");
  });

  // ==========================================
  // 5. Web Audio API 기반 정통 가야금 사운드 신시사이저 & 밝은 한가위 축제 가락
  // ==========================================
  let audioCtx = null;
  let isMusicPlaying = false;
  let musicTimer = null;
  let noteIndex = 0;

  // 가야금 전통 12현 음계 (D-F-G-A-C 펜타토닉 음계: 베이스 현부터 고음 현까지)
  const GAYA_FREQS = {
    // 저음현 (베이스 현: 묵직한 명주실 울림)
    'D3': 146.83,
    'F3': 174.61,
    'G3': 196.00,
    'A3': 220.00,
    'C4': 261.63,
    // 중음현 (주선율 현)
    'D4': 293.66,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'C5': 523.25,
    // 고음현 (청아하고 맑은 장식현)
    'D5': 587.33,
    'F5': 698.46,
    'G5': 783.99,
    'A5': 880.00,
    'C6': 1046.50
  };

  // 밝고 흥겨운 한가위 풍년 축제 가락 (경쾌한 자진모리 장단 느낌: 128 BPM)
  // "얼씨구 좋다! 풍년이 왔네, 뭉치자 여러분 즐거운 한가위로구나!"
  const GAYAGEUM_MELODY = [
    // [1] 흥겨운 도입: 둥- 당- 동당동당 (베이스 현과 함께 경쾌한 시작)
    { note: 'D5', bass: 'D3', dur: 0.22, nong: false },
    { note: 'C5', bass: null, dur: 0.20, nong: false },
    { note: 'A4', bass: null, dur: 0.40, nong: true },  // 농현
    { note: 'F4', bass: 'F3', dur: 0.22, nong: false },
    { note: 'G4', bass: null, dur: 0.20, nong: false },
    { note: 'A4', bass: null, dur: 0.42, nong: true },

    // [2] 신명나는 고음 상승: 따단- 딴딴 딴!
    { note: 'C5', bass: 'A3', dur: 0.22, nong: false },
    { note: 'D5', bass: null, dur: 0.20, nong: false },
    { note: 'F5', bass: null, dur: 0.35, nong: true },
    { note: 'G5', bass: 'D3', dur: 0.24, nong: false }, // 화사한 고음
    { note: 'A5', bass: null, dur: 0.46, nong: true },  // 시원하게 뻗는 최고음
    { note: 'G5', bass: null, dur: 0.22, nong: false },

    // [3] 또르륵 경쾌하게 굴러내려오는 핑거링
    { note: 'F5', bass: 'F3', dur: 0.22, nong: false },
    { note: 'D5', bass: null, dur: 0.20, nong: false },
    { note: 'C5', bass: null, dur: 0.22, nong: false },
    { note: 'A4', bass: 'A3', dur: 0.35, nong: true },
    { note: 'G4', bass: null, dur: 0.20, nong: false },
    { note: 'F4', bass: null, dur: 0.22, nong: false },
    { note: 'G4', bass: 'G3', dur: 0.42, nong: true },

    // [4] 얼씨구 좋다! 신명나는 맺음과 도약
    { note: 'A4', bass: null, dur: 0.22, nong: false },
    { note: 'C5', bass: null, dur: 0.22, nong: false },
    { note: 'D5', bass: 'D3', dur: 0.44, nong: true },
    { note: 'C5', bass: null, dur: 0.22, nong: false },
    { note: 'D5', bass: 'D3', dur: 0.65, nong: true }   // 풍성한 긴 여운
  ];

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 진짜 가야금(명주실 + 오동나무 울림통 + 손가락 플럭 + 농현) 사운드 합성
  function playGayageumPluck(freq, duration = 0.5, volume = 0.24, hasNonghyeon = false) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // 1. 배음 풍부한 메인 톱니파 (명주실의 칼칼하고 앙칼진 현 울림)
    const oscSaw = audioCtx.createOscillator();
    oscSaw.type = 'sawtooth';
    oscSaw.frequency.setValueAtTime(freq, now);

    // 2. 따뜻한 기본음 삼각파 (현의 굵기와 기본 톤)
    const oscTri = audioCtx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(freq, now);

    // 농현 (Nonghyeon: 가야금 왼손 줄 누름 - 음정의 깊고 찰진 흔들림)
    if (hasNonghyeon && duration > 0.3) {
      const vibStart = now + 0.1;
      const vibPeak = now + 0.22;
      oscSaw.frequency.setValueAtTime(freq, vibStart);
      oscSaw.frequency.linearRampToValueAtTime(freq * 1.032, vibPeak);
      oscSaw.frequency.linearRampToValueAtTime(freq * 0.99, vibPeak + 0.1);
      oscSaw.frequency.linearRampToValueAtTime(freq, now + duration);

      oscTri.frequency.setValueAtTime(freq, vibStart);
      oscTri.frequency.linearRampToValueAtTime(freq * 1.032, vibPeak);
      oscTri.frequency.linearRampToValueAtTime(freq * 0.99, vibPeak + 0.1);
      oscTri.frequency.linearRampToValueAtTime(freq, now + duration);
    }

    // 3. 오동나무 울림통 공명 대역 필터 (Resonant Lowpass Filter)
    const bodyFilter = audioCtx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(2800, now);
    bodyFilter.frequency.exponentialRampToValueAtTime(750, now + 0.14);
    bodyFilter.Q.setValueAtTime(2.8, now); // 안족(줄받침) 공명 피크

    // 4. 게인 엔벨로프 (손끝 뜯김: 4ms의 찰나 어택 + 자연스러운 지수 감쇠)
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.35, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + duration + 0.1);

    // 5. 손톱 튕김 펄스 (Finger Pluck Transient Noise)
    const pluckOsc = audioCtx.createOscillator();
    const pluckGain = audioCtx.createGain();
    pluckOsc.type = 'triangle';
    pluckOsc.frequency.setValueAtTime(freq * 3.5, now);
    pluckOsc.frequency.exponentialRampToValueAtTime(120, now + 0.025);
    pluckGain.gain.setValueAtTime(volume * 0.5, now);
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    pluckOsc.connect(pluckGain);
    pluckGain.connect(bodyFilter);

    oscSaw.connect(bodyFilter);
    oscTri.connect(bodyFilter);
    bodyFilter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscSaw.start(now);
    oscTri.start(now);
    pluckOsc.start(now);

    const stopTime = now + duration + 0.15;
    oscSaw.stop(stopTime);
    oscTri.stop(stopTime);
    pluckOsc.stop(now + 0.03);
  }

  // 멜로디 루프 스케줄러 (경쾌한 가야금 합주)
  function scheduleNextNote() {
    if (!isMusicPlaying) return;
    const item = GAYAGEUM_MELODY[noteIndex];
    const freq = GAYA_FREQS[item.note] || 440;

    // 메인 주선율 가야금 타현
    playGayageumPluck(freq, item.dur * 1.6, 0.24, item.nong);

    // 강박(Downbeat)에 저음 베이스 현 둥- 울려주기
    if (item.bass && GAYA_FREQS[item.bass]) {
      const bassFreq = GAYA_FREQS[item.bass];
      setTimeout(() => {
        playGayageumPluck(bassFreq, 0.7, 0.28, false);
      }, 8);
    }

    noteIndex = (noteIndex + 1) % GAYAGEUM_MELODY.length;
    const stepTime = item.dur * 1000 + 40;
    musicTimer = setTimeout(scheduleNextNote, stepTime);
  }

  function toggleMusic() {
    initAudio();
    if (isMusicPlaying) {
      isMusicPlaying = false;
      if (musicTimer) clearTimeout(musicTimer);
      bgmIcon.textContent = '🎶';
      bgmLabel.textContent = '가야금 켜기';
      btnBgm.classList.remove('active');
      showToast('가야금 연주가 정지되었습니다.');
    } else {
      isMusicPlaying = true;
      bgmIcon.textContent = '✨';
      bgmLabel.textContent = '연주 끄기';
      btnBgm.classList.add('active');
      scheduleNextNote();
      showToast('🌸 신명나는 한가위 가야금 가락이 울립니다!');
    }
  }

  // 소원 빌기 시 맑고 깊은 국악 종/가야금 울림
  function playChimeSound() {
    initAudio();
    if (!audioCtx) return;
    const chimeNotes = ['A4', 'C5', 'F5', 'A5'];
    chimeNotes.forEach((noteName, idx) => {
      setTimeout(() => {
        const freq = GAYA_FREQS[noteName] || 440;
        playGayageumPluck(freq, 1.4, 0.18, true);
      }, idx * 100);
    });
  }

  btnBgm.addEventListener('click', toggleMusic);

  // ==========================================
  // 6. 소원 빌기 모달 열기/닫기
  // ==========================================
  btnWish.addEventListener('click', () => {
    modalWish.classList.add('open');
    inputWishText.focus();
  });
  btnCloseWish.addEventListener('click', () => modalWish.classList.remove('open'));
  btnCancelWish.addEventListener('click', () => modalWish.classList.remove('open'));

  // Enter로 바로 띄우기, Esc로 닫기
  inputWishText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) btnSendWish.click();
    if (e.key === 'Escape') modalWish.classList.remove('open');
  });

  btnSendWish.addEventListener('click', () => {
    const wish = inputWishText.value.trim() || "뭉치자 여러분 대박 기원!";
    addLantern(wish);
    playChimeSound();
    modalWish.classList.remove('open');
    inputWishText.value = '';
    showToast("소원 풍등이 하늘로 띄워졌습니다! 🏮");
  });

  // 모달 바깥 배경 클릭 시 닫기
  modalWish.addEventListener('click', (e) => {
    if (e.target === modalWish) modalWish.classList.remove('open');
  });

  // ==========================================
  // 7. [씬 1] 한옥 대문 열기 및 가야금 배경음악 즉시 재생
  // ==========================================
  function openHanokGate() {
    if (!hanokGateOverlay || hanokGateOverlay.classList.contains('opened')) return;

    // 1. 남녀 어린이 정중한 깊은 절 모션
    if (boyCharacter) boyCharacter.classList.add('deep-bow');
    if (girlCharacter) girlCharacter.classList.add('deep-bow');

    // 2. 가야금 맑은 차임 효과음
    playChimeSound();

    setTimeout(() => {
      // 3. 대문 좌우 3D 회전 개방
      hanokGateOverlay.classList.add('opened');

      // 4. 보름달 서서히 솟아오름 (Moon Rise)
      const moonSection = document.getElementById('moon-section');
      if (moonSection) {
        moonSection.classList.remove('moon-risen');
        void moonSection.offsetWidth; // 리플로우 강제하여 애니메이션 재시작 보장
        moonSection.classList.add('moon-risen');
      }

      // 5. 문이 열리자마자 신명나는 가야금 배경음악 즉시 재생!
      if (!isMusicPlaying) {
        toggleMusic();
      }

      showToast("🌸 어서오세요! 뭉치자 여러분 풍요로운 한가위 되세요 🌕");
    }, 420);
  }

  function replayHanokGate() {
    if (!hanokGateOverlay) return;
    if (boyCharacter) boyCharacter.classList.remove('deep-bow');
    if (girlCharacter) girlCharacter.classList.remove('deep-bow');
    hanokGateOverlay.classList.remove('opened');

    const moonSection = document.getElementById('moon-section');
    if (moonSection) {
      moonSection.classList.remove('moon-risen');
    }

    showToast("한옥 대문 인트로를 다시 감상합니다.");
  }

  if (btnOpenGate) {
    btnOpenGate.addEventListener('click', (e) => {
      e.stopPropagation();
      openHanokGate();
    });
  }

  if (hanokGateOverlay) {
    hanokGateOverlay.addEventListener('click', openHanokGate);
  }

  if (btnReplayGate) {
    btnReplayGate.addEventListener('click', replayHanokGate);
  }

  // ==========================================
  // 8. 카드 고화질 이미지(PNG) 생성 및 카톡 전송
  // ==========================================
  btnSave.addEventListener('click', () => {
    showToast("카드 이미지를 생성하는 중입니다...");
    generateCardImage();
  });

  if (btnKakao) {
    btnKakao.addEventListener('click', () => {
      copyCardForKakao();
    });
  }

  // 화면에 그려진 SVG 일러스트를 그대로 이미지로 변환 (저장 이미지와 화면 일러스트를 동일하게 유지)
  function loadSvgImage(svgEl, drawW, drawH) {
    return new Promise((resolve, reject) => {
      const clone = svgEl.cloneNode(true);
      clone.setAttribute('width', drawW);
      clone.setAttribute('height', drawH);
      const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
      img.src = url;
    });
  }

  // 한 줄이 너무 길면 어절 단위로 줄바꿈
  function wrapText(c, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
      const test = current ? `${current} ${word}` : word;
      if (current && c.measureText(test).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines;
  }

  // 1080 x 1480 고해상도 오프스크린 캔버스 드로잉
  async function renderCardToCanvas() {
    const W = 1080;
    const H = 1480;
    const S = W / 520; // 화면 카드(520px) 대비 배율

    // 일러스트 크기/위치 (화면 카드 비율 기준)
    const moonX = W / 2;
    const moonY = 400;
    const moonR = 200;
    const k = (moonR * 2) / 175; // 화면 보름달(175px) 대비 배율
    const rabbitW = 150 * k, rabbitH = 130 * k;
    const branchW = 210 * S, branchH = branchW * 200 / 260;
    const hanokH = 110 * S;
    const maruH = W * 180 / 520;

    const [, rabbitImg, branchImg, hanokImg, maruImg] = await Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      loadSvgImage(document.querySelector('.rabbit-svg'), rabbitW, rabbitH),
      loadSvgImage(document.querySelector('.branch-svg'), branchW, branchH),
      loadSvgImage(document.querySelector('.hanok-svg'), W, hanokH),
      loadSvgImage(document.querySelector('.maru-svg'), W, maruH)
    ]);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = W;
    exportCanvas.height = H;
    const eCtx = exportCanvas.getContext('2d');

    // [1] 깊은 밤하늘 그라데이션
    const bgGrad = eCtx.createRadialGradient(W / 2, moonY, 100, W / 2, moonY, H * 0.9);
    bgGrad.addColorStop(0, '#223759');
    bgGrad.addColorStop(0.5, '#121d33');
    bgGrad.addColorStop(1, '#080e1a');
    eCtx.fillStyle = bgGrad;
    eCtx.fillRect(0, 0, W, H);

    // [2] 밤하늘 별빛 (은은한 빛번짐 포함)
    for (let i = 0; i < 110; i++) {
      const sx = 60 + Math.random() * (W - 120);
      const sy = 60 + Math.random() * (H * 0.7);
      const sr = Math.random() * 2.2 + 0.8;
      eCtx.beginPath();
      eCtx.arc(sx, sy, sr, 0, Math.PI * 2);
      eCtx.fillStyle = Math.random() > 0.4 ? '#fef08a' : '#ffffff';
      eCtx.globalAlpha = Math.random() * 0.7 + 0.3;
      eCtx.shadowColor = '#fef08a';
      eCtx.shadowBlur = 8;
      eCtx.fill();
    }
    eCtx.globalAlpha = 1.0;
    eCtx.shadowBlur = 0;

    // [3] 은은한 구름
    [[260, 330, 300, 90], [820, 250, 260, 80]].forEach(([cx, cy, rx, ry]) => {
      const cloud = eCtx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      cloud.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
      cloud.addColorStop(1, 'rgba(255, 255, 255, 0)');
      eCtx.save();
      eCtx.translate(cx, cy);
      eCtx.scale(1, ry / rx);
      eCtx.translate(-cx, -cy);
      eCtx.fillStyle = cloud;
      eCtx.fillRect(cx - rx, cy - rx, rx * 2, rx * 2);
      eCtx.restore();
    });

    // [4] 커다란 황금 보름달 & 달무리
    const auraGrad = eCtx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 2.1);
    auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    auraGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.15)');
    auraGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    eCtx.fillStyle = auraGrad;
    eCtx.fillRect(moonX - moonR * 2.2, moonY - moonR * 2.2, moonR * 4.4, moonR * 4.4);

    const moonGrad = eCtx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, 10, moonX, moonY, moonR);
    moonGrad.addColorStop(0, '#fffdf0');
    moonGrad.addColorStop(0.4, '#fef08a');
    moonGrad.addColorStop(0.7, '#fde047');
    moonGrad.addColorStop(1, '#eab308');
    eCtx.beginPath();
    eCtx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    eCtx.fillStyle = moonGrad;
    eCtx.shadowColor = 'rgba(253, 224, 71, 0.8)';
    eCtx.shadowBlur = 60;
    eCtx.fill();
    eCtx.shadowBlur = 0;

    // 달 내부: 분화구 음영 + 떡방아 찧는 달토끼 (화면과 동일한 SVG)
    eCtx.save();
    eCtx.beginPath();
    eCtx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    eCtx.clip();

    const moonLeft = moonX - moonR;
    const moonTop = moonY - moonR;
    eCtx.fillStyle = 'rgba(217, 119, 6, 0.09)';
    [[20, 25, 45, 35], [30, 110, 30, 26], [122, 60, 38, 32]].forEach(([x, y, w, h]) => {
      eCtx.beginPath();
      eCtx.ellipse(moonLeft + (x + w / 2) * k, moonTop + (y + h / 2) * k, (w / 2) * k, (h / 2) * k, 0, 0, Math.PI * 2);
      eCtx.fill();
    });

    // 달 가장자리 안쪽 음영 (입체감)
    const rimGrad = eCtx.createRadialGradient(moonX - 30, moonY - 30, moonR * 0.7, moonX, moonY, moonR * 1.05);
    rimGrad.addColorStop(0, 'rgba(202, 138, 4, 0)');
    rimGrad.addColorStop(1, 'rgba(202, 138, 4, 0.35)');
    eCtx.fillStyle = rimGrad;
    eCtx.fillRect(moonLeft, moonTop, moonR * 2, moonR * 2);

    eCtx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    eCtx.shadowBlur = 8;
    eCtx.shadowOffsetY = 4;
    eCtx.drawImage(rabbitImg, moonX - rabbitW * 0.48, moonY + moonR - 8 * k - rabbitH, rabbitW, rabbitH);
    eCtx.restore();

    // [5] 감나무 가지 (상단 우측, 화면과 동일한 SVG)
    eCtx.save();
    eCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    eCtx.shadowBlur = 20;
    eCtx.shadowOffsetY = 8;
    eCtx.drawImage(branchImg, W - branchW - 6 * S, 6 * S, branchW, branchH);
    eCtx.restore();

    // [6] 흩날리는 단풍잎 & 은행잎 몇 장
    const exportLeaves = [
      [150, 620, 26, 0.6, 'maple', '#dc2626'], [930, 700, 22, -0.4, 'ginkgo', '#facc15'],
      [210, 960, 20, 1.2, 'ginkgo', '#eab308'], [880, 990, 24, 2.1, 'maple', '#ea580c'],
      [110, 300, 18, -0.8, 'ginkgo', '#facc15'], [700, 660, 16, 0.9, 'maple', '#dc2626']
    ];
    exportLeaves.forEach(([lx, ly, size, angle, type, color]) => {
      eCtx.save();
      eCtx.translate(lx, ly);
      eCtx.rotate(angle);
      eCtx.globalAlpha = 0.85;
      eCtx.fillStyle = color;
      drawLeafShape(eCtx, type, size);
      eCtx.restore();
    });

    // [7] 하단 한옥 기와 & 툇마루에 앉아 달을 바라보는 남녀 어린이 (화면과 동일한 SVG)
    eCtx.drawImage(hanokImg, 0, H - hanokH, W, hanokH);
    eCtx.save();
    eCtx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    eCtx.shadowBlur = 36;
    eCtx.shadowOffsetY = -10;
    eCtx.drawImage(maruImg, 0, H - maruH, W, maruH);
    eCtx.restore();

    // [8] 텍스트 렌더링 (호칭, 타이틀, 메시지, 서명)
    eCtx.textAlign = 'center';
    eCtx.textBaseline = 'alphabetic';

    // 1) 받는 분
    eCtx.font = '700 38px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#fef08a';
    eCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    eCtx.shadowBlur = 10;
    eCtx.fillText(`〔 ${displayRecipient.textContent.trim()} 〕`, W / 2, 700);

    // 2) 메인 타이틀 (화면과 같은 흰색→금색 그라데이션)
    const titleY = 782;
    eCtx.font = '800 62px "Nanum Myeongjo", serif';
    const titleGrad = eCtx.createLinearGradient(0, titleY - 55, 0, titleY + 8);
    titleGrad.addColorStop(0.1, '#ffffff');
    titleGrad.addColorStop(0.85, '#fef08a');
    eCtx.fillStyle = titleGrad;
    eCtx.shadowBlur = 24;
    eCtx.shadowColor = 'rgba(253, 224, 71, 0.6)';
    eCtx.fillText(displayTitle.textContent.trim(), W / 2, titleY);

    // 3) 인사말 본문 (줄바꿈 + 긴 줄 자동 줄바꿈)
    eCtx.font = '400 33px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#f8fafc';
    eCtx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    eCtx.shadowBlur = 8;
    const rawMsg = displayMessage.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');
    const msgLines = [];
    rawMsg.split('\n').forEach(line => {
      const cleanLine = line.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
      if (cleanLine) msgLines.push(...wrapText(eCtx, cleanLine, W - 200));
    });
    let lineY = 862;
    const lineHeight = 54;
    msgLines.forEach(line => {
      eCtx.fillText(line, W / 2, lineY);
      lineY += lineHeight;
    });

    // 4) 보내는 분 & 붉은 인장 도장 ("秋夕")
    const senderY = lineY + 18;
    const senderText = displaySender.textContent.trim();
    eCtx.font = '700 29px "Nanum Myeongjo", serif';
    const senderW = eCtx.measureText(senderText).width;
    const stampSize = 44;
    const gap = 16;
    const groupLeft = W / 2 - (senderW + gap + stampSize) / 2;
    eCtx.textAlign = 'left';
    eCtx.fillStyle = '#cbd5e1';
    eCtx.fillText(senderText, groupLeft, senderY);
    eCtx.shadowBlur = 0;

    const stampX = groupLeft + senderW + gap;
    const stampY = senderY - 34;
    eCtx.fillStyle = 'rgba(220, 38, 38, 0.18)';
    eCtx.fillRect(stampX, stampY, stampSize, stampSize);
    eCtx.strokeStyle = '#dc2626';
    eCtx.lineWidth = 3;
    eCtx.strokeRect(stampX, stampY, stampSize, stampSize);
    eCtx.font = '700 19px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#ef4444';
    eCtx.textAlign = 'center';
    eCtx.textBaseline = 'middle';
    eCtx.fillText('秋夕', stampX + stampSize / 2, stampY + stampSize / 2 + 1);
    eCtx.textBaseline = 'alphabetic';

    // [9] 전통 창호 프레임 & 모서리 금빛 선 (일러스트 위에 덮어 그림)
    eCtx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
    eCtx.lineWidth = 3;
    eCtx.strokeRect(24, 24, W - 48, H - 48);

    eCtx.setLineDash([8, 8]);
    eCtx.strokeStyle = 'rgba(253, 224, 71, 0.22)';
    eCtx.lineWidth = 2;
    eCtx.strokeRect(34, 34, W - 68, H - 68);
    eCtx.setLineDash([]);

    eCtx.strokeStyle = '#facc15';
    eCtx.lineWidth = 6;
    eCtx.lineCap = 'square';
    const cs = 40;
    const m = 24;
    eCtx.beginPath();
    eCtx.moveTo(m, m + cs); eCtx.lineTo(m, m); eCtx.lineTo(m + cs, m);
    eCtx.moveTo(W - m - cs, m); eCtx.lineTo(W - m, m); eCtx.lineTo(W - m, m + cs);
    eCtx.moveTo(m, H - m - cs); eCtx.lineTo(m, H - m); eCtx.lineTo(m + cs, H - m);
    eCtx.moveTo(W - m - cs, H - m); eCtx.lineTo(W - m, H - m); eCtx.lineTo(W - m, H - m - cs);
    eCtx.stroke();

    return exportCanvas;
  }

  function canvasToBlob(c) {
    return new Promise((resolve, reject) => {
      c.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
    });
  }

  // 카드 PNG 파일로 다운로드
  async function generateCardImage() {
    try {
      const exportCanvas = await renderCardToCanvas();
      const link = document.createElement('a');
      link.download = `chuseok_greeting_card_${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("🎉 카드가 이미지로 저장되었습니다!");
    } catch (err) {
      console.error('Card image export failed:', err);
      showToast("이미지 생성에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  // 카톡 전송용 클립보드 복사 (PC 카톡에서 Ctrl+V로 바로 전송)
  function copyCardForKakao() {
    showToast("카톡 전송용 이미지 복사 중...");

    // 텍스트 메시지 생성
    const rawMsg = displayMessage.innerText.trim();
    const fullShareText = `🌕 [한가위 추석 인사]\n\n${displayRecipient.innerText}\n\n${rawMsg}\n\n- ${displaySender.innerText} -`;

    if (navigator.clipboard && window.ClipboardItem) {
      // Blob 대신 Promise를 넘겨야 사파리에서도 사용자 클릭 직후 복사 권한이 유지됨
      const blobPromise = renderCardToCanvas().then(canvasToBlob);
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobPromise })
      ]).then(() => {
        showToast("💬 카드가 복사되었습니다! 카톡 대화방에서 Ctrl+V 하세요!");
      }).catch(err => {
        console.warn('Clipboard image write failed, using fallback:', err);
        fallbackKakaoShare(fullShareText);
      });
    } else {
      fallbackKakaoShare(fullShareText);
    }
  }

  function fallbackKakaoShare(text) {
    generateCardImage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      showToast("📥 카드 이미지 저장 및 인사말 복사 완료! 카톡에 사진을 첨부하세요.");
    } else {
      showToast("📥 카드 이미지가 저장되었습니다. 카톡으로 사진을 전송하세요!");
    }
  }
});
