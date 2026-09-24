/**
 * 풍성한 한가위 - 움직이는 추석 인사 카드 (script.js)
 * - Canvas 파티클 (별빛, 단풍잎, 은행잎, 소원 풍등, 클릭 스파클)
 * - Web Audio API 기반 한국 전통 펜타토닉 가야금/오르골 사운드 신스
 * - 인사말 프리셋 및 실시간 커스텀 편집
 * - 보름달 소원 빌기 모달 및 인터랙션
 * - 고해상도 카드 이미지 (PNG) 저장 기능
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
  const btnBgm = document.getElementById('btn-bgm');
  const bgmIcon = document.getElementById('bgm-icon');
  const bgmLabel = document.getElementById('bgm-label');
  const btnWish = document.getElementById('btn-wish');
  const btnSave = document.getElementById('btn-save');
  const btnKakao = document.getElementById('btn-kakao');

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
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
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

  // (4) 인터랙티브 클릭 스파클 파티클
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

      if (leaf.type === 'ginkgo') {
        // 은행잎 (부채꼴)
        ctx.beginPath();
        ctx.moveTo(0, leaf.size * 0.4);
        ctx.lineTo(-leaf.size * 0.5, -leaf.size * 0.3);
        ctx.quadraticCurveTo(0, -leaf.size * 0.6, leaf.size * 0.5, -leaf.size * 0.3);
        ctx.closePath();
        ctx.fill();
        // 잎자루
        ctx.beginPath();
        ctx.moveTo(0, leaf.size * 0.4);
        ctx.lineTo(0, leaf.size * 0.7);
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // 단풍잎 (별 모양 잎)
        ctx.beginPath();
        const s = leaf.size * 0.5;
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.2);
        ctx.lineTo(s, -s * 0.3);
        ctx.lineTo(s * 0.4, s * 0.2);
        ctx.lineTo(s * 0.7, s * 0.8);
        ctx.lineTo(0, s * 0.4);
        ctx.lineTo(-s * 0.7, s * 0.8);
        ctx.lineTo(-s * 0.4, s * 0.2);
        ctx.lineTo(-s, -s * 0.3);
        ctx.lineTo(-s * 0.3, -s * 0.2);
        ctx.closePath();
        ctx.fill();
      }

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
  // 5. Web Audio API 사운드 신시사이저 (한국 전통 펜타토닉 가야금/오르골)
  // ==========================================
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
  // 8. 카드 고화질 이미지(PNG) 저장 기능
  // ==========================================
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

  // 1080 x 1480 고해상도 오프스크린 캔버스 드로잉
  function renderCardToCanvas() {
    const exportCanvas = document.createElement('canvas');
    const W = 1080;
    const H = 1480;
    exportCanvas.width = W;
    exportCanvas.height = H;
    const eCtx = exportCanvas.getContext('2d');

    // [1] 깊은 밤하늘 그라데이션
    const bgGrad = eCtx.createRadialGradient(W / 2, H * 0.35, 100, W / 2, H * 0.35, H * 0.9);
    bgGrad.addColorStop(0, '#223759');
    bgGrad.addColorStop(0.5, '#121d33');
    bgGrad.addColorStop(1, '#080e1a');
    eCtx.fillStyle = bgGrad;
    eCtx.fillRect(0, 0, W, H);

    // [2] 전통 창호 프레임 & 모서리 격자
    eCtx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
    eCtx.lineWidth = 4;
    eCtx.strokeRect(36, 36, W - 72, H - 72);

    eCtx.setLineDash([8, 8]);
    eCtx.strokeStyle = 'rgba(253, 224, 71, 0.25)';
    eCtx.lineWidth = 2;
    eCtx.strokeRect(48, 48, W - 96, H - 96);
    eCtx.setLineDash([]);

    // 모서리 포인트 금빛 선
    eCtx.strokeStyle = '#facc15';
    eCtx.lineWidth = 6;
    const cornerSize = 40;
    // 좌상단
    eCtx.beginPath();
    eCtx.moveTo(33, 33 + cornerSize); eCtx.lineTo(33, 33); eCtx.lineTo(33 + cornerSize, 33);
    // 우상단
    eCtx.moveTo(W - 33 - cornerSize, 33); eCtx.lineTo(W - 33, 33); eCtx.lineTo(W - 33, 33 + cornerSize);
    // 좌하단
    eCtx.moveTo(33, H - 33 - cornerSize); eCtx.lineTo(33, H - 33); eCtx.lineTo(33 + cornerSize, H - 33);
    // 우하단
    eCtx.moveTo(W - 33 - cornerSize, H - 33); eCtx.lineTo(W - 33, H - 33); eCtx.lineTo(W - 33, H - 33 - cornerSize);
    eCtx.stroke();

    // [3] 밤하늘 별빛 그리기
    for (let i = 0; i < 90; i++) {
      const sx = 60 + Math.random() * (W - 120);
      const sy = 60 + Math.random() * (H * 0.65);
      const sr = Math.random() * 2.5 + 0.8;
      eCtx.beginPath();
      eCtx.arc(sx, sy, sr, 0, Math.PI * 2);
      eCtx.fillStyle = Math.random() > 0.4 ? '#fef08a' : '#ffffff';
      eCtx.globalAlpha = Math.random() * 0.7 + 0.3;
      eCtx.fill();
    }
    eCtx.globalAlpha = 1.0;

    // [4] 커다란 황금 보름달 & 달무리
    const moonX = W / 2;
    const moonY = H * 0.32;
    const moonR = 190;

    // 달빛 오라
    const auraGrad = eCtx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 2.1);
    auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    auraGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.15)');
    auraGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    eCtx.fillStyle = auraGrad;
    eCtx.fillRect(moonX - moonR * 2.2, moonY - moonR * 2.2, moonR * 4.4, moonR * 4.4);

    // 보름달 본체
    const moonGrad = eCtx.createRadialGradient(moonX - 50, moonY - 50, 20, moonX, moonY, moonR);
    moonGrad.addColorStop(0, '#fffdf0');
    moonGrad.addColorStop(0.4, '#fef08a');
    moonGrad.addColorStop(0.75, '#fde047');
    moonGrad.addColorStop(1, '#eab308');
    eCtx.beginPath();
    eCtx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    eCtx.fillStyle = moonGrad;
    eCtx.shadowColor = 'rgba(253, 224, 71, 0.8)';
    eCtx.shadowBlur = 40;
    eCtx.fill();
    eCtx.shadowBlur = 0;

    // 달 표면 음영
    eCtx.fillStyle = 'rgba(217, 119, 6, 0.12)';
    eCtx.beginPath();
    eCtx.arc(moonX - 50, moonY - 60, 45, 0, Math.PI * 2);
    eCtx.arc(moonX - 70, moonY + 70, 35, 0, Math.PI * 2);
    eCtx.arc(moonX + 90, moonY - 10, 42, 0, Math.PI * 2);
    eCtx.fill();

    // [5] 달토끼와 절구 (실루엣 드로잉)
    eCtx.save();
    eCtx.translate(moonX - 10, moonY + 40);
    const scale = 1.35;
    eCtx.scale(scale, scale);

    // 절구
    eCtx.fillStyle = '#3a405a';
    eCtx.beginPath();
    eCtx.ellipse(15, -15, 24, 7, 0, 0, Math.PI * 2);
    eCtx.fill();
    eCtx.fillRect(-5, -15, 40, 45);
    eCtx.fillStyle = '#f1f5f9';
    eCtx.beginPath();
    eCtx.ellipse(15, -16, 16, 5, 0, 0, Math.PI * 2);
    eCtx.fill();

    // 토끼 몸체
    eCtx.fillStyle = '#f1f5f9';
    // 꼬리
    eCtx.beginPath(); eCtx.arc(-70, 22, 9, 0, Math.PI * 2); eCtx.fill();
    // 엉덩이/몸통
    eCtx.beginPath(); eCtx.ellipse(-45, 12, 26, 20, 0, 0, Math.PI * 2); eCtx.fill();
    // 가슴
    eCtx.beginPath(); eCtx.ellipse(-28, -4, 18, 16, 0, 0, Math.PI * 2); eCtx.fill();
    // 머리
    eCtx.beginPath(); eCtx.arc(-20, -24, 16, 0, Math.PI * 2); eCtx.fill();
    // 볼
    eCtx.fillStyle = '#fda4af';
    eCtx.beginPath(); eCtx.ellipse(-14, -18, 3.5, 2.5, 0, 0, Math.PI * 2); eCtx.fill();
    // 눈
    eCtx.fillStyle = '#1e293b';
    eCtx.beginPath(); eCtx.arc(-13, -25, 2, 0, Math.PI * 2); eCtx.fill();
    // 귀 2개
    eCtx.fillStyle = '#f1f5f9';
    eCtx.beginPath(); eCtx.ellipse(-26, -52, 6, 20, -0.2, 0, Math.PI * 2); eCtx.fill();
    eCtx.beginPath(); eCtx.ellipse(-15, -52, 6, 20, 0.2, 0, Math.PI * 2); eCtx.fill();
    eCtx.fillStyle = '#fbcfe8';
    eCtx.beginPath(); eCtx.ellipse(-26, -52, 3, 14, -0.2, 0, Math.PI * 2); eCtx.fill();
    eCtx.beginPath(); eCtx.ellipse(-15, -52, 3, 14, 0.2, 0, Math.PI * 2); eCtx.fill();

    // 방아공이
    eCtx.strokeStyle = '#d97706';
    eCtx.lineWidth = 5;
    eCtx.beginPath();
    eCtx.moveTo(2, -8); eCtx.lineTo(26, -58);
    eCtx.stroke();
    eCtx.fillStyle = '#b45309';
    eCtx.beginPath();
    eCtx.ellipse(28, -58, 8, 14, -0.4, 0, Math.PI * 2);
    eCtx.fill();

    eCtx.restore();

    // [6] 감나무 가지 (상단 우측)
    eCtx.save();
    eCtx.strokeStyle = '#4a3728';
    eCtx.lineWidth = 9;
    eCtx.lineCap = 'round';
    eCtx.beginPath();
    eCtx.moveTo(W - 40, 60);
    eCtx.quadraticCurveTo(W - 220, 100, W - 350, 190);
    eCtx.stroke();
    // 가지 분기
    eCtx.lineWidth = 5;
    eCtx.beginPath();
    eCtx.moveTo(W - 200, 115);
    eCtx.quadraticCurveTo(W - 240, 180, W - 280, 210);
    eCtx.stroke();

    // 감 열매 2개
    const drawPersimmon = (px, py) => {
      eCtx.fillStyle = '#ea580c';
      eCtx.beginPath();
      eCtx.ellipse(px, py, 22, 19, 0, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.fillStyle = '#3f5926';
      eCtx.beginPath();
      eCtx.ellipse(px, py - 18, 12, 4, 0, 0, Math.PI * 2);
      eCtx.fill();
    };
    drawPersimmon(W - 280, 230);
    drawPersimmon(W - 350, 210);
    eCtx.restore();

    // [7] 하단 한옥 기와지붕 실루엣
    eCtx.save();
    const roofGrad = eCtx.createLinearGradient(0, H - 220, 0, H);
    roofGrad.addColorStop(0, '#1e293b');
    roofGrad.addColorStop(1, '#090d16');
    eCtx.fillStyle = roofGrad;

    eCtx.beginPath();
    eCtx.moveTo(0, H);
    eCtx.lineTo(0, H - 120);
    eCtx.quadraticCurveTo(W * 0.25, H - 130, W * 0.42, H);
    eCtx.lineTo(0, H);
    eCtx.fill();

    eCtx.beginPath();
    eCtx.moveTo(W, H);
    eCtx.lineTo(W, H - 120);
    eCtx.quadraticCurveTo(W * 0.75, H - 130, W * 0.58, H);
    eCtx.lineTo(W, H);
    eCtx.fill();
    eCtx.restore();

    // [8] 텍스트 렌더링 (호칭, 타이틀, 메시지, 서명)
    eCtx.textAlign = 'center';

    // 1) 받는 분
    eCtx.font = 'bold 36px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#fef08a';
    eCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    eCtx.shadowBlur = 10;
    const recipientText = `〔 ${displayRecipient.textContent} 〕`;
    eCtx.fillText(recipientText, W / 2, H * 0.61);

    // 2) 메인 타이틀
    eCtx.font = '800 58px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#fffbeb';
    eCtx.shadowBlur = 20;
    eCtx.shadowColor = 'rgba(253, 224, 71, 0.7)';
    eCtx.fillText(displayTitle.textContent, W / 2, H * 0.69);
    eCtx.shadowBlur = 0;

    // 3) 인사말 본문 (줄바꿈 처리)
    eCtx.font = '400 32px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#f8fafc';
    eCtx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    eCtx.shadowBlur = 8;
    const rawMsg = displayMessage.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');
    const msgLines = rawMsg.split('\n');
    let startY = H * 0.76;
    const lineHeight = 54;
    msgLines.forEach(line => {
      const cleanLine = line.replace(/<[^>]*>?/gm, '').trim();
      if (cleanLine) {
        eCtx.fillText(cleanLine, W / 2, startY);
        startY += lineHeight;
      }
    });

    // 4) 보내는 분 & 도장
    const senderY = H * 0.90;
    eCtx.font = '600 28px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#cbd5e1';
    const senderText = displaySender.textContent;
    eCtx.fillText(senderText, W / 2 - 25, senderY);

    // 붉은 인장 도장 ("秋夕")
    eCtx.strokeStyle = '#dc2626';
    eCtx.lineWidth = 3;
    eCtx.strokeRect(W / 2 + 105, senderY - 26, 38, 38);
    eCtx.fillStyle = 'rgba(220, 38, 38, 0.2)';
    eCtx.fillRect(W / 2 + 105, senderY - 26, 38, 38);
    eCtx.font = 'bold 20px "Nanum Myeongjo", serif';
    eCtx.fillStyle = '#ef4444';
    eCtx.fillText('秋夕', W / 2 + 124, senderY + 1);

    return exportCanvas;
  }

  // 카드 PNG 파일로 다운로드
  function generateCardImage() {
    const exportCanvas = renderCardToCanvas();
    const imageUri = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `chuseok_greeting_card_${Date.now()}.png`;
    link.href = imageUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("🎉 카드가 이미지로 저장되었습니다!");
  }

  // 카톡 전송용 클립보드 복사 (PC 카톡에서 Ctrl+V로 바로 전송)
  function copyCardForKakao() {
    showToast("카톡 전송용 이미지 복사 중...");
    const exportCanvas = renderCardToCanvas();

    // 텍스트 메시지 생성
    const rawMsg = displayMessage.innerText.trim();
    const fullShareText = `🌕 [한가위 추석 인사]\n\n${displayRecipient.innerText}\n\n${rawMsg}\n\n- ${displaySender.innerText} -`;

    if (exportCanvas.toBlob && navigator.clipboard && window.ClipboardItem) {
      exportCanvas.toBlob(blob => {
        if (!blob) {
          fallbackKakaoShare(fullShareText);
          return;
        }
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          showToast("💬 카드가 복사되었습니다! 카톡 대화방에서 Ctrl+V 하세요!");
        }).catch(err => {
          console.warn('Clipboard image write failed, using fallback:', err);
          fallbackKakaoShare(fullShareText);
        });
      }, 'image/png');
    } else {
      fallbackKakaoShare(fullShareText);
    }
  }

  function fallbackKakaoShare(text) {
    generateCardImage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("📥 카드 이미지 저장 및 인사말 복사 완료! 카톡에 사진을 첨부하세요.");
    } else {
      showToast("📥 카드 이미지가 저장되었습니다. 카톡으로 사진을 전송하세요!");
    }
  }
});
