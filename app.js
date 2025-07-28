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

document.addEventListener('DOMContentLoaded', () => {
  for (let i = 0.5; i <= 4; i += 0.5) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + '倍';
    if (i == 1) opt.selected = true; // デフォルトは1倍速
    if (i == rate) opt.selected = true;
    rateBox.appendChild(opt);
  }
});

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
// 見出しかどうか判定
function isHeading(el) {
  return /^H[1-6]$/.test(el.tagName);
}

// 要素を読み上げ
function speakElement(el, callback) {
  const children = Array.from(el.childNodes);
  const base = parseFloat(volumeBar.value);

  const speakNodes = idx => {
    if (idx >= children.length) {
      callback();
      return;
    }
    const node = children[idx];
    let text = '';
    let vol = base;
    if (node.nodeType === Node.TEXT_NODE) {
      text = node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      text = node.textContent;
      if (['EM', 'STRONG'].includes(node.tagName)) {
        vol = Math.min(base * 1.2, 1);
      }
    }
    if (!text.trim()) {
      speakNodes(idx + 1);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.volume = vol;
    u.pitch = parseFloat(pitchBar.value);
    u.rate = parseFloat(rateBox.value);
    u.voice = voices[voiceBox.value];
    u.onend = () => speakNodes(idx + 1);
    speechSynthesis.speak(u);
  };

  speakNodes(0);
}

// 読み上げ実行
function speakCurrent() {
  if (current < 0) {
    return;
  }
  if (current >= paragraphs.length) {
    current = 0; // 範囲外なら最初に戻る
  }
  const el = paragraphs[current];
  if (!el.textContent.trim()) {
    current++;
    speakCurrent();
    return;
  }

  highlight(current);

  const after = () => {
    paragraphs[current].classList.remove('current');
    current++;
    if (current < paragraphs.length) {
      speakCurrent();
    }
  };

  const start = () => {
    speakElement(el, () => {
      if (isHeading(el)) {
        setTimeout(after, 250);
      } else {
        after();
      }
    });
  };

  if (isHeading(el)) {
    setTimeout(start, 250);
  } else {
    start();
  }
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

// 初期処理
updateVoices();
updatePreview();

// サービスワーカー登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
