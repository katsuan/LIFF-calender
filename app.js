const storageKey = "liff-calendar-share:liff-id";

const dom = {
  liffIdInput: document.getElementById("liffIdInput"),
  initButton: document.getElementById("initButton"),
  logoutButton: document.getElementById("logoutButton"),
  liffState: document.getElementById("liffState"),
  statusBox: document.getElementById("statusBox"),
  timezoneLabel: document.getElementById("timezoneLabel"),
  form: document.getElementById("eventForm"),
  titleInput: document.getElementById("titleInput"),
  startInput: document.getElementById("startInput"),
  endInput: document.getElementById("endInput"),
  detailsInput: document.getElementById("detailsInput"),
  urlInput: document.getElementById("urlInput"),
  calendarUrlOutput: document.getElementById("calendarUrlOutput"),
  openCalendarButton: document.getElementById("openCalendarButton"),
  copyCalendarButton: document.getElementById("copyCalendarButton"),
  sendCurrentChatButton: document.getElementById("sendCurrentChatButton"),
  shareTargetButton: document.getElementById("shareTargetButton"),
  previewCard: document.getElementById("previewCard")
};

const state = {
  liffReady: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo"
};

function setStatus(message, tone = "default") {
  dom.statusBox.textContent = message;
  dom.statusBox.className = `status-box${tone === "default" ? "" : ` ${tone}`}`;
}

function setLiffBadge(label, ready = false) {
  dom.liffState.textContent = label;
  dom.liffState.classList.toggle("ready", ready);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFormData() {
  const title = dom.titleInput.value.trim();
  const start = dom.startInput.value;
  const end = dom.endInput.value;
  const details = dom.detailsInput.value.trim();
  const relatedUrl = dom.urlInput.value.trim();
  return { title, start, end, details, relatedUrl };
}

function toGoogleDateTime(localDateTime) {
  return `${localDateTime.replace(/[-:]/g, "")}00`;
}

function formatDateTime(localDateTime) {
  if (!localDateTime) {
    return "未設定";
  }

  const date = new Date(localDateTime);
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function isValidUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildDetails(details, relatedUrl) {
  const chunks = [];
  if (details) {
    chunks.push(details);
  }
  if (relatedUrl) {
    chunks.push(`関連URL: ${relatedUrl}`);
  }
  return chunks.join("\n\n");
}

function buildCalendarUrl(formData) {
  if (!formData.title || !formData.start || !formData.end) {
    return "";
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: formData.title,
    dates: `${toGoogleDateTime(formData.start)}/${toGoogleDateTime(formData.end)}`,
    details: buildDetails(formData.details, formData.relatedUrl),
    ctz: state.timezone
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildFlexMessage(formData, calendarUrl) {
  const detailsText = buildDetails(formData.details, formData.relatedUrl) || "詳細は未設定です。";
  const footerContents = [
    {
      type: "button",
      style: "primary",
      color: "#06C755",
      height: "sm",
      action: {
        type: "uri",
        label: "Googleカレンダーに追加",
        uri: calendarUrl
      }
    }
  ];

  if (formData.relatedUrl && isValidUrl(formData.relatedUrl)) {
    footerContents.push({
      type: "button",
      style: "link",
      height: "sm",
      action: {
        type: "uri",
        label: "関連URLを開く",
        uri: formData.relatedUrl
      }
    });
  }

  return {
    type: "flex",
    altText: `予定を共有: ${formData.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1DCD63",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "Google Calendar",
            color: "#EFFFF4",
            size: "xs",
            weight: "bold",
            letterSpacing: "0.12em"
          },
          {
            type: "text",
            text: "予定を追加",
            color: "#FFFFFF",
            size: "xl",
            weight: "bold",
            margin: "md"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: formData.title,
            wrap: true,
            weight: "bold",
            size: "lg",
            color: "#222222"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "開始",
                    color: "#7A7A7A",
                    size: "sm",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: formatDateTime(formData.start),
                    wrap: true,
                    color: "#1F1F1F",
                    size: "sm",
                    flex: 4
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "終了",
                    color: "#7A7A7A",
                    size: "sm",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: formatDateTime(formData.end),
                    wrap: true,
                    color: "#1F1F1F",
                    size: "sm",
                    flex: 4
                  }
                ]
              }
            ]
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "text",
            text: detailsText,
            wrap: true,
            color: "#4A4A4A",
            size: "sm",
            margin: "lg"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: footerContents
      }
    }
  };
}

function renderPreview(formData, calendarUrl) {
  const title = formData.title || "件名を入力してください";
  const details = buildDetails(formData.details, formData.relatedUrl) || "予定詳細はまだ入力されていません。";
  const relatedUrlMarkup =
    formData.relatedUrl && isValidUrl(formData.relatedUrl)
      ? `<a class="preview-action secondary" href="${escapeHtml(formData.relatedUrl)}" target="_blank" rel="noreferrer">関連URLを開く</a>`
      : "";

  dom.previewCard.innerHTML = `
    <div class="preview-top">
      <div>
        <span class="preview-label">Google Calendar</span>
        <h3 class="preview-title">${escapeHtml(title)}</h3>
      </div>
    </div>
    <div class="preview-blocks">
      <div class="preview-block">
        <div class="preview-key">Start</div>
        <div class="preview-value">${escapeHtml(formatDateTime(formData.start))}</div>
      </div>
      <div class="preview-block">
        <div class="preview-key">End</div>
        <div class="preview-value">${escapeHtml(formatDateTime(formData.end))}</div>
      </div>
      <div class="preview-block">
        <div class="preview-key">Details</div>
        <div class="preview-value">${escapeHtml(details)}</div>
      </div>
    </div>
    <div class="preview-actions">
      <a class="preview-action primary" href="${escapeHtml(calendarUrl || "#")}" target="_blank" rel="noreferrer">Googleカレンダーに追加</a>
      ${relatedUrlMarkup}
    </div>
  `;
}

function updateDerivedState() {
  const formData = getFormData();

  if (formData.start && formData.end && new Date(formData.start) >= new Date(formData.end)) {
    setStatus("終了日時は開始日時より後にしてください。", "error");
  } else if (formData.relatedUrl && !isValidUrl(formData.relatedUrl)) {
    setStatus("関連URLは http または https で始まるURLを入力してください。", "error");
  } else {
    setStatus("内容を確認したら、そのままGoogleカレンダーURLを開くか、Flex Messageとして送信できます。");
  }

  const calendarUrl = buildCalendarUrl(formData);
  dom.calendarUrlOutput.value = calendarUrl;
  renderPreview(formData, calendarUrl);

  const hasRequiredFields = Boolean(formData.title && formData.start && formData.end && calendarUrl);
  dom.openCalendarButton.disabled = !hasRequiredFields;
  dom.copyCalendarButton.disabled = !hasRequiredFields;
  dom.shareTargetButton.disabled = !hasRequiredFields || !state.liffReady;
  dom.sendCurrentChatButton.disabled = !hasRequiredFields || !state.liffReady || !window.liff?.isInClient();
}

async function initializeLiff() {
  const liffId = dom.liffIdInput.value.trim();
  if (!liffId) {
    setStatus("LIFF IDを入力してください。", "error");
    return;
  }

  try {
    await liff.init({ liffId });
    localStorage.setItem(storageKey, liffId);
    state.liffReady = true;
    setLiffBadge(liff.isLoggedIn() ? "初期化済み" : "初期化済み(未ログイン)", true);

    if (!liff.isLoggedIn()) {
      setStatus("LIFFは初期化されました。ログインが必要な場合はこのままLINEログインに進みます。");
      liff.login();
      return;
    }

    setStatus("LIFFの初期化が完了しました。現在のトーク送信または共有送信を利用できます。", "success");
  } catch (error) {
    state.liffReady = false;
    setLiffBadge("初期化失敗");
    setStatus(`LIFF初期化に失敗しました: ${error.message}`, "error");
  } finally {
    updateDerivedState();
  }
}

async function sendToCurrentChat() {
  const formData = getFormData();
  const calendarUrl = buildCalendarUrl(formData);
  const message = buildFlexMessage(formData, calendarUrl);

  try {
    await liff.sendMessages([message]);
    setStatus("Flex Messageを現在のトークに送信しました。", "success");
  } catch (error) {
    setStatus(`送信に失敗しました: ${error.message}`, "error");
  }
}

async function shareTarget() {
  const formData = getFormData();
  const calendarUrl = buildCalendarUrl(formData);
  const message = buildFlexMessage(formData, calendarUrl);

  try {
    const result = await liff.shareTargetPicker([message]);
    if (result) {
      setStatus("送信先の選択と共有が完了しました。", "success");
      return;
    }
    setStatus("共有はキャンセルされました。");
  } catch (error) {
    setStatus(`共有に失敗しました: ${error.message}`, "error");
  }
}

function copyCalendarUrl() {
  if (!dom.calendarUrlOutput.value) {
    return;
  }

  navigator.clipboard
    .writeText(dom.calendarUrlOutput.value)
    .then(() => setStatus("GoogleカレンダーURLをコピーしました。", "success"))
    .catch((error) => setStatus(`コピーに失敗しました: ${error.message}`, "error"));
}

function clearLiffSettings() {
  localStorage.removeItem(storageKey);
  dom.liffIdInput.value = "";
  state.liffReady = false;
  setLiffBadge("未初期化");
  setStatus("保存済みのLIFF IDを削除しました。");
  updateDerivedState();
}

function openCalendarUrl() {
  const calendarUrl = dom.calendarUrlOutput.value;
  if (!calendarUrl) {
    return;
  }
  window.open(calendarUrl, "_blank", "noopener,noreferrer");
}

function setDefaultDates() {
  const now = new Date();
  const rounded = new Date(now);
  rounded.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
  const end = new Date(rounded);
  end.setHours(end.getHours() + 1);

  const format = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  dom.startInput.value = format(rounded);
  dom.endInput.value = format(end);
}

function bindEvents() {
  dom.form.addEventListener("input", updateDerivedState);
  dom.initButton.addEventListener("click", initializeLiff);
  dom.logoutButton.addEventListener("click", clearLiffSettings);
  dom.openCalendarButton.addEventListener("click", openCalendarUrl);
  dom.copyCalendarButton.addEventListener("click", copyCalendarUrl);
  dom.sendCurrentChatButton.addEventListener("click", sendToCurrentChat);
  dom.shareTargetButton.addEventListener("click", shareTarget);
}

function bootstrap() {
  dom.timezoneLabel.textContent = state.timezone;
  dom.liffIdInput.value = localStorage.getItem(storageKey) || "";
  setDefaultDates();
  bindEvents();
  updateDerivedState();

  if (dom.liffIdInput.value) {
    initializeLiff();
  } else {
    setStatus("LIFF IDを設定すると、生成したGoogleカレンダーURLをFlex Messageで送信できます。");
  }
}

bootstrap();
