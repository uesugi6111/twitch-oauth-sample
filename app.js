'use strict';

const CLIENT_ID = 'b7zndpqll3izhipefm62wqtzdb5tzp';
const API_ENDPOINT = 'https://api.twitch.tv/helix/bits/leaderboard';

const translations = {
  en: {
    htmlLang: 'en',
    heading: 'Twitch Bits Leaderboard',
    subtitle: 'Not suspicious',
    connect: 'Connect with Twitch',
    apiNote:
      'For detailed API specifications, see <a href="https://dev.twitch.tv/docs/api/reference#get-bits-leaderboard" target="_blank" rel="noopener noreferrer">Twitch Docs: Get Bits Leaderboard</a>.',
    countLabel: 'Count',
    periodLabel: 'Period',
    startedAtLabel: 'Started At',
    userIdLabel: 'User ID',
    userIdTooltip: 'Enter a user ID to show bits from that user only.',
    fetchButton: 'Fetch Leaderboard',
    languageToggle: '日本語',
    tableRank: 'Rank',
    tableUserName: 'User Name',
    tableUserLogin: 'User Login',
    tableUserId: 'User ID',
    tableScore: 'Score',
    periodOptions: {
      day: 'Day',
      week: 'Week',
      month: 'Month',
      year: 'Year',
      all: 'All'
    },
    statusLoading: 'Loading leaderboard...',
    statusNoData: 'No leaderboard data returned for the current filters.',
    statusErrorPrefix: 'Error: ',
    statusRange: (count, start, end) => `Showing ${count} entries. Period: ${start} to ${end}`,
    dateRange: (start, end) => `Date range: ${start} - ${end}`,
    validationCount: 'Count must be between 1 and 100.',
    validationStartedAt: 'Started At must be a valid date.'
  },
  ja: {
    htmlLang: 'ja',
    heading: 'Twitchビッツリーダーボード',
    subtitle: '怪しくないです',
    connect: 'Twitchで接続',
    apiNote:
      '詳細なAPI仕様は <a href="https://dev.twitch.tv/docs/api/reference#get-bits-leaderboard" target="_blank" rel="noopener noreferrer">Twitch Docs: Get Bits Leaderboard</a> を参照してください。',
    countLabel: '件数',
    periodLabel: '期間',
    startedAtLabel: '開始日時',
    userIdLabel: 'ユーザーID',
    userIdTooltip: '特定のユーザーからのビッツのみを取得したい場合に入力してください。',
    fetchButton: 'リーダーボード取得',
    languageToggle: 'English',
    tableRank: '順位',
    tableUserName: 'ユーザー名',
    tableUserLogin: 'ユーザーログイン',
    tableUserId: 'ユーザーID',
    tableScore: 'スコア',
    periodOptions: {
      day: '日',
      week: '週',
      month: '月',
      year: '年',
      all: '全期間'
    },
    statusLoading: 'リーダーボードを読み込み中...',
    statusNoData: '現在の条件に一致するリーダーボードデータはありません。',
    statusErrorPrefix: 'エラー: ',
    statusRange: (count, start, end) => `${count} 件を表示中。対象期間: ${start} - ${end}`,
    dateRange: (start, end) => `期間: ${start} - ${end}`,
    validationCount: '件数は1から100の間で入力してください。',
    validationStartedAt: '開始日時には有効な日時を入力してください。'
  }
};

let currentLang = 'en';
const state = {
  status: 'idle',
  lastCount: 0,
  start: 'n/a',
  end: 'n/a',
  errorMessage: ''
};

const headingEl = document.getElementById('heading');
const subtitleEl = document.getElementById('subtitle');
const languageToggle = document.getElementById('languageToggle');
const authLink = document.getElementById('authLink');
const signedInSection = document.getElementById('signedIn');
const form = document.getElementById('leaderboardForm');
const statusEl = document.getElementById('status');
const dateRangeEl = document.getElementById('dateRange');
const resultsBody = document.getElementById('leaderboardResults');
const fetchButton = document.getElementById('fetchButton');
const userIdInput = document.getElementById('userId');
const countInput = document.getElementById('count');
const periodSelect = document.getElementById('period');
const startedAtInput = document.getElementById('startedAt');
const apiNoteEl = document.getElementById('apiNote');

const labelledElements = Array.from(document.querySelectorAll('[data-i18n]'));
const optionElements = Array.from(document.querySelectorAll('[data-i18n-option]'));

function updateStatus() {
  const strings = translations[currentLang];
  switch (state.status) {
    case 'loading':
      statusEl.textContent = strings.statusLoading;
      dateRangeEl.textContent = '';
      break;
    case 'noData':
      statusEl.textContent = strings.statusNoData;
      dateRangeEl.textContent = '';
      break;
    case 'success':
      statusEl.textContent = strings.statusRange(state.lastCount, state.start, state.end);
      dateRangeEl.textContent = strings.dateRange(state.start, state.end);
      break;
    case 'error':
      statusEl.textContent = strings.statusErrorPrefix + state.errorMessage;
      dateRangeEl.textContent = '';
      break;
    default:
      statusEl.textContent = '';
      dateRangeEl.textContent = '';
      break;
  }
}

function applyTranslations() {
  const strings = translations[currentLang];
  document.documentElement.lang = strings.htmlLang;
  headingEl.textContent = strings.heading;
  subtitleEl.textContent = strings.subtitle;
  authLink.textContent = strings.connect;
  languageToggle.textContent = strings.languageToggle;
  fetchButton.textContent = strings.fetchButton;
  userIdInput.title = strings.userIdTooltip;
  apiNoteEl.innerHTML = strings.apiNote;

  for (const element of labelledElements) {
    const key = element.dataset.i18n;
    if (key && strings[key]) {
      element.textContent = strings[key];
    }
  }

  for (const option of optionElements) {
    const key = option.dataset.i18nOption;
    if (key && strings.periodOptions[key]) {
      option.textContent = strings.periodOptions[key];
    }
  }

  updateStatus();
}

languageToggle.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'ja' : 'en';
  applyTranslations();
});

const fragmentParams = new URLSearchParams(globalThis.location.hash.slice(1));
const accessToken = fragmentParams.get('access_token');

if (accessToken) {
  authLink.hidden = true;
  signedInSection.hidden = false;
  globalThis.history.replaceState(null, '', `${globalThis.location.pathname}${globalThis.location.search}`);
}

applyTranslations();

const buildQuery = () => {
  const strings = translations[currentLang];
  const params = new URLSearchParams();
  const countValue = Number(countInput.value) || 0;
  const periodValue = periodSelect.value;
  const startedAtValue = startedAtInput.value;
  const userIdValue = userIdInput.value.trim();

  if (countValue < 1 || countValue > 100) {
    throw new RangeError(strings.validationCount);
  }

  params.set('count', String(countValue));
  params.set('period', periodValue);

  if (startedAtValue) {
    const startedAtDate = new Date(startedAtValue);
    if (Number.isNaN(startedAtDate.getTime())) {
      throw new TypeError(strings.validationStartedAt);
    }
    params.set('started_at', startedAtDate.toISOString());
  } else if (periodValue !== 'all') {
    params.set('started_at', new Date().toISOString());
  }

  if (userIdValue) {
    params.set('user_id', userIdValue);
  }

  return params.toString();
};

const formatCell = value => (value === undefined || value === null ? '' : value);

const renderRows = entries => {
  resultsBody.innerHTML = '';
  for (const entry of entries) {
    const row = document.createElement('tr');
    const { rank, user_name: userName, user_login: userLogin, user_id: userId, score } = entry || {};
    row.innerHTML = `
      <td>${formatCell(rank)}</td>
      <td>${formatCell(userName)}</td>
      <td>${formatCell(userLogin)}</td>
      <td>${formatCell(userId)}</td>
      <td>${formatCell(score)}</td>
    `;
    resultsBody.appendChild(row);
  }
};

const fetchLeaderboard = async event => {
  if (event) {
    event.preventDefault();
  }

  if (!accessToken) {
    return;
  }

  try {
    state.status = 'loading';
    state.errorMessage = '';
    updateStatus();

    const query = buildQuery();
    const response = await fetch(`${API_ENDPOINT}?${query}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': CLIENT_ID
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.message ?? `Request failed with ${response.status}`;
      throw new Error(message);
    }

    const payload = await response.json();
    const entries = payload?.data ?? [];

    if (!entries.length) {
      state.status = 'noData';
      state.lastCount = 0;
      resultsBody.innerHTML = '';
      updateStatus();
      return;
    }

    renderRows(entries);
    const dateRange = payload?.date_range ?? {};
    state.lastCount = entries.length;
    state.start = dateRange.started_at || 'n/a';
    state.end = dateRange.ended_at || 'n/a';
    state.status = 'success';
    updateStatus();
  } catch (error) {
    state.status = 'error';
    state.errorMessage = error instanceof Error ? error.message : String(error);
    resultsBody.innerHTML = '';
    updateStatus();
  }
};

if (accessToken) {
  form.addEventListener('submit', fetchLeaderboard);
  fetchLeaderboard();
}
