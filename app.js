/**
 * ====================================================================
 * 체중 & 운동량 기록 트래커 (InBody & Workout Tracker)
 * ====================================================================
 */

// --- Default Configuration & Presets ---
const DEFAULT_PRESET_POOL = [
  {
    id: 'preset-1',
    name: '스텝퍼',
    details: '고강도 · 10분',
    duration: 10,
    calories: 100,
    category: 'cardio',
    type: 'cardio',
    intensity: 'vigorous'
  },
  {
    id: 'preset-2',
    name: '트레드밀',
    details: '경사 3, 속도 4 · 5분',
    duration: 5,
    calories: 35,
    category: 'cardio',
    type: 'cardio',
    intensity: 'moderate'
  },
  {
    id: 'preset-3',
    name: '스텝밀 (천국의 계단)',
    details: '레벨 8 · 10분',
    duration: 10,
    calories: 120,
    category: 'cardio',
    type: 'cardio',
    intensity: 'vigorous'
  },
  {
    id: 'preset-4',
    name: '고블릿 스쿼트',
    details: '5kg 덤벨 · 15회 × 3세트',
    duration: 8,
    calories: 55,
    category: 'strength',
    type: 'strength',
    weight: '5kg 덤벨',
    reps: '15회',
    sets: 3
  },
  {
    id: 'preset-5',
    name: '힙 어브덕션',
    details: '20kg · 15회 × 3세트',
    duration: 8,
    calories: 45,
    category: 'strength',
    type: 'strength',
    weight: '20kg',
    reps: '15회',
    sets: 3
  },
  {
    id: 'preset-6',
    name: '매달리기',
    details: '10초 버티기 × 3회',
    duration: 5,
    calories: 15,
    category: 'bodyweight',
    type: 'strength',
    weight: '맨몸',
    reps: '10초',
    sets: 3
  },
  {
    id: 'preset-7',
    name: '줌바 댄스',
    details: '고강도 · 50분',
    duration: 50,
    calories: 420,
    category: 'dance',
    type: 'cardio',
    intensity: 'vigorous'
  }
];

const DEFAULT_PROFILE = {
  gender: 'female',
  age: 28,
  height: 163.0,
  weight: 56.5,
  muscleMass: 22.0,
  bodyFatPercent: 27.5,
  bmr: 1260,
  targetWeight: 52.0,
  targetBodyFatPercent: 21.0
};

// Storage Keys
const STORAGE_KEYS = {
  PROFILE: 'fitness_tracker_profile',
  POOL: 'fitness_tracker_pool',
  LOGS: 'fitness_tracker_daily_logs'
};

// State Object
let state = {
  currentDate: getTodayString(),
  activeTab: 'cardio', // 'cardio' or 'strength'
  profile: null,
  pool: [],
  dailyLogs: {} // { 'YYYY-MM-DD': { weight, bodyFat, exercises: [...] } }
};

// Chart Instances
let weightChartInstance = null;
let calorieDonutInstance = null;

// --- Helper Functions ---
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 (${weekDays[d.getDay()]})`;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center space-x-2 text-white transition pointer-events-auto ${
    type === 'success'
      ? 'bg-slate-900 border-slate-700'
      : type === 'amber'
      ? 'bg-amber-600 border-amber-500'
      : 'bg-rose-600 border-rose-500'
  }`;

  const iconSvg = type === 'success'
    ? '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
    : '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

// --- Data Persistence ---
function loadData() {
  // 1. Profile
  const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
  state.profile = storedProfile ? JSON.parse(storedProfile) : { ...DEFAULT_PROFILE };

  // 2. Exercise Pool
  const storedPool = localStorage.getItem(STORAGE_KEYS.POOL);
  state.pool = storedPool ? JSON.parse(storedPool) : [...DEFAULT_PRESET_POOL];

  // 3. Daily Logs
  const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (storedLogs) {
    state.dailyLogs = JSON.parse(storedLogs);
  } else {
    // Initial sample seed for rich experience
    const today = getTodayString();
    state.dailyLogs = {};
    seedSampleData(state.dailyLogs, state.profile);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
  localStorage.setItem(STORAGE_KEYS.POOL, JSON.stringify(state.pool));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.dailyLogs));
}

// Generate realistic past 7 days trend if new
function seedSampleData(logs, profile) {
  const today = new Date();
  const baseWeight = profile.weight || 56.5;
  const baseFat = profile.bodyFatPercent || 27.5;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const weightVariation = (baseWeight + (i * 0.15) - 0.2).toFixed(1);
    const fatVariation = (baseFat + (i * 0.12) - 0.1).toFixed(1);

    logs[dateStr] = {
      weight: parseFloat(weightVariation),
      bodyFat: parseFloat(fatVariation),
      exercises: []
    };

    // Add some realistic workouts for previous days
    if (i === 1) {
      logs[dateStr].exercises.push(
        {
          id: 'sample-1',
          name: '트레드밀',
          details: '경사 3, 속도 4 · 5분',
          duration: 5,
          calories: 35,
          type: 'cardio',
          timeStr: '오전 08:30'
        },
        {
          id: 'sample-2',
          name: '스텝밀 (천국의 계단)',
          details: '레벨 8 · 10분',
          duration: 10,
          calories: 120,
          type: 'cardio',
          timeStr: '오전 08:40'
        }
      );
    } else if (i === 3) {
      logs[dateStr].exercises.push(
        {
          id: 'sample-3',
          name: '줌바 댄스',
          details: '고강도 · 50분',
          duration: 50,
          calories: 420,
          type: 'cardio',
          timeStr: '오후 07:10'
        }
      );
    }
  }

  // Ensure today's entry has default weight
  const todayStr = getTodayString();
  if (!logs[todayStr]) {
    logs[todayStr] = {
      weight: baseWeight,
      bodyFat: baseFat,
      exercises: []
    };
  }
}

// --- Scientific Calculation Models ---

/**
 * BMR Calculation:
 * 1. Katch-McArdle Formula (if body fat % available):
 *    LBM = weight * (1 - bodyFat / 100)
 *    BMR = 370 + (21.6 * LBM)
 * 2. Mifflin-St Jeor:
 *    Men: 10 * weight + 6.25 * height - 5 * age + 5
 *    Women: 10 * weight + 6.25 * height - 5 * age - 161
 */
function calculateScientificBmr(profile) {
  const { gender, age, height, weight, bodyFatPercent } = profile;
  if (!weight || !height || !age) return 1300;

  if (bodyFatPercent && bodyFatPercent > 5) {
    const lbm = weight * (1 - bodyFatPercent / 100);
    return Math.round(370 + (21.6 * lbm));
  } else {
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return Math.round(gender === 'male' ? base + 5 : base - 161);
  }
}

/**
 * Exercise Calorie Estimator
 * Using METs formula: Calories = MET * 3.5 * weightKg / 200 * minutes
 */
function estimateExerciseCalories({ name, type, duration, intensity, weightKg, sets, reps, loadWeight }) {
  const currentWeight = weightKg || state.profile.weight || 60;
  
  if (type === 'cardio') {
    let baseMet = 6.0;
    const lowerName = (name || '').toLowerCase();

    if (lowerName.includes('스텝밀') || lowerName.includes('천국의') || lowerName.includes('계단')) {
      baseMet = 9.0;
    } else if (lowerName.includes('스텝퍼')) {
      baseMet = 7.5;
    } else if (lowerName.includes('트레드밀') || lowerName.includes('러닝') || lowerName.includes('달리기')) {
      baseMet = 7.0;
    } else if (lowerName.includes('줌바') || lowerName.includes('댄스')) {
      baseMet = 7.5;
    } else if (lowerName.includes('사이클') || lowerName.includes('자전거') || lowerName.includes('스피닝')) {
      baseMet = 8.0;
    } else if (lowerName.includes('줄넘기')) {
      baseMet = 10.0;
    } else if (lowerName.includes('수영')) {
      baseMet = 8.0;
    } else if (lowerName.includes('걷기') || lowerName.includes('산책')) {
      baseMet = 3.5;
    }

    // Intensity adjustment
    let intensityMultiplier = 1.0;
    if (intensity === 'light') intensityMultiplier = 0.75;
    else if (intensity === 'moderate') intensityMultiplier = 1.0;
    else if (intensity === 'vigorous') intensityMultiplier = 1.25;
    else if (intensity === 'extreme') intensityMultiplier = 1.5;

    const effectiveMet = baseMet * intensityMultiplier;
    const mins = Math.max(1, Number(duration) || 10);
    const kcal = (effectiveMet * 3.5 * currentWeight / 200) * mins;
    return Math.round(kcal);
  } else {
    // Strength / Sets mode
    // Based on total minutes and compound movement factor
    const mins = Math.max(1, Number(duration) || 10);
    let met = 5.0; // standard moderate weight training MET

    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('스쿼트') || lowerName.includes('데드리프트') || lowerName.includes('런지')) {
      met = 6.0; // large muscle group
    } else if (lowerName.includes('매달리기') || lowerName.includes('플랭크')) {
      met = 4.5;
    } else if (lowerName.includes('어브덕션') || lowerName.includes('컬') || lowerName.includes('익스텐션')) {
      met = 4.8;
    }

    const kcal = (met * 3.5 * currentWeight / 200) * mins;
    return Math.max(10, Math.round(kcal));
  }
}

// --- DOM Rendering & Controller Functions ---

function getTodayEntry(dateStr = state.currentDate) {
  if (!state.dailyLogs[dateStr]) {
    state.dailyLogs[dateStr] = {
      weight: state.profile.weight || 60,
      bodyFat: state.profile.bodyFatPercent || 25,
      exercises: []
    };
  }
  return state.dailyLogs[dateStr];
}

function updateKpiAndSummary() {
  const dayEntry = getTodayEntry(state.currentDate);
  const bmr = Number(state.profile.bmr) || 1300;
  
  // Sum exercise calories
  const exerciseList = dayEntry.exercises || [];
  const exerciseCalories = exerciseList.reduce((acc, cur) => acc + (Number(cur.calories) || 0), 0);
  const exerciseMinutes = exerciseList.reduce((acc, cur) => acc + (Number(cur.duration) || 0), 0);

  // Total daily burned calories = BMR + Exercise Burn
  const totalBurned = bmr + exerciseCalories;

  // 1. Total Burned KPI
  const totalBurnedEl = document.getElementById('totalBurnedCalories');
  animateNumber(totalBurnedEl, totalBurned);
  document.getElementById('kpiBmrText').textContent = bmr.toLocaleString();
  document.getElementById('kpiExerciseBurnText').textContent = exerciseCalories.toLocaleString();

  // 2. BMR KPI
  document.getElementById('bmrDisplay').textContent = bmr.toLocaleString();

  // 3. Exercise Burn KPI
  animateNumber(document.getElementById('todayExerciseCalories'), exerciseCalories);
  document.getElementById('todayExerciseCount').textContent = exerciseList.length;
  document.getElementById('todayExerciseDuration').textContent = `총 ${exerciseMinutes}분`;

  // 4. Weight KPI
  const currentRecordedWeight = dayEntry.weight || state.profile.weight;
  document.getElementById('kpiCurrentWeight').textContent = currentRecordedWeight ? currentRecordedWeight.toFixed(1) : '-';
  const targetWeight = state.profile.targetWeight;
  document.getElementById('kpiTargetWeight').textContent = targetWeight ? targetWeight.toFixed(1) : '-';

  const diffLabel = document.getElementById('weightDiffLabel');
  if (currentRecordedWeight && targetWeight) {
    const diff = (currentRecordedWeight - targetWeight).toFixed(1);
    if (diff > 0) {
      diffLabel.textContent = `목표까지 -${diff} kg 남음`;
      diffLabel.className = 'text-purple-600 font-semibold';
    } else if (diff < 0) {
      diffLabel.textContent = `목표 체중 달성 (+${Math.abs(diff)}kg)`;
      diffLabel.className = 'text-emerald-600 font-semibold';
    } else {
      diffLabel.textContent = `🎉 목표 체중 정확히 달성!`;
      diffLabel.className = 'text-emerald-600 font-bold';
    }
  }

  // Update InBody summary displays
  document.getElementById('profileWeightDisplay').textContent = `${(state.profile.weight || 0).toFixed(1)} kg`;
  document.getElementById('profileMuscleDisplay').textContent = `${(state.profile.muscleMass || 0).toFixed(1)} kg`;
  document.getElementById('profileFatDisplay').textContent = `${(state.profile.bodyFatPercent || 0).toFixed(1)}%`;
  document.getElementById('profileBmrDisplay').textContent = `${bmr.toLocaleString()} kcal`;
  document.getElementById('targetWeightDisplay').textContent = `${(state.profile.targetWeight || 0).toFixed(1)} kg`;
  document.getElementById('targetFatDisplay').textContent = `${(state.profile.targetBodyFatPercent || 0).toFixed(1)}%`;

  // Goal Advice Box
  updateGoalAdviceText();

  // Donut Chart updates
  updateDonutChart(bmr, exerciseCalories);

  // Today workout list header
  const isToday = state.currentDate === getTodayString();
  document.getElementById('selectedDateWorkoutTitle').textContent = isToday
    ? '오늘의 운동 기록'
    : `${formatDateDisplay(state.currentDate)} 운동 기록`;
  document.getElementById('workoutListSummaryBadge').textContent = `${exerciseList.length}개 완료 (${exerciseCalories} kcal)`;
}

function updateGoalAdviceText() {
  const p = state.profile;
  const adviceEl = document.getElementById('goalAdviceText');
  if (!p || !p.weight || !p.targetWeight) return;

  const currentFatMass = (p.weight * ((p.bodyFatPercent || 25) / 100));
  const targetFatMass = (p.targetWeight * ((p.targetBodyFatPercent || 20) / 100));
  const fatDiff = (currentFatMass - targetFatMass).toFixed(1);
  const weightDiff = (p.weight - p.targetWeight).toFixed(1);

  if (weightDiff > 0) {
    const weeksNeeded = Math.ceil(weightDiff / 0.5);
    adviceEl.innerHTML = `
      현재 체중에서 <strong>${weightDiff}kg</strong> 감량 목표입니다.
      순수 체지방은 약 <strong>${fatDiff > 0 ? fatDiff : 0}kg</strong> 감량이 필요합니다.<br/>
      💡 건강한 감량 속도(주 0.5kg) 기준 예상 기간은 약 <strong>${weeksNeeded}주</strong>이며,
      하루 약 <strong>400~500 kcal</strong>의 식단/운동 결손(Deficit)을 추천합니다.
    `;
  } else if (weightDiff < 0) {
    adviceEl.innerHTML = `
      현재 체중에서 <strong>${Math.abs(weightDiff)}kg</strong> 증량(벌크업/린매스업) 목표입니다.
      골격근량 증가를 위해 기초대사량 + 운동소모량 대비 <strong>+250~350 kcal</strong>의 충분한 영양 섭취를 추천합니다.
    `;
  } else {
    adviceEl.innerHTML = `
      현재 목표 체중에 도달해 있습니다! 현재 근육량과 체지방률을 유지하는 린매스 관리(유지 칼로리 섭취)를 추천합니다.
    `;
  }
}

function animateNumber(element, target) {
  if (!element) return;
  const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
  if (current === target) {
    element.textContent = target.toLocaleString();
    return;
  }

  const duration = 400;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuad = progress * (2 - progress);
    const val = Math.round(current + (target - current) * easeOutQuad);
    element.textContent = val.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

// --- Render Quick Exercise Pool ---
function renderExercisePool() {
  const container = document.getElementById('exercisePoolList');
  if (!container) return;

  if (state.pool.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs">
        등록된 운동이 없습니다. '+ 새 운동 등록'으로 자주 하는 운동을 추가해보세요!
      </div>
    `;
    return;
  }

  container.innerHTML = state.pool.map((item, index) => {
    const isStrength = item.category === 'strength' || item.type === 'strength';
    const badgeColor = isStrength ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700';
    const categoryLabel = item.category === 'strength' ? '근력' : item.category === 'dance' ? '댄스' : item.category === 'bodyweight' ? '맨몸' : '유산소';

    return `
      <div class="pool-card p-3 rounded-xl border border-slate-200/90 bg-white hover:border-amber-300 flex items-center justify-between gap-3 shadow-2xs group">
        <div class="flex items-center space-x-3 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
            ${isStrength ? '🏋️' : item.category === 'dance' ? '💃' : '🏃'}
          </div>
          <div class="min-w-0">
            <div class="flex items-center space-x-1.5">
              <h4 class="font-bold text-xs sm:text-sm text-slate-800 truncate">${item.name}</h4>
              <span class="text-[10px] px-1.5 py-0.2 rounded font-semibold ${badgeColor}">${categoryLabel}</span>
            </div>
            <p class="text-xs text-slate-500 truncate mt-0.5">${item.details}</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <span class="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
            ${item.calories} <span class="text-[10px] font-normal text-rose-400">kcal</span>
          </span>
          <button 
            type="button" 
            onclick="addPoolItemToToday('${item.id}')"
            class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1 shadow-xs"
            title="오늘의 운동에 바로 추가"
          >
            <svg class="w-3.5 h-3.5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            <span class="hidden sm:inline">오늘 추가</span>
            <span class="sm:hidden">추가</span>
          </button>
          <button 
            type="button" 
            onclick="deletePoolItem('${item.id}')"
            class="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition"
            title="Pool에서 삭제"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Add item from pool to today's list
window.addPoolItemToToday = function(poolId) {
  const item = state.pool.find(p => p.id === poolId);
  if (!item) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const dayEntry = getTodayEntry(state.currentDate);
  const newWorkout = {
    id: 'workout-' + Date.now(),
    name: item.name,
    details: item.details,
    duration: item.duration || 10,
    calories: item.calories,
    category: item.category,
    type: item.type,
    timeStr: timeStr
  };

  dayEntry.exercises.unshift(newWorkout);
  saveData();
  renderTodayWorkoutList();
  updateKpiAndSummary();
  updateWeightTrendChart();
  showToast(`'${item.name}' (+${item.calories} kcal) 추가 완료!`);
};

window.deletePoolItem = function(poolId) {
  const target = state.pool.find(p => p.id === poolId);
  if (!target) return;
  if (!confirm(`'${target.name}' 운동을 Pool에서 삭제하시겠습니까?`)) return;

  state.pool = state.pool.filter(p => p.id !== poolId);
  saveData();
  renderExercisePool();
  showToast(`Pool에서 삭제되었습니다.`, 'amber');
};

// --- Render Today's Workout Timeline ---
function renderTodayWorkoutList() {
  const container = document.getElementById('todayWorkoutList');
  if (!container) return;

  const dayEntry = getTodayEntry(state.currentDate);
  const list = dayEntry.exercises || [];

  if (list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
        <p class="text-xs text-slate-400 font-medium">아직 등록된 운동이 없습니다.</p>
        <p class="text-[11px] text-slate-400 mt-1">위의 운동 입력창 또는 왼쪽의 '자주 쓰는 운동 Pool'에서 운동을 추가해보세요!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((item) => {
    const isStrength = item.type === 'strength';
    return `
      <div class="workout-item p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 flex items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center space-x-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base shrink-0">
            ${isStrength ? '🏋️' : '🏃'}
          </div>
          <div class="min-w-0">
            <div class="flex items-center space-x-2">
              <h4 class="font-bold text-sm text-slate-900 truncate">${item.name}</h4>
              <span class="text-[10px] text-slate-400">${item.timeStr || ''}</span>
            </div>
            <p class="text-xs text-slate-500 truncate mt-0.5">${item.details}</p>
          </div>
        </div>

        <div class="flex items-center space-x-3 shrink-0">
          <div class="text-right">
            <span class="text-sm font-black text-rose-600 block">
              +${item.calories} <span class="text-[10px] font-normal text-slate-500">kcal</span>
            </span>
            <span class="text-[11px] text-slate-400">${item.duration || 0}분</span>
          </div>
          <button 
            type="button" 
            onclick="deleteWorkoutItem('${item.id}')"
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="운동 삭제"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.deleteWorkoutItem = function(workoutId) {
  const dayEntry = getTodayEntry(state.currentDate);
  dayEntry.exercises = dayEntry.exercises.filter(w => w.id !== workoutId);
  saveData();
  renderTodayWorkoutList();
  updateKpiAndSummary();
  updateWeightTrendChart();
  showToast('운동 기록이 삭제되었습니다.', 'amber');
};

// --- Form Calculations & Auto Updates ---
function recalculateFormCalorie() {
  const name = document.getElementById('exerciseName').value.trim();
  const overrideCheck = document.getElementById('overrideCalorieCheck');
  const manualInput = document.getElementById('manualCalorieInput');
  const previewEl = document.getElementById('calculatedCaloriePreview');
  const autoBadge = document.getElementById('autoCalcBadge');

  if (overrideCheck.checked) {
    autoBadge.textContent = '직접 입력';
    autoBadge.className = 'text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded ml-2';
    const manualVal = Number(manualInput.value) || 0;
    previewEl.textContent = manualVal;
    return manualVal;
  }

  autoBadge.textContent = '자동 계산';
  autoBadge.className = 'text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded ml-2';

  let cal = 0;
  if (state.activeTab === 'cardio') {
    const duration = Number(document.getElementById('cardioDuration').value) || 0;
    const intensityRadio = document.querySelector('input[name="intensity"]:checked');
    const intensity = intensityRadio ? intensityRadio.value : 'moderate';

    cal = estimateExerciseCalories({
      name,
      type: 'cardio',
      duration,
      intensity,
      weightKg: state.profile.weight
    });
  } else {
    // Strength mode
    const sets = Number(document.getElementById('strengthSets').value) || 3;
    const duration = Number(document.getElementById('strengthTotalMinutes').value) || (sets * 2.5);

    cal = estimateExerciseCalories({
      name,
      type: 'strength',
      duration,
      sets,
      weightKg: state.profile.weight
    });
  }

  previewEl.textContent = cal;
  manualInput.value = cal;
  return cal;
}

// --- Chart.js Initializations & Updates ---

function initCharts() {
  // 1. Calorie Donut Chart
  const donutCtx = document.getElementById('calorieDonutChart').getContext('2d');
  calorieDonutInstance = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['기초대사량 (BMR)', '운동 소모 칼로리'],
      datasets: [{
        data: [1260, 0],
        backgroundColor: ['#3b82f6', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '76%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.raw} kcal`;
            }
          }
        }
      }
    }
  });

  // 2. Weight Trend Chart
  const trendCtx = document.getElementById('weightTrendChart').getContext('2d');
  weightChartInstance = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: '체중 (kg)',
          data: [],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          label: '목표 체중',
          data: [],
          borderColor: '#a855f7',
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: '체지방률 (%)',
          data: [],
          borderColor: '#ec4899',
          borderWidth: 2,
          pointBackgroundColor: '#ec4899',
          pointRadius: 3,
          fill: false,
          tension: 0.35,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { size: 11, family: 'Pretendard' }
          }
        },
        tooltip: {
          padding: 10,
          bodyFont: { family: 'Pretendard' }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10, family: 'Pretendard' } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '체중 (kg)',
            font: { size: 10, family: 'Pretendard' }
          },
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 10, family: 'Pretendard' } }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '체지방률 (%)',
            font: { size: 10, family: 'Pretendard' }
          },
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 10, family: 'Pretendard' } }
        }
      }
    }
  });

  updateWeightTrendChart();
}

function updateDonutChart(bmr, exerciseBurn) {
  if (!calorieDonutInstance) return;
  const total = bmr + exerciseBurn;
  calorieDonutInstance.data.datasets[0].data = [bmr, exerciseBurn];
  calorieDonutInstance.update();

  document.getElementById('donutCenterCalories').textContent = total.toLocaleString();
  const bmrPct = total > 0 ? Math.round((bmr / total) * 100) : 100;
  const exPct = total > 0 ? Math.round((exerciseBurn / total) * 100) : 0;
  document.getElementById('donutBmrPercent').textContent = bmrPct;
  document.getElementById('donutExercisePercent').textContent = exPct;
}

function updateWeightTrendChart() {
  if (!weightChartInstance) return;

  const dates = Object.keys(state.dailyLogs).sort();
  document.getElementById('trendLogCount').textContent = dates.length;

  const labels = dates.map(d => {
    const parts = d.split('-');
    return `${parts[1]}/${parts[2]}`;
  });

  const targetWeight = state.profile.targetWeight || 52;
  const weights = dates.map(d => state.dailyLogs[d].weight || null);
  const targetLine = dates.map(() => targetWeight);
  const fatPcts = dates.map(d => state.dailyLogs[d].bodyFat || null);

  weightChartInstance.data.labels = labels;
  weightChartInstance.data.datasets[0].data = weights;
  weightChartInstance.data.datasets[1].data = targetLine;
  weightChartInstance.data.datasets[2].data = fatPcts;
  weightChartInstance.update();
}

// --- Event Handlers & Initializers ---

function setupEventListeners() {
  // 1. Date Navigation
  const dateInput = document.getElementById('currentDateInput');
  dateInput.value = state.currentDate;

  dateInput.addEventListener('change', (e) => {
    state.currentDate = e.target.value;
    updateKpiAndSummary();
    renderTodayWorkoutList();
  });

  document.getElementById('todayBtn').addEventListener('click', () => {
    state.currentDate = getTodayString();
    dateInput.value = state.currentDate;
    updateKpiAndSummary();
    renderTodayWorkoutList();
  });

  document.getElementById('prevDateBtn').addEventListener('click', () => {
    const d = new Date(state.currentDate);
    d.setDate(d.getDate() - 1);
    state.currentDate = d.toISOString().split('T')[0];
    dateInput.value = state.currentDate;
    updateKpiAndSummary();
    renderTodayWorkoutList();
  });

  document.getElementById('nextDateBtn').addEventListener('click', () => {
    const d = new Date(state.currentDate);
    d.setDate(d.getDate() + 1);
    state.currentDate = d.toISOString().split('T')[0];
    dateInput.value = state.currentDate;
    updateKpiAndSummary();
    renderTodayWorkoutList();
  });

  // 2. Tab switching (Cardio vs Strength)
  const tabCardioBtn = document.getElementById('tabCardioBtn');
  const tabStrengthBtn = document.getElementById('tabStrengthBtn');
  const cardioFields = document.getElementById('cardioFieldsContainer');
  const strengthFields = document.getElementById('strengthFieldsContainer');

  tabCardioBtn.addEventListener('click', () => {
    state.activeTab = 'cardio';
    tabCardioBtn.className = 'px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-xs transition';
    tabStrengthBtn.className = 'px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition';
    cardioFields.classList.remove('hidden');
    strengthFields.classList.add('hidden');
    recalculateFormCalorie();
  });

  tabStrengthBtn.addEventListener('click', () => {
    state.activeTab = 'strength';
    tabStrengthBtn.className = 'px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-xs transition';
    tabCardioBtn.className = 'px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition';
    strengthFields.classList.remove('hidden');
    cardioFields.classList.add('hidden');
    recalculateFormCalorie();
  });

  // 3. Quick name recommendation buttons
  document.querySelectorAll('.quick-name-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('exerciseName').value = btn.dataset.name;
      recalculateFormCalorie();
    });
  });

  // 4. Input change listeners for real-time calculation
  ['exerciseName', 'cardioDetails', 'cardioDuration', 'strengthWeight', 'strengthReps', 'strengthSets', 'strengthTotalMinutes']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', recalculateFormCalorie);
    });

  document.querySelectorAll('input[name="intensity"]').forEach(radio => {
    radio.addEventListener('change', recalculateFormCalorie);
  });

  // 5. Manual override calorie toggle
  const overrideCheck = document.getElementById('overrideCalorieCheck');
  const manualInput = document.getElementById('manualCalorieInput');
  overrideCheck.addEventListener('change', () => {
    manualInput.disabled = !overrideCheck.checked;
    if (overrideCheck.checked) manualInput.focus();
    recalculateFormCalorie();
  });
  manualInput.addEventListener('input', recalculateFormCalorie);

  // 6. Workout Form Submission
  const addExerciseForm = document.getElementById('addExerciseForm');
  addExerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('exerciseName').value.trim();
    if (!name) return;

    const calories = recalculateFormCalorie();
    const saveToPool = document.getElementById('saveToPoolCheck').checked;

    let details = '';
    let duration = 0;

    if (state.activeTab === 'cardio') {
      const cardioDetails = document.getElementById('cardioDetails').value.trim();
      const cardioMins = Number(document.getElementById('cardioDuration').value) || 10;
      duration = cardioMins;
      const intensity = document.querySelector('input[name="intensity"]:checked')?.value || 'moderate';
      const intensityLabel = intensity === 'light' ? '저강도' : intensity === 'vigorous' ? '고강도' : intensity === 'extreme' ? '초고강도' : '중강도';
      details = `${cardioDetails ? cardioDetails + ' · ' : ''}${intensityLabel} · ${cardioMins}분`;
    } else {
      const weight = document.getElementById('strengthWeight').value.trim() || '맨몸';
      const reps = document.getElementById('strengthReps').value.trim() || '15회';
      const sets = document.getElementById('strengthSets').value || 3;
      const totalMins = Number(document.getElementById('strengthTotalMinutes').value) || 10;
      duration = totalMins;
      details = `${weight} · ${reps} × ${sets}세트`;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newWorkout = {
      id: 'workout-' + Date.now(),
      name,
      details,
      duration,
      calories,
      type: state.activeTab,
      timeStr
    };

    const dayEntry = getTodayEntry(state.currentDate);
    dayEntry.exercises.unshift(newWorkout);

    // Save to pool if checked
    if (saveToPool) {
      const poolItem = {
        id: 'pool-' + Date.now(),
        name,
        details,
        duration,
        calories,
        category: state.activeTab === 'cardio' ? 'cardio' : 'strength',
        type: state.activeTab
      };
      state.pool.unshift(poolItem);
      renderExercisePool();
    }

    saveData();
    renderTodayWorkoutList();
    updateKpiAndSummary();
    updateWeightTrendChart();

    showToast(`'${name}' (${calories} kcal) 기록 추가 완료!`);

    // Reset some form fields
    document.getElementById('exerciseName').value = '';
    document.getElementById('cardioDetails').value = '';
    document.getElementById('saveToPoolCheck').checked = false;
    overrideCheck.checked = false;
    manualInput.disabled = true;
    recalculateFormCalorie();
  });

  // 7. InBody Modal Controls
  const inbodyModal = document.getElementById('inbodyModal');
  const openInbody = () => {
    const p = state.profile;
    document.getElementById('modalGender').value = p.gender || 'female';
    document.getElementById('modalAge').value = p.age || 28;
    document.getElementById('modalHeight').value = p.height || 163;
    document.getElementById('modalWeight').value = p.weight || 56.5;
    document.getElementById('modalMuscle').value = p.muscleMass || 22.0;
    document.getElementById('modalFat').value = p.bodyFatPercent || 27.5;
    document.getElementById('modalBmr').value = p.bmr || 1260;
    document.getElementById('modalTargetWeight').value = p.targetWeight || 52.0;
    document.getElementById('modalTargetFat').value = p.targetBodyFatPercent || 21.0;
    updateModalGoalDiff();
    inbodyModal.classList.remove('hidden');
  };

  document.getElementById('openProfileBtn').addEventListener('click', openInbody);
  document.getElementById('editInbodyBtn').addEventListener('click', openInbody);
  document.getElementById('quickEditBmrBtn').addEventListener('click', openInbody);
  document.getElementById('closeInbodyModalBtn').addEventListener('click', () => inbodyModal.classList.add('hidden'));
  document.getElementById('cancelInbodyModalBtn').addEventListener('click', () => inbodyModal.classList.add('hidden'));

  // Auto BMR Calculation button in modal
  document.getElementById('calcBmrAutoBtn').addEventListener('click', () => {
    const tempProfile = {
      gender: document.getElementById('modalGender').value,
      age: Number(document.getElementById('modalAge').value),
      height: Number(document.getElementById('modalHeight').value),
      weight: Number(document.getElementById('modalWeight').value),
      bodyFatPercent: Number(document.getElementById('modalFat').value)
    };
    const calculated = calculateScientificBmr(tempProfile);
    document.getElementById('modalBmr').value = calculated;
    showToast(`공식 기반 기초대사량 ${calculated} kcal 계산됨!`);
  });

  // Modal goal preview
  function updateModalGoalDiff() {
    const curW = Number(document.getElementById('modalWeight').value) || 0;
    const tgtW = Number(document.getElementById('modalTargetWeight').value) || 0;
    const curFat = Number(document.getElementById('modalFat').value) || 0;
    const tgtFat = Number(document.getElementById('modalTargetFat').value) || 0;

    const wDiff = (tgtW - curW).toFixed(1);
    document.getElementById('modalCalcWeightDiff').textContent = `${wDiff > 0 ? '+' + wDiff : wDiff} kg`;

    const curFatKg = curW * (curFat / 100);
    const tgtFatKg = tgtW * (tgtFat / 100);
    const fatDiff = (tgtFatKg - curFatKg).toFixed(1);
    document.getElementById('modalCalcFatDiff').textContent = `${fatDiff > 0 ? '+' + fatDiff : fatDiff} kg`;

    const weeks = Math.ceil(Math.abs(curW - tgtW) / 0.5);
    document.getElementById('modalCalcWeeks').textContent = `약 ${weeks} 주`;
  }

  ['modalWeight', 'modalTargetWeight', 'modalFat', 'modalTargetFat'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateModalGoalDiff);
  });

  // InBody Form Submit
  document.getElementById('inbodyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.profile = {
      gender: document.getElementById('modalGender').value,
      age: Number(document.getElementById('modalAge').value),
      height: Number(document.getElementById('modalHeight').value),
      weight: Number(document.getElementById('modalWeight').value),
      muscleMass: Number(document.getElementById('modalMuscle').value),
      bodyFatPercent: Number(document.getElementById('modalFat').value),
      bmr: Number(document.getElementById('modalBmr').value),
      targetWeight: Number(document.getElementById('modalTargetWeight').value),
      targetBodyFatPercent: Number(document.getElementById('modalTargetFat').value)
    };

    // Also update today's log weight if not modified
    const dayEntry = getTodayEntry(state.currentDate);
    dayEntry.weight = state.profile.weight;
    dayEntry.bodyFat = state.profile.bodyFatPercent;

    saveData();
    inbodyModal.classList.add('hidden');
    updateKpiAndSummary();
    updateWeightTrendChart();
    showToast('인바디 및 목표 설정이 저장되었습니다!');

    if (window.confetti) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  });

  // 8. Add Pool Item Modal
  const addPoolModal = document.getElementById('addPoolModal');
  document.getElementById('openAddPoolModalBtn').addEventListener('click', () => {
    addPoolModal.classList.remove('hidden');
  });
  document.getElementById('closeAddPoolModalBtn').addEventListener('click', () => addPoolModal.classList.add('hidden'));
  document.getElementById('cancelAddPoolModalBtn').addEventListener('click', () => addPoolModal.classList.add('hidden'));

  document.getElementById('addPoolForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('poolItemName').value.trim();
    const details = document.getElementById('poolItemDetails').value.trim();
    const duration = Number(document.getElementById('poolItemMinutes').value) || 10;
    const calories = Number(document.getElementById('poolItemCalories').value) || 50;
    const category = document.getElementById('poolItemCategory').value;

    const newItem = {
      id: 'pool-' + Date.now(),
      name,
      details,
      duration,
      calories,
      category,
      type: category === 'strength' ? 'strength' : 'cardio'
    };

    state.pool.unshift(newItem);
    saveData();
    renderExercisePool();
    addPoolModal.classList.add('hidden');
    document.getElementById('addPoolForm').reset();
    showToast(`'${name}' 운동이 Pool에 등록되었습니다!`);
  });

  // 9. Quick Record Weight Modal
  const quickWeightModal = document.getElementById('quickWeightModal');
  document.getElementById('quickRecordWeightBtn').addEventListener('click', () => {
    const dayEntry = getTodayEntry(state.currentDate);
    document.getElementById('quickWeightInput').value = dayEntry.weight || state.profile.weight || 60;
    document.getElementById('quickWeightDateLabel').textContent = `${formatDateDisplay(state.currentDate)} 체중`;
    quickWeightModal.classList.remove('hidden');
  });
  document.getElementById('cancelQuickWeightBtn').addEventListener('click', () => quickWeightModal.classList.add('hidden'));
  document.getElementById('saveQuickWeightBtn').addEventListener('click', () => {
    const newWeight = parseFloat(document.getElementById('quickWeightInput').value);
    if (!newWeight || isNaN(newWeight)) return;

    const dayEntry = getTodayEntry(state.currentDate);
    dayEntry.weight = newWeight;
    state.profile.weight = newWeight; // sync with profile
    saveData();
    quickWeightModal.classList.add('hidden');
    updateKpiAndSummary();
    updateWeightTrendChart();
    showToast(`체중 ${newWeight.toFixed(1)} kg 기록 완료!`);
  });

  // 10. Data Backup / Restore / Reset
  const dataMenuBtn = document.getElementById('dataMenuBtn');
  const dataMenuDropdown = document.getElementById('dataMenuDropdown');

  dataMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dataMenuDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dataMenuDropdown.classList.add('hidden');
  });

  // Export JSON
  document.getElementById('exportDataBtn').addEventListener('click', () => {
    const exportBundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      pool: state.pool,
      dailyLogs: state.dailyLogs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fit_tracker_backup_${getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('데이터 백업 파일이 다운로드되었습니다.');
  });

  // Import JSON
  document.getElementById('importDataInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.profile) state.profile = imported.profile;
        if (imported.pool) state.pool = imported.pool;
        if (imported.dailyLogs) state.dailyLogs = imported.dailyLogs;

        saveData();
        renderExercisePool();
        renderTodayWorkoutList();
        updateKpiAndSummary();
        updateWeightTrendChart();
        showToast('데이터 복원이 완료되었습니다!');
      } catch (err) {
        alert('올바르지 않은 백업 파일 형식입니다.');
      }
    };
    reader.readAsText(file);
  });

  // Reset to Sample Data
  document.getElementById('resetSampleBtn').addEventListener('click', () => {
    if (!confirm('기존 데이터를 샘플 데이터로 새로고침하시겠습니까?')) return;
    state.profile = { ...DEFAULT_PROFILE };
    state.pool = [...DEFAULT_PRESET_POOL];
    state.dailyLogs = {};
    seedSampleData(state.dailyLogs, state.profile);
    saveData();
    renderExercisePool();
    renderTodayWorkoutList();
    updateKpiAndSummary();
    updateWeightTrendChart();
    showToast('샘플 데이터가 성공적으로 적용되었습니다.');
  });
}

// --- App Bootstrap ---
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  renderExercisePool();
  renderTodayWorkoutList();
  initCharts();
  updateKpiAndSummary();
  recalculateFormCalorie();
});
