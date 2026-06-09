const STORAGE_KEY = "elmoWordBank";
const DEFAULT_WORDS = [
  {
    word: "apple",
    translation: "蘋果",
    pos: "noun",
    example: "I eat an apple every day.",
    root: "apple = 蘋果，無特殊字根。",
  },
  {
    word: "create",
    translation: "創造",
    pos: "verb",
    example: "She wants to create a beautiful painting.",
    root: "create 來自拉丁文 creare，意為產生、創造。",
  },
];

const navStudy = document.getElementById("btn-study");
const navManage = document.getElementById("btn-manage");
const studyPage = document.getElementById("study-page");
const managePage = document.getElementById("manage-page");
const card = document.getElementById("word-card");
const cardFront = document.getElementById("card-front");
const cardBack = document.getElementById("card-back");
const prevButton = document.getElementById("prev-word");
const nextButton = document.getElementById("next-word");
const randomButton = document.getElementById("random-word");
const wordListEl = document.getElementById("word-list");
const form = document.getElementById("word-form");
const autoFillButton = document.getElementById("auto-fill");
const saveButton = document.getElementById("save-word");
const clearButton = document.getElementById("clear-form");
const autoFillStatus = document.getElementById("auto-fill-status");

const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

const wordInput = document.getElementById("word-input");
const translationInput = document.getElementById("translation-input");
const posInput = document.getElementById("pos-input");
const exampleInput = document.getElementById("example-input");
const rootInput = document.getElementById("root-input");

let words = [];
let activeIndex = 0;
let editingIndex = null;

function loadWords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      words = JSON.parse(stored);
    } catch (error) {
      words = [...DEFAULT_WORDS];
    }
  } else {
    words = [...DEFAULT_WORDS];
  }
}

function saveWords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

function renderCard() {
  if (!words.length) {
    cardFront.textContent = "請先新增單字";
    cardBack.innerHTML = "<p>管理頁新增單字後可在此查看。</p>";
    return;
  }

  const entry = words[activeIndex];
  cardFront.textContent = entry.word;
  cardBack.innerHTML = `
    <div class="card-block">
      <h3>中翻英</h3>
      <p>${entry.translation || "—"} → ${entry.word}</p>
    </div>
    <div class="card-block">
      <h3>例句</h3>
      <p>${entry.example || "暫無例句。"}</p>
    </div>
    <div class="card-row">
      <span>${entry.pos || "—"}</span>
    </div>
    <div class="card-block">
      <h3>字根分析</h3>
      <p>${entry.root || "暫無字根分析。"}</p>
    </div>
  `;
}

function renderWordList() {
  wordListEl.innerHTML = "";
  if (!words.length) {
    wordListEl.innerHTML = "<li class='word-list-item'>目前尚未有單字，請先新增。</li>";
    return;
  }

  words.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "word-list-item";
    item.innerHTML = `
      <span>${entry.word} · ${entry.translation || "未填翻譯"}</span>
      <div>
        <button type="button" data-index="${index}" class="jump-word">學習</button>
        <button type="button" data-index="${index}" class="edit-word">編輯</button>
        <button type="button" data-index="${index}" class="delete-word">刪除</button>
      </div>
    `;
    wordListEl.appendChild(item);
  });
}

function updateCurrentIndex(index) {
  if (!words.length) {
    activeIndex = 0;
    renderCard();
    return;
  }

  activeIndex = (index + words.length) % words.length;
  renderCard();
}

function switchPage(showStudy) {
  if (showStudy) {
    studyPage.classList.add("active-page");
    managePage.classList.remove("active-page");
    navStudy.classList.add("active");
    navManage.classList.remove("active");
  } else {
    studyPage.classList.remove("active-page");
    managePage.classList.add("active-page");
    navStudy.classList.remove("active");
    navManage.classList.add("active");
  }
}

function resetForm() {
  wordInput.value = "";
  translationInput.value = "";
  posInput.value = "";
  exampleInput.value = "";
  rootInput.value = "";
  editingIndex = null;
  saveButton.textContent = "儲存單字";
  autoFillStatus.textContent = "";
}

function fillForm(entry) {
  wordInput.value = entry.word;
  translationInput.value = entry.translation || "";
  posInput.value = entry.pos || "";
  exampleInput.value = entry.example || "";
  rootInput.value = entry.root || "";
  saveButton.textContent = "更新單字";
}

async function fetchDictionary(word) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("字典 API 無回應或找不到該單字。請手動輸入。");
  }
  return response.json();
}

async function fetchTranslation(word) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-TW`;
  const response = await fetch(url);
  if (!response.ok) {
    return "";
  }
  const data = await response.json();
  const translation = data.responseData?.translatedText || "";
  return translation === word ? "" : translation;
}

async function autoFill() {
  const word = wordInput.value.trim();
  if (!word) {
    autoFillStatus.textContent = "請先輸入英文單字再按自動填入。";
    return;
  }

  autoFillStatus.textContent = "正在呼叫 API，自動填入中...";
  autoFillButton.disabled = true;

  try {
    const [dictionary, translation] = await Promise.all([
      fetchDictionary(word),
      fetchTranslation(word),
    ]);

    const entry = dictionary?.[0] || {};
    const meaning = entry.meanings?.[0] || {};
    const definition = meaning.definitions?.[0] || {};

    translationInput.value = translation || translationInput.value;
    posInput.value = meaning.partOfSpeech || posInput.value;
    exampleInput.value = definition.example || exampleInput.value;
    rootInput.value = entry.origin || rootInput.value || "無可用字源資料。";

    autoFillStatus.textContent = "自動填入完成。請確認後儲存。";
  } catch (error) {
    autoFillStatus.textContent = error.message || "API 呼叫失敗，請稍後再試。";
  } finally {
    autoFillButton.disabled = false;
  }
}

async function sendToGoogleSheet(entry) {
  if (GAS_ENDPOINT_URL.includes("YOUR_SCRIPT_ID")) {
    console.warn("GAS_ENDPOINT_URL 尚未設定，跳過後端送出。請替換成您的 Apps Script 網址。\n");
    return;
  }

  const response = await fetch(GAS_ENDPOINT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`後端回應 ${response.status}: ${text}`);
  }

  await response.json().catch(() => null);
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const word = wordInput.value.trim();
  if (!word) {
    autoFillStatus.textContent = "英文單字不可為空。";
    return;
  }

  const entry = {
    word,
    translation: translationInput.value.trim(),
    pos: posInput.value.trim(),
    example: exampleInput.value.trim(),
    root: rootInput.value.trim(),
  };

  if (editingIndex !== null) {
    words[editingIndex] = entry;
    activeIndex = editingIndex;
  } else {
    words.push(entry);
    activeIndex = words.length - 1;
  }

  saveWords();

  try {
    await sendToGoogleSheet(entry);
    autoFillStatus.textContent = "已儲存單字並送出後端。";
  } catch (error) {
    console.error(error);
    autoFillStatus.textContent = `已儲存單字，但後端送出失敗：${error.message}`;
  }

  renderWordList();
  renderCard();
  resetForm();
}

function handleListClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const index = Number(button.dataset.index);
  if (button.classList.contains("jump-word")) {
    switchPage(true);
    updateCurrentIndex(index);
    if (card.classList.contains("flipped")) card.classList.remove("flipped");
    return;
  }

  if (button.classList.contains("edit-word")) {
    editingIndex = index;
    fillForm(words[index]);
    switchPage(false);
    return;
  }

  if (button.classList.contains("delete-word")) {
    words.splice(index, 1);
    if (activeIndex >= words.length) {
      activeIndex = Math.max(0, words.length - 1);
    }
    saveWords();
    renderWordList();
    renderCard();
    return;
  }
}

function handleCardClick() {
  card.classList.toggle("flipped");
}

function initEvents() {
  navStudy.addEventListener("click", () => switchPage(true));
  navManage.addEventListener("click", () => switchPage(false));
  prevButton.addEventListener("click", () => {
    updateCurrentIndex(activeIndex - 1);
    card.classList.remove("flipped");
  });
  nextButton.addEventListener("click", () => {
    updateCurrentIndex(activeIndex + 1);
    card.classList.remove("flipped");
  });
  randomButton.addEventListener("click", () => {
    if (!words.length) return;
    const index = Math.floor(Math.random() * words.length);
    updateCurrentIndex(index);
    card.classList.remove("flipped");
  });
  card.addEventListener("click", handleCardClick);
  form.addEventListener("submit", handleFormSubmit);
  autoFillButton.addEventListener("click", autoFill);
  clearButton.addEventListener("click", resetForm);
  wordListEl.addEventListener("click", handleListClick);
}

function init() {
  loadWords();
  renderWordList();
  renderCard();
  initEvents();
}

init();
