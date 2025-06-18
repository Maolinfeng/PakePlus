// 全局变量
let currentScene = '';
let soundEnabled = true;
let foundHazards = 0;
let totalHazards = 4;
let isLoggedIn = false;

// 登录密码
const CORRECT_PASSWORD = 'pugongying201508';

// 音效对象
const sounds = {
    click: createBeepSound(800, 100), // 点击音效
    success: createBeepSound(1000, 200), // 成功音效
    complete: createApplauseSound() // 完成音效
};

// 创建简单的蜂鸣音效
function createBeepSound(frequency, duration) {
    return function() {
        if (!soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    };
}

// 创建掌声音效（模拟）
function createApplauseSound() {
    return function() {
        if (!soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建多个短促的噪音来模拟掌声
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const bufferSize = audioContext.sampleRate * 0.1;
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const output = buffer.getChannelData(0);
                
                for (let j = 0; j < bufferSize; j++) {
                    output[j] = (Math.random() * 2 - 1) * 0.1;
                }
                
                const whiteNoise = audioContext.createBufferSource();
                whiteNoise.buffer = buffer;
                
                const gainNode = audioContext.createGain();
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                whiteNoise.connect(gainNode);
                gainNode.connect(audioContext.destination);
                whiteNoise.start();
            }, i * 50);
        }
    };
}

// DOM元素
const loginScreen = document.getElementById('login-screen');
const sceneSelection = document.getElementById('scene-selection');
const hazardDetection = document.getElementById('hazard-detection');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginBtn = document.querySelector('.login-btn');
const loginText = document.getElementById('login-text');
const loginLoading = document.getElementById('login-loading');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const sceneCards = document.querySelectorAll('.scene-card');
const backBtn = document.getElementById('back-btn');
const resetBtn = document.getElementById('reset-btn');
const soundToggle = document.getElementById('sound-toggle');
const soundToggleGame = document.getElementById('sound-toggle-game');
const sceneTitle = document.getElementById('scene-title');
const sceneImage = document.getElementById('scene-image');
const hazardPoints = document.getElementById('hazard-points');
const foundCount = document.getElementById('found-count');
const totalCount = document.getElementById('total-count');
const hintMessage = document.getElementById('hint-message');
const completionModal = document.getElementById('completion-modal');
const continueBtn = document.getElementById('continue-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');

// 场景配置 - 每个场景的隐患点位置（相对于图片的百分比坐标）
const sceneConfig = {
    chaoshi: {
        name: '超市场景',
        image: 'chaoshi.jpg',
        hazards: [
            { x: 44.54, y: 23.52, description: '疏散通道擅自改为库房' },
            { x: 62.12, y: 16.27, description: '应急灯无效' },
            { x: 86.79, y: 32.07, description: '疏散门应当向疏散方向开启' },
            { x: 4.56, y: 41.89, description: '餐饮区使用罐装液化石油气' }
        ]
    },
    shangchang: {
        name: '商场场景',
        image: 'shangchang.jpg',
        hazards: [
            { x: 90.12, y: 17.69, description: '安全出口被上锁封闭' },
            { x: 8.46, y: 40.63, description: '消防栓被锁' },
            { x: 19.23, y: 33.75, description: '防火卷帘下方堆放物品' },
            { x: 82.56, y: 83.93, description: '在商场营业时间使用电焊动火作业' }
        ]
    },
    sushe: {
        name: '宿舍场景',
        image: 'sushe.jpg',
        hazards: [
            { x: 61.45, y: 62.10, description: '擅自拉接电气线路，设置炉灶' },
            { x: 49.22, y: 58.53, description: '电线过长破损' },
            { x: 20.32, y: 58.53, description: '仓库和宿舍混用，放置易燃易爆品' },
            { x: 33.01, y: 38.11, description: '墙体上插排未固定损坏，用裸线头代替插头使用' }
        ]
    },
    xiaoqu: {
        name: '小区场景',
        image: 'xiaoqu.jpg',
        hazards: [
            { x: 87.43, y: 32.07, description: '楼道口堆积可燃物' },
            { x: 67.96, y: 46.88, description: '消防器材丢失' },
            { x: 60.33, y: 71.86, description: '电动车飞线充电' },
            { x: 32.11, y: 87.08, description: '消防通道违规停放车辆并上锁' }
        ]
    },
    zuoye: {
        name: '作业场景',
        image: 'zuoye.jpg',
        hazards: [
            { x: 66.83, y: 64.72, description: '消防通道被堵塞' },
            { x: 9.94, y: 90.02, description: '杂物堆放靠近火源' },
            { x: 7.25, y: 36.95, description: '一闸多机' },
            { x: 27.71, y: 39.42, description: '设备电线过长破损' }
        ]
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    init();
    updateSoundButtons();
});

// 初始化应用
function init() {
    // 登录相关事件监听
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', logout);
    
    // 密码输入框回车事件
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
    
    // 场景选择事件监听
    sceneCards.forEach(card => {
        card.addEventListener('click', () => {
            if (!isLoggedIn) return;
            
            const scene = card.dataset.scene;
            startScene(scene);
        });
    });

    // 游戏控制事件监听
    backBtn.addEventListener('click', () => {
        if (!isLoggedIn) return;
        backToSceneSelection();
    });
    
    resetBtn.addEventListener('click', () => {
        if (!isLoggedIn) return;
        resetScene();
    });
    
    // 音效控制事件监听
    soundToggle.addEventListener('click', toggleSound);
    soundToggleGame.addEventListener('click', toggleSound);
    
    // 完成弹窗事件监听
    continueBtn.addEventListener('click', () => {
        if (!isLoggedIn) return;
        resetScene();
        hideModal();
    });
    
    backToMenuBtn.addEventListener('click', () => {
        if (!isLoggedIn) return;
        backToSceneSelection();
        hideModal();
    });
    
    // 图片点击事件监听
    sceneImage.addEventListener('click', handleImageClick);
    
    // 初始状态：显示登录界面
    loginScreen.classList.add('active');
    
    // 聚焦到密码输入框
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
}

// 登录功能
function handleLogin(e) {
    e.preventDefault();
    
    const password = passwordInput.value.trim();
    
    if (!password) {
        showLoginError('请输入密码');
        return;
    }
    
    // 显示加载状态
    showLoginLoading(true);
    
    // 模拟验证延迟
    setTimeout(() => {
        if (password === CORRECT_PASSWORD) {
            // 登录成功
            isLoggedIn = true;
            loginSuccess();
        } else {
            // 登录失败
            showLoginError('密码错误，请重新输入');
            passwordInput.value = '';
            passwordInput.focus();
        }
        showLoginLoading(false);
    }, 1000);
}

function loginSuccess() {
    // 隐藏登录界面，显示主界面
    loginScreen.classList.remove('active');
    sceneSelection.classList.add('active');
    
    // 清空密码输入框
    passwordInput.value = '';
    hideLoginError();
    
    // 播放成功音效
    if (soundEnabled) {
        sounds.success();
    }
}

function logout() {
    isLoggedIn = false;
    
    // 返回登录界面
    sceneSelection.classList.remove('active');
    hazardDetection.classList.remove('active');
    loginScreen.classList.add('active');
    
    // 重置当前场景
    currentScene = '';
    foundHazards = 0;
    
    // 聚焦到密码输入框
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
}

function showLoginLoading(show) {
    if (show) {
        loginText.style.display = 'none';
        loginLoading.style.display = 'inline-block';
        loginBtn.disabled = true;
    } else {
        loginText.style.display = 'inline-block';
        loginLoading.style.display = 'none';
        loginBtn.disabled = false;
    }
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    
    // 3秒后自动隐藏错误信息
    setTimeout(() => {
        hideLoginError();
    }, 3000);
}

function hideLoginError() {
    loginError.style.display = 'none';
}

// 开始场景
function startScene(sceneName) {
    currentScene = sceneName;
    const config = sceneConfig[sceneName];
    
    // 切换到游戏界面
    sceneSelection.classList.remove('active');
    hazardDetection.classList.add('active');
    
    // 设置场景信息
    sceneTitle.textContent = config.name;
    sceneImage.src = config.image;
    
    // 重置进度并设置当前场景的隐患总数
    foundHazards = 0;
    totalHazards = config.hazards.length; // 动态设置隐患总数
    updateProgress();
    
    // 等待图片加载完成后创建隐患点
    sceneImage.onload = function() {
        createHazardPoints(config.hazards);
    };
}

// 创建隐患点
function createHazardPoints(hazards) {
    hazardPoints.innerHTML = '';
    
    hazards.forEach((hazard, index) => {
        const point = document.createElement('div');
        point.className = 'hazard-point invisible';
        point.style.left = hazard.x + '%';
        point.style.top = hazard.y + '%';
        point.dataset.index = index;
        point.dataset.description = hazard.description;
        point.dataset.found = 'false';
        
        hazardPoints.appendChild(point);
    });
}

// 检查点击位置是否在隐患点附近
function checkHazardClick(clickX, clickY) {
    const imageRect = sceneImage.getBoundingClientRect();
    const imageWidth = imageRect.width;
    const imageHeight = imageRect.height;
    
    // 转换点击坐标为相对于图片的百分比
    const clickPercentX = ((clickX - imageRect.left) / imageWidth) * 100;
    const clickPercentY = ((clickY - imageRect.top) / imageHeight) * 100;
    
    // 计算20像素在当前图片尺寸下的百分比范围
    const toleranceX = (20 / imageWidth) * 100;
    const toleranceY = (20 / imageHeight) * 100;
    
    // 检查每个隐患点
    const hazardElements = hazardPoints.children;
    for (let i = 0; i < hazardElements.length; i++) {
        const hazardElement = hazardElements[i];
        if (hazardElement.dataset.found === 'true') continue;
        
        const config = sceneConfig[currentScene];
        const hazard = config.hazards[i];
        
        // 检查是否在容差范围内
        if (Math.abs(clickPercentX - hazard.x) <= toleranceX && 
            Math.abs(clickPercentY - hazard.y) <= toleranceY) {
            discoverHazard(hazardElement);
            return true;
        }
    }
    return false;
}

// 发现隐患点
function discoverHazard(pointElement) {
    if (pointElement.dataset.found === 'true') {
        return; // 已经发现过了
    }
    
    // 播放点击音效
    sounds.click();
    
    // 更新点的状态
    pointElement.classList.remove('invisible');
    pointElement.classList.add('found');
    pointElement.dataset.found = 'true';
    pointElement.innerHTML = '✓';
    
    // 显示隐患描述
    const description = pointElement.dataset.description;
    showHint(description);
    
    // 更新进度
    foundHazards++;
    updateProgress();
    
    // 检查是否完成
    if (foundHazards >= totalHazards) {
        setTimeout(() => {
            completeScene();
        }, 1000);
    }
}

// 更新进度显示
function updateProgress() {
    foundCount.textContent = foundHazards;
    totalCount.textContent = totalHazards;
}

// 完成场景
function completeScene() {
    sounds.complete();
    showModal();
}

// 显示提示信息
function showHint(message) {
    hintMessage.textContent = message;
    hintMessage.classList.add('show');
    
    setTimeout(() => {
        hintMessage.classList.remove('show');
    }, 2000);
}

// 显示完成弹窗
function showModal() {
    completionModal.classList.add('show');
}

// 隐藏完成弹窗
function hideModal() {
    completionModal.classList.remove('show');
}

// 返回场景选择
function backToSceneSelection() {
    hazardDetection.classList.remove('active');
    sceneSelection.classList.add('active');
    currentScene = '';
    foundHazards = 0;
}

// 重置场景
function resetScene() {
    if (currentScene) {
        foundHazards = 0;
        const config = sceneConfig[currentScene];
        totalHazards = config.hazards.length; // 确保隐患总数正确
        updateProgress();
        createHazardPoints(config.hazards);
        showHint('场景已重置');
    }
}

// 切换音效
function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButtons();
    
    if (soundEnabled) {
        sounds.success();
    }
}

// 更新音效按钮显示
function updateSoundButtons() {
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    const soundIconGame = document.getElementById('sound-icon-game');
    
    if (soundEnabled) {
        soundIcon.textContent = '🔊';
        soundText.textContent = '音效开启';
        soundIconGame.textContent = '🔊';
        soundToggle.classList.remove('sound-disabled');
        soundToggleGame.classList.remove('sound-disabled');
    } else {
        soundIcon.textContent = '🔇';
        soundText.textContent = '音效关闭';
        soundIconGame.textContent = '🔇';
        soundToggle.classList.add('sound-disabled');
        soundToggleGame.classList.add('sound-disabled');
    }
}

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'Escape':
            if (hazardDetection.classList.contains('active')) {
                backToSceneSelection();
            }
            break;
        case 'r':
        case 'R':
            if (hazardDetection.classList.contains('active')) {
                resetScene();
            }
            break;
        case 'm':
        case 'M':
            toggleSound();
            break;
    }
});

// 防止右键菜单（可选）
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// 窗口大小改变时重新调整隐患点位置
window.addEventListener('resize', function() {
    if (currentScene && hazardPoints.children.length > 0) {
        // 重新创建隐患点以适应新的图片尺寸
        const config = sceneConfig[currentScene];
        const discoveredPoints = Array.from(hazardPoints.children).map(point => 
            point.classList.contains('discovered')
        );
        
        createHazardPoints(config.hazards);
        
        // 恢复已发现的状态
        Array.from(hazardPoints.children).forEach((point, index) => {
            if (discoveredPoints[index]) {
                point.classList.remove('undiscovered');
                point.classList.add('discovered');
                point.innerHTML = '✓';
            }
        });
    }
});

// 处理图片点击事件
function handleImageClick(e) {
    if (!isLoggedIn) return;
    
    const found = checkHazardClick(e.clientX, e.clientY);
    if (!found) {
        showHint('此处无隐患');
    }
} 