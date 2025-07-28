// 要素取得
const textarea = document.getElementById('markdown');
const preview = document.getElementById('preview');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const volumeBar = document.getElementById('volume');
const pitchBar = document.getElementById('pitch');
const rateBox = document.getElementById('rate');
const voiceBox = document.getElementById('voice');

let paragraphs = [];
let current = 0;
let voices = [];

// 設定読み込み
function loadSettings() {
  volumeBar.value = localStorage.getItem('volume') || 1;
  pitchBar.value = localStorage.getItem('pitch') || 1;
  const rate = localStorage.getItem('rate') || 1;
  for (let i = 0.5; i <= 4; i += 0.5) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + '倍';
    if (i == rate) opt.selected = true;
    rateBox.appendChild(opt);
  }
}

// 声質更新
function updateVoices() {
  voices = speechSynthesis.getVoices();
  voiceBox.innerHTML = '';
  voices.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = v.name;
    voiceBox.appendChild(opt);
  });
  const saved = localStorage.getItem('voice');
  if (saved && voices[saved]) voiceBox.value = saved;
}

speechSynthesis.onvoiceschanged = updateVoices;

// プレビュー更新
function updatePreview() {
  preview.innerHTML = '';
  paragraphs = [];
  const lines = textarea.value.split(/\n+/);
  lines.forEach((line, idx) => {
    const html = marked.parse(line || ' ');
    const div = document.createElement('div');
    div.innerHTML = html;
    let el = div.firstElementChild;
    if (!el) {
      // パース結果が空の場合はプレーンテキストとして扱う
      el = document.createElement('p');
      el.textContent = line;
    }
    el.dataset.index = idx;
    el.addEventListener('click', () => {
      current = idx;
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      speakCurrent();
    });
    preview.appendChild(el);
    paragraphs.push(el);
  });
  current = 0;
}

textarea.addEventListener('input', updatePreview);

// 行ハイライト
function highlight(idx) {
  paragraphs.forEach(p => p.classList.remove('current'));
  if (paragraphs[idx]) paragraphs[idx].classList.add('current');
}

// 読み上げ実行
function speakCurrent() {
  if (current < 0 || current >= paragraphs.length) {
    return;
  }
  const text = paragraphs[current].textContent;
  if (!text.trim()) {
    current++;
    speakCurrent();
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.volume = parseFloat(volumeBar.value);
  u.pitch = parseFloat(pitchBar.value);
  u.rate = parseFloat(rateBox.value);
  u.voice = voices[voiceBox.value];
  highlight(current);
  u.onend = () => {
    paragraphs[current].classList.remove('current');
    current++;
    if (current < paragraphs.length) {
      speakCurrent();
    }
  };
  speechSynthesis.speak(u);
}

// 各種操作
playBtn.addEventListener('click', () => {
  if (speechSynthesis.speaking) {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    } else {
      speechSynthesis.pause();
    }
  } else {
    speakCurrent();
  }
});

stopBtn.addEventListener('click', () => {
  speechSynthesis.cancel();
  paragraphs.forEach(p => p.classList.remove('current'));
});

nextBtn.addEventListener('click', () => {
  speechSynthesis.cancel();
  if (current < paragraphs.length - 1) current++;
  speakCurrent();
});

prevBtn.addEventListener('click', () => {
  speechSynthesis.cancel();
  if (current > 0) current--;
  speakCurrent();
});

volumeBar.addEventListener('change', () => {
  localStorage.setItem('volume', volumeBar.value);
});

pitchBar.addEventListener('change', () => {
  localStorage.setItem('pitch', pitchBar.value);
});

rateBox.addEventListener('change', () => {
  localStorage.setItem('rate', rateBox.value);
});

voiceBox.addEventListener('change', () => {
  localStorage.setItem('voice', voiceBox.value);
});

// 初期処理
loadSettings();
updateVoices();
updatePreview();

// サービスワーカー登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
