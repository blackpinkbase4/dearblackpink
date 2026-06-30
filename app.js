// THE POLAROID CAPSULE - APPLICATION LOGIC AND SUPABASE SYNCRONIZATION
const SUPABASE_URL = 'https://bmrabjysahblnosnpqia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcmFianlzYWhibG5vc25wcWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTcyODYsImV4cCI6MjA5Nzc3MzI4Nn0.Igx7yAd98DyTqPxZmGtl-QxdIO0TW3_YrDjpr-swhjo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Target Date: August 8, 2026, at 12:00 AM Midnight KST (Korean Standard Time)
// 12:00 AM KST corresponds to 3:00 PM UTC on August 7th
const TARGET_DATE = new Date("2026-08-07T15:00:00Z");

// App State
let currentUser = {
    sender: '',
    recipient: ''
};
let loadedLetters = null;
let loadedMedia = null;

// Pagination configuration
const lettersPerPage = 12;
let visibleLettersCount = 12;

const mediaPerPage = 8;
let visibleMediaCount = 8;

// Initial Seed Letters (pre-populated to make the vault feel alive)
const SEED_LETTERS = [];

// Initial Seed Media Creations (open all time, SVG graphics & video edits)
const SEED_MEDIA = [];

// BLINK Card Membership States
const SYSTEM_STICKERS = {
    group: Array.from({ length: 10 }, (_, i) => `stickers/group/${i + 1}.png`),
    jisoo: Array.from({ length: 10 }, (_, i) => `stickers/jisoo/${i + 1}.png`),
    jennie: Array.from({ length: 10 }, (_, i) => `stickers/jennie/${i + 1}.png`),
    rose: Array.from({ length: 10 }, (_, i) => `stickers/rose/${i + 1}.png`),
    lisa: Array.from({ length: 10 }, (_, i) => `stickers/lisa/${i + 1}.png`),
    deco: Array.from({ length: 15 }, (_, i) => `stickers/deco/${i + 1}.png`),
    myphotos: []
};

const BIAS_SIGNATURES = {
    jisoo: 'signatures/jisoo.png',
    jennie: 'signatures/jennie.png',
    rose: 'signatures/rose.png',
    lisa: 'signatures/lisa.png'
};

let activeCardShape = 'rectangle';
let activeHolderFrame = 'none';
let activeCardFinish = 'matte';
let activeCardPattern = 'ruled';
let activeCardFont = 'serif';
let cardPlacedStickers = [];
let selectedStickerId = null;
let activeStickerAction = null; // 'drag', 'rotate-scale'
let activeStickerEl = null;
let dragStartX = 0;
let dragStartY = 0;
let stickerStartLeft = 0;
let stickerStartTop = 0;
let stickerStartWidth = 0;
let stickerStartHeight = 0;
let stickerStartRotation = 0;
let stickerCenterPointerDist = 0;
let stickerCenterPointerAngle = 0;

// Elements
const viewGatekeeper = document.getElementById('view-gatekeeper');
const viewWrite = document.getElementById('view-write');
const viewCountdown = document.getElementById('view-countdown');
const viewGallery = document.getElementById('view-gallery');
const viewMediaHub = document.getElementById('view-media-hub');
const viewQuiz = document.getElementById('view-quiz');
const viewPass = document.getElementById('view-pass-generator');
const navCapsule = document.getElementById('nav-capsule');
const navQuiz = document.getElementById('nav-quiz');
const navMediaHub = document.getElementById('nav-media-hub');
const navPass = document.getElementById('nav-pass');

// BLINK Quiz Elements
const quizActiveCard = document.getElementById('quiz-active-card');
const quizResultCard = document.getElementById('quiz-result-card');
const quizQuestionNum = document.getElementById('quiz-question-num');
const quizProgressText = document.getElementById('quiz-progress-text');
const quizProgressFill = document.getElementById('quiz-progress-fill');
const quizQuestionTitle = document.getElementById('quiz-question-title');
const quizOptionsContainer = document.getElementById('quiz-options-container');
const quizResultImg = document.getElementById('quiz-result-img');
const quizResultPlaceholder = document.getElementById('quiz-result-placeholder');
const quizResultName = document.getElementById('quiz-result-name');
const quizResultDesc = document.getElementById('quiz-result-desc');
const btnQuizRestart = document.getElementById('btn-quiz-restart');

// Share on X Modal Elements
const shareXModal = document.getElementById('share-x-modal');
const btnShareXPost = document.getElementById('btn-share-x-post');
const btnShareXClose = document.getElementById('btn-share-x-close');

const viewCardGenerator = document.getElementById('view-card-generator');
const navCardGenerator = document.getElementById('nav-card-generator');
const cardCanvasWrapper = document.getElementById('card-canvas-wrapper');
const membershipCard = document.getElementById('membership-card');
const cardValId = document.getElementById('card-val-id');
const cardValName = document.getElementById('card-val-name');
const cardValDate = document.getElementById('card-val-date');
const cardBiasSignature = document.getElementById('card-bias-signature');
const cardStickerCanvas = document.getElementById('card-sticker-canvas');
const stickersTrayGrid = document.getElementById('stickers-tray-grid');
const customStickerInput = document.getElementById('custom-sticker-input');
const btnUploadCustomSticker = document.getElementById('btn-upload-custom-sticker-nav');
const btnDownloadCard = document.getElementById('btn-download-card');
const btnShareCard = document.getElementById('btn-share-card');

const memberNicknameInput = document.getElementById('member-nickname-input');
const memberDateInput = document.getElementById('member-date-input');
const colorBgPicker = document.getElementById('color-bg-picker');
const colorBorderPicker = document.getElementById('color-border-picker');
const colorLinesPicker = document.getElementById('color-lines-picker');
const colorTextPicker = document.getElementById('color-text-picker');

const gatekeeperForm = document.getElementById('gatekeeper-form');
const senderNicknameInput = document.getElementById('sender-nickname');
const recipientNameInput = document.getElementById('recipient-name');

const badgeSender = document.getElementById('badge-sender');
const badgeRecipient = document.getElementById('badge-recipient');
const backToGateBtn = document.getElementById('back-to-gate');

const letterContent = document.getElementById('letter-content');
const charsUsed = document.getElementById('chars-used');
const sealLetterBtn = document.getElementById('seal-letter-btn');

const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMinutes = document.getElementById('cd-minutes');
const cdSeconds = document.getElementById('cd-seconds');
const successBanner = document.getElementById('success-banner');
const writeAnotherBtn = document.getElementById('write-another-btn');

const adminLockBtn = document.getElementById('admin-lock-btn');

const polaroidGrid = document.getElementById('polaroid-grid');
const galleryEmpty = document.getElementById('gallery-empty');
const gallerySearch = document.getElementById('gallery-search');
const filterButtons = document.querySelectorAll('.btn-filter');
const totalLettersCount = document.getElementById('total-letters-count');
const galleryWriteNew = document.getElementById('gallery-write-new');

const mediaUploadForm = document.getElementById('media-upload-form');
const mediaAuthorInput = document.getElementById('media-author');
const mediaCaptionInput = document.getElementById('media-caption');
const mediaDropzone = document.getElementById('media-dropzone');
const mediaFileInput = document.getElementById('media-file-input');
const dropzonePrompt = document.getElementById('dropzone-prompt');
const dropzonePreview = document.getElementById('dropzone-preview');
const btnRemovePreview = document.getElementById('btn-remove-preview');
const mediaGrid = document.getElementById('media-grid');
const mediaEmpty = document.getElementById('media-empty');
const totalMediaCount = document.getElementById('total-media-count');

// PWA Install Elements
const btnInstallApp = document.getElementById('btn-install-app');
let deferredPrompt = null;

let photoRollContainer = null;
let photoRollTrack = null;

// Navigation state
let currentCapsuleView = viewGatekeeper;
let uploadedFileData = null;
let uploadedFileType = null;
let selectedFileObject = null;
let wasMusicPlayingBeforeSwitch = false;

// Modal Elements
const polaroidModal = document.getElementById('polaroid-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalPolaroidText = document.getElementById('modal-polaroid-text');
const modalPolaroidStamp = document.getElementById('modal-polaroid-stamp');
const modalToName = document.getElementById('modal-to-name');
const modalFromName = document.getElementById('modal-from-name');
const modalPolaroidDate = document.getElementById('modal-polaroid-date');

// Admin Passcode Modal Elements
const adminPasscodeModal = document.getElementById('admin-passcode-modal');
const adminModalCloseBtn = document.getElementById('admin-modal-close-btn');
const adminPasscodeForm = document.getElementById('admin-passcode-form');
const adminPasscodeInput = document.getElementById('admin-passcode-input');
const togglePasswordVisibility = document.getElementById('toggle-password-visibility');
const passcodeErrorMsg = document.getElementById('passcode-error-msg');
const passcodeCardContent = adminPasscodeModal.querySelector('.passcode-modal-content');

// Toast Notification
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');

// Timing intervals
let countdownInterval = null;

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    // Re-query photo roll elements to guarantee they are fully ready in the DOM
    photoRollContainer = document.getElementById('photo-roll');
    photoRollTrack = document.getElementById('photo-roll-track');

    // Set up local storage if empty
    if (!localStorage.getItem('polaroid_capsule_letters')) {
        localStorage.setItem('polaroid_capsule_letters', JSON.stringify([]));
    }

    if (!localStorage.getItem('polaroid_capsule_media')) {
        localStorage.setItem('polaroid_capsule_media', JSON.stringify([]));
    }

    // Try to retrieve user session details from sessionStorage
    const storedUser = sessionStorage.getItem('capsule_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        senderNicknameInput.value = currentUser.sender;
        recipientNameInput.value = currentUser.recipient;
        mediaAuthorInput.value = currentUser.sender;
    }

    // Initialize Developer Simulation Option state
    const simulatedBypass = localStorage.getItem('capsule_simulated_bypass') === 'true';
    if (simulatedBypass) {
        adminLockBtn.classList.remove('hidden');
    }

    // Start checking countdown immediately
    startCountdownTracker();

    // Initialize Dark Mode, Audio Player and global progress counts
    initTheme();
    initAudioPlayer();
    fetchGlobalLettersCount();

    // Check what view should be active initially
    navigateInitialView();

    // Render media list
    renderMediaShowcase(true);

    // Register Event Listeners
        // Init Card Generator values
    if (cardValId) {
        cardValId.textContent = 'BP-10YR-' + Math.floor(1000 + Math.random() * 9000);
    }
    updateCardBiasSignature();
    renderStickerTray('group');
    
    // Sync default input values on page load
    if (memberNicknameInput && cardValName) {
        cardValName.textContent = memberNicknameInput.value.trim() || '';
    }
    if (memberDateInput && cardValDate) {
        cardValDate.textContent = memberDateInput.value || '';
    }

    setupEventListeners();
});

// Navigation logic based on date and bypass state
function isVaultUnlocked() {
    const simulatedBypass = localStorage.getItem('capsule_simulated_bypass') === 'true';
    if (simulatedBypass) {
        return true;
    }
    return new Date() >= TARGET_DATE;
}

function navigateInitialView() {
    if (isVaultUnlocked()) {
        switchView(viewGallery);
        renderPolaroidGallery(true);
    } else {
        switchView(viewGatekeeper);
    }
}

function switchView(targetView) {
    if (isVaultUnlocked() && (targetView === viewGatekeeper || targetView === viewWrite || targetView === viewCountdown)) {
        targetView = viewGallery;
    }

    if (targetView !== viewMediaHub && targetView !== viewQuiz && targetView !== viewPass) {
        currentCapsuleView = targetView;
    }

    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });
    // Show target view
    targetView.classList.add('active');
}

// Setup all event listeners
function setupEventListeners() {
    initPassListeners();
    // Lock Simulated Vault click listener
    adminLockBtn.addEventListener('click', () => {
        localStorage.setItem('capsule_simulated_bypass', 'false');
        adminLockBtn.classList.add('hidden');
        showToast('Vault Simulation Locked.');
        
        if (isVaultUnlocked()) {
            switchView(viewGallery);
            renderPolaroidGallery();
        } else {
            // Re-evaluate current state. If we were in the gallery, go back to gatekeeper
            if (viewGallery.classList.contains('active')) {
                switchView(viewGatekeeper);
            }
        }
    });

    // Admin Passcode Form Submission
    adminPasscodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const passcode = adminPasscodeInput.value;
        
        // Passcode: blackpinkbase4@gmail.com
        if (passcode === 'blackpinkbase4@gmail.com') {
            localStorage.setItem('capsule_simulated_bypass', 'true');
            adminLockBtn.classList.remove('hidden');
            closeAdminModal();
            showToast('Vault Simulation Unlocked!');
            
            if (isVaultUnlocked()) {
                switchView(viewGallery);
                renderPolaroidGallery();
            }
        } else {
            // Show error visual and shake card
            passcodeErrorMsg.style.opacity = '1';
            passcodeCardContent.classList.add('shake');
            setTimeout(() => {
                passcodeCardContent.classList.remove('shake');
            }, 400);
            adminPasscodeInput.select();
        }
    });

    // Hidden admin trigger detection (type the word "admin" to trigger)
    let keySequence = '';
    const SECRET_CODE = 'admin';
    window.addEventListener('keydown', (e) => {
        // Don't listen to shortcuts while typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        keySequence += e.key.toLowerCase();
        if (keySequence.length > SECRET_CODE.length) {
            keySequence = keySequence.substring(keySequence.length - SECRET_CODE.length);
        }
        
        if (keySequence === SECRET_CODE) {
            keySequence = ''; // reset sequence buffer
            openAdminModal();
        }
    });

    // Secret mobile/tap trigger: Click/tap the logo 5 times quickly to open admin modal
    let logoClickCount = 0;
    let logoClickTimeout = null;
    const logoTrigger = document.querySelector('.logo');
    if (logoTrigger) {
        logoTrigger.addEventListener('click', () => {
            logoClickCount++;
            clearTimeout(logoClickTimeout);
            
            if (logoClickCount >= 5) {
                logoClickCount = 0;
                openAdminModal();
            } else {
                logoClickTimeout = setTimeout(() => {
                    logoClickCount = 0;
                }, 2000); // 2-second timeout window to complete the taps
            }
        });
    }

    // Toggle Password eye visibility icon
    togglePasswordVisibility.addEventListener('click', () => {
        if (adminPasscodeInput.type === 'password') {
            adminPasscodeInput.type = 'text';
            togglePasswordVisibility.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
            adminPasscodeInput.type = 'password';
            togglePasswordVisibility.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
    });

    // Admin Modal Close Actions
    adminModalCloseBtn.addEventListener('click', closeAdminModal);
    adminPasscodeModal.addEventListener('click', (e) => {
        if (e.target === adminPasscodeModal) {
            closeAdminModal();
        }
    });

    // Gatekeeper submission
    gatekeeperForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentUser.sender = senderNicknameInput.value.trim();
        currentUser.recipient = recipientNameInput.value.trim();
        
        // Save user to session storage
        sessionStorage.setItem('capsule_user', JSON.stringify(currentUser));
        
        // Update labels
        badgeSender.textContent = currentUser.sender;
        badgeRecipient.textContent = currentUser.recipient;
        
        
        // Move to writing screen
        switchView(viewWrite);
        letterContent.value = '';
        charsUsed.textContent = '0';
        letterContent.focus();
    });

    // Back to gatekeeper
    backToGateBtn.addEventListener('click', () => {
        switchView(viewGatekeeper);
    });

    // Character counter for letter area
    letterContent.addEventListener('input', () => {
        const count = letterContent.value.length;
        charsUsed.textContent = count;
        if (count >= 600) {
            charsUsed.style.color = 'var(--color-primary)';
        } else {
            charsUsed.style.color = 'var(--color-text-muted)';
        }
    });

    // Seal Letter / Submit Message
    sealLetterBtn.addEventListener('click', () => {
        const text = letterContent.value.trim();
        if (!text) {
            showToast('Please write a message before sealing.');
            return;
        }

        // Get selected sticker (stamp)
        const selectedStickerEl = document.querySelector('input[name="polaroid-sticker"]:checked');
        const stickerValue = selectedStickerEl ? selectedStickerEl.value : 'heart';

        // Get selected member tag
        const selectedMemberEl = document.querySelector('input[name="member-tag"]:checked');
        const memberValue = selectedMemberEl ? selectedMemberEl.value : 'all';

        // Get selected photocard skin
        const selectedSkinEl = document.querySelector('input[name="polaroid-skin"]:checked');
        const skinValue = selectedSkinEl ? selectedSkinEl.value : 'classic';

        // Serialize configurations into sticker column
        const serializedStickerConfig = JSON.stringify({
            stamp: stickerValue,
            skin: skinValue,
            member: memberValue
        });

        // Save letter
        const newLetter = {
            id: 'letter-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            from: currentUser.sender,
            to: currentUser.recipient,
            message: text,
            sticker: serializedStickerConfig,
            timestamp: Date.now()
        };

        saveLetter(newLetter);
        
        // Show success popup animation / screen transition
        if (isVaultUnlocked()) {
            // If vault is already open, go straight to gallery
            showToast('Letter sealed! Opening the vault...');
            switchView(viewGallery);
            renderPolaroidGallery();
        } else {
            // Go to countdown page and show the banner
            successBanner.style.display = 'flex';
            switchView(viewCountdown);
            
            // Trigger the Share on X popup after 1.5 seconds so they can see the countdown and success banner first!
            setTimeout(() => {
                openShareXModal('letter');
            }, 1500);
        }
    });

    // Write another message from countdown view
    writeAnotherBtn.addEventListener('click', () => {
        switchView(viewWrite);
        letterContent.value = '';
        charsUsed.textContent = '0';
        letterContent.focus();
    });

    // Write a new message from gallery view
    galleryWriteNew.addEventListener('click', () => {
        // If we don't have nicknames, go to gatekeeper, else write
        if (currentUser.sender && currentUser.recipient) {
            badgeSender.textContent = currentUser.sender;
            badgeRecipient.textContent = currentUser.recipient;
            switchView(viewWrite);
            letterContent.value = '';
            charsUsed.textContent = '0';
            letterContent.focus();
        } else {
            switchView(viewGatekeeper);
        }
    });

    // Search input typing
    gallerySearch.addEventListener('input', () => {
        visibleLettersCount = lettersPerPage;
        renderPolaroidGallery();
    });

    // Filter tags clicking
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            visibleLettersCount = lettersPerPage;
            renderPolaroidGallery();
        });
    });

    // Modal Close
    modalCloseBtn.addEventListener('click', closeModal);
    polaroidModal.addEventListener('click', (e) => {
        if (e.target === polaroidModal) {
            closeModal();
        }
    });

    // Modal Zoom Letter Deletion for Admin/Author
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    if (modalDeleteBtn) {
        modalDeleteBtn.addEventListener('click', () => {
            const currentLetterId = modalDeleteBtn.dataset.letterId;
            if (currentLetterId) {
                deleteLetterItem(currentLetterId);
            }
        });
    }

    // Helper to toggle active state in header navigation
    function updateHeaderNavState(activeLink) {
        navCapsule.classList.remove('active');
        navQuiz.classList.remove('active');
        navMediaHub.classList.remove('active');
        if (navPass) navPass.classList.remove('active');
        activeLink.classList.add('active');
    }

    // Helper to restore music on switching back to a music-supported tab
    function restoreMusicIfSwitchingBack() {
        const playerWidget = document.getElementById('music-player');
        if (playerWidget) {
            playerWidget.style.display = 'flex';
        }
        const audio = document.getElementById('ambient-audio');
        const playBtn = document.getElementById('btn-player-play');
        const vinyl = document.getElementById('vinyl-disc');
        if (audio && wasMusicPlayingBeforeSwitch) {
            (audio.play() || Promise.resolve()).then(() => {
                if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                if (vinyl) vinyl.classList.add('playing');
            }).catch(e => console.log("Failed to autoplay Stay song:", e));
        }
    }

    // Navigation Switcher Tabs
    navCapsule.addEventListener('click', () => {
        updateHeaderNavState(navCapsule);
        restoreMusicIfSwitchingBack();
        switchView(currentCapsuleView);
    });



    navQuiz.addEventListener('click', () => {
        updateHeaderNavState(navQuiz);
        restoreMusicIfSwitchingBack();
        switchView(viewQuiz);
        initQuizState(); // Reset and load quiz when tab clicked
    });

    if (navPass) {
        navPass.addEventListener('click', () => {
            updateHeaderNavState(navPass);
            
            // Pause music if it's currently playing
            const audio = document.getElementById('ambient-audio');
            const playBtn = document.getElementById('btn-player-play');
            const vinyl = document.getElementById('vinyl-disc');
            const playerWidget = document.getElementById('music-player');
            
            if (audio && !audio.paused) {
                wasMusicPlayingBeforeSwitch = true;
                audio.pause();
                if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                if (vinyl) vinyl.classList.remove('playing');
            } else {
                wasMusicPlayingBeforeSwitch = false;
            }
            
            // Hide music player widget on VIP Pass page
            if (playerWidget) {
                playerWidget.style.display = 'none';
            }
            
            switchView(viewPass);
            initPassState();
        });
    }

    navMediaHub.addEventListener('click', () => {
        updateHeaderNavState(navMediaHub);
        
        // Pause music if it's currently playing
        const audio = document.getElementById('ambient-audio');
        const playBtn = document.getElementById('btn-player-play');
        const vinyl = document.getElementById('vinyl-disc');
        const playerWidget = document.getElementById('music-player');
        
        if (audio && !audio.paused) {
            wasMusicPlayingBeforeSwitch = true;
            audio.pause();
            if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            if (vinyl) vinyl.classList.remove('playing');
        } else {
            wasMusicPlayingBeforeSwitch = false;
        }
        
        // Hide music player widget on files edits upload page
        if (playerWidget) {
            playerWidget.style.display = 'none';
        }
        
        switchView(viewMediaHub);
    });


    // PWA Install Button Click Handler
    if (btnInstallApp) {
        btnInstallApp.addEventListener('click', () => {
            if (!deferredPrompt) return;
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for user choice
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                btnInstallApp.classList.add('hidden');
            });
        });
    }


    // File Drag and Drop / Selection listeners
    mediaDropzone.addEventListener('click', () => {
        mediaFileInput.click();
    });

    mediaDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        mediaDropzone.classList.add('dragover');
    });

    mediaDropzone.addEventListener('dragleave', () => {
        mediaDropzone.classList.remove('dragover');
    });

    mediaDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        mediaDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleMediaFileSelection(e.dataTransfer.files[0]);
        }
    });

    mediaFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleMediaFileSelection(e.target.files[0]);
        }
    });

    btnRemovePreview.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent clicking dropzone
        resetUploadPreview();
    });

    // Toggle Media Hub creation type selection
    const mediaTypeChoices = document.getElementsByName('media-type-choice');
    const mediaUploadFileGroup = document.getElementById('media-upload-file-group');
    const mediaVideoLinkGroup = document.getElementById('media-video-link-group');
    const mediaVideoUrlInput = document.getElementById('media-video-url');

    if (mediaTypeChoices.length > 0) {
        mediaTypeChoices.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'image') {
                    mediaUploadFileGroup.classList.remove('hidden');
                    mediaVideoLinkGroup.classList.add('hidden');
                    mediaVideoUrlInput.removeAttribute('required');
                    mediaFileInput.setAttribute('required', '');
                } else {
                    mediaUploadFileGroup.classList.add('hidden');
                    mediaVideoLinkGroup.classList.remove('hidden');
                    mediaVideoUrlInput.setAttribute('required', '');
                    mediaFileInput.removeAttribute('required');
                }
            });
        });
    }

    // Media Form Submission
    mediaUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const author = mediaAuthorInput.value.trim();
        const caption = mediaCaptionInput.value.trim();
        
        // Find which creation type is selected
        const selectedTypeEl = document.querySelector('input[name="media-type-choice"]:checked');
        const creationType = selectedTypeEl ? selectedTypeEl.value : 'image';

        let fileUrl = '';
        let fileType = '';

        if (creationType === 'image') {
            if (!uploadedFileData || !selectedFileObject) {
                showToast('Please select an image file to share.');
                return;
            }
            fileType = 'image';
        } else {
            const videoUrlEl = document.getElementById('media-video-url');
            const videoUrl = videoUrlEl ? videoUrlEl.value.trim() : '';
            if (!videoUrl) {
                showToast('Please paste a video URL.');
                return;
            }
            fileType = 'video';
            fileUrl = videoUrl;
        }

        // Disable button during upload
        const submitBtn = mediaUploadForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Publishing Creation... <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            if (creationType === 'image') {
                submitBtn.innerHTML = 'Optimizing Image... <i class="fa-solid fa-wand-magic-sparkles"></i>';
                let fileToUpload = selectedFileObject;
                try {
                    fileToUpload = await compressImage(selectedFileObject);
                    console.log(`Original image size: ${(selectedFileObject.size / 1024).toFixed(1)}KB, Compressed: ${(fileToUpload.size / 1024).toFixed(1)}KB`);
                } catch (compressErr) {
                    console.error('Image compression failed, using original:', compressErr);
                }

                submitBtn.innerHTML = 'Uploading to Cloud... <i class="fa-solid fa-spinner fa-spin"></i>';

                // 1. Upload to Supabase Storage Bucket
                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `uploads/${fileName}`;

                const { data, error: uploadError } = await _supabase.storage
                    .from('fan-uploads')
                    .upload(filePath, fileToUpload);

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: urlData } = _supabase.storage
                    .from('fan-uploads')
                    .getPublicUrl(filePath);
                
                fileUrl = urlData.publicUrl;
            }

            // 3. Save entry to Supabase media database table
            const { error: dbError } = await _supabase
                .from('media')
                .insert([{
                    author: author,
                    caption: caption,
                    file_url: fileUrl,
                    file_type: fileType
                }]);

            if (dbError) throw dbError;

            // Sync user session nickname
            if (!currentUser.sender) {
                currentUser.sender = author;
                sessionStorage.setItem('capsule_user', JSON.stringify(currentUser));
                senderNicknameInput.value = author;
                badgeSender.textContent = author;
            }

            // Reset Form
            mediaCaptionInput.value = '';
            const videoUrlElForReset = document.getElementById('media-video-url');
            if (videoUrlElForReset) videoUrlElForReset.value = '';
            resetUploadPreview();
            showToast('Creation shared successfully!');
            
            // Reload Grid
            loadedMedia = null;
            visibleMediaCount = mediaPerPage;
            await renderMediaShowcase(true);

            // Trigger the Share on X popup for media edits after 1.5 seconds so they can see the success toast first!
            setTimeout(() => {
                openShareXModal('media');
            }, 1500);
        } catch (error) {
            console.error('Upload failed:', error);
            showToast('Upload failed! Please check your connection or database limits.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    // Quiz restart button listener
    btnQuizRestart.addEventListener('click', () => {
        initQuizState();
    });

    // Share Modal close buttons
    btnShareXClose.addEventListener('click', () => {
        shareXModal.classList.remove('active');
    });

    shareXModal.addEventListener('click', (e) => {
        if (e.target === shareXModal) {
            shareXModal.classList.remove('active');
        }
    });

    // Pagination "Load More" click listeners
    const btnLoadMoreLetters = document.getElementById('btn-load-more-letters');
    if (btnLoadMoreLetters) {
        btnLoadMoreLetters.addEventListener('click', () => {
            showToast('Loading more Polaroids...');
            visibleLettersCount += lettersPerPage;
            renderPolaroidGallery(false);
        });
    }

    const btnLoadMoreMedia = document.getElementById('btn-load-more-media');
    if (btnLoadMoreMedia) {
        btnLoadMoreMedia.addEventListener('click', () => {
            showToast('Loading more creations...');
            visibleMediaCount += mediaPerPage;
            renderMediaShowcase(false);
        });
    }
    // Switch to Card Generator
    if (navCardGenerator) {
        navCardGenerator.addEventListener('click', () => {
            updateHeaderNavState(navCardGenerator);
            
            // Pause music if it's currently playing inside the Membership section
            const audio = document.getElementById('ambient-audio');
            const playBtn = document.getElementById('btn-player-play');
            const vinyl = document.getElementById('vinyl-disc');
            const playerWidget = document.getElementById('music-player');
            
            if (audio && !audio.paused) {
                wasMusicPlayingBeforeSwitch = true;
                audio.pause();
                if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                if (vinyl) vinyl.classList.remove('playing');
            } else {
                wasMusicPlayingBeforeSwitch = false;
            }
            
            // Hide music player widget on Card Generator page
            if (playerWidget) {
                playerWidget.style.display = 'none';
            }
            
            switchView(viewCardGenerator);
        });
    }

    // Tab buttons control panel (Bottom-Drawer Studio navigation)
    const toolbarTabBtns = document.querySelectorAll('.toolbar-tab-btn');
    toolbarTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toolbarTabBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const targetTab = e.currentTarget.dataset.tab;
            
            document.querySelectorAll('.card-panel-content').forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(`panel-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // Custom text value keyup
    if (memberNicknameInput) {
        memberNicknameInput.addEventListener('input', () => {
            cardValName.textContent = memberNicknameInput.value.trim() || '';
        });
    }

    if (memberDateInput) {
        memberDateInput.addEventListener('input', () => {
            cardValDate.textContent = memberDateInput.value || '';
        });
    }

    // Bias Member Selector radios
    const biasChoices = document.querySelectorAll('input[name="bias-choice"]');
    biasChoices.forEach(radio => {
        radio.addEventListener('change', updateCardBiasSignature);
    });

    // Ink choice radios
    const inkChoices = document.querySelectorAll('input[name="ink-choice"]');
    inkChoices.forEach(radio => {
        radio.addEventListener('change', () => {
            cardBiasSignature.className = 'ink-' + radio.value;
        });
    });

    // Card Shapes toggle
    const shapeBtns = document.querySelectorAll('.btn-shape-toggle');
    shapeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            shapeBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeCardShape = e.currentTarget.dataset.shape;
            
            membershipCard.classList.remove('shape-rectangle', 'shape-square', 'shape-venom');
            membershipCard.classList.add('shape-' + activeCardShape);
        });
    });

    // Card Frame toggle
    const frameBtns = document.querySelectorAll('.btn-frame-toggle');
    frameBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            frameBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeHolderFrame = e.currentTarget.dataset.frame;
            
            membershipCard.classList.remove('frame-bunny', 'frame-kitty', 'frame-cloud');
            if (activeHolderFrame !== 'none') {
                membershipCard.classList.add('frame-' + activeHolderFrame);
            }
        });
    });

    // Finishes toggle
    const finishBtns = document.querySelectorAll('.btn-finish-toggle');
    finishBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            finishBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeCardFinish = e.currentTarget.dataset.finish;
            
            membershipCard.classList.remove('finish-matte', 'finish-glossy', 'finish-glitter', 'finish-holo');
            membershipCard.classList.add('finish-' + activeCardFinish);
        });
    });

    // Patterns toggle
    const patternBtns = document.querySelectorAll('.btn-pattern-toggle');
    patternBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            patternBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeCardPattern = e.currentTarget.dataset.pattern;
            
            membershipCard.classList.remove('pattern-solid', 'pattern-plaid', 'pattern-dots', 'pattern-checker', 'pattern-hearts', 'pattern-ruled');
            membershipCard.classList.add('pattern-' + activeCardPattern);
        });
    });

    // Colors Pickers
    if (colorBgPicker) {
        colorBgPicker.addEventListener('input', () => {
            membershipCard.style.backgroundColor = colorBgPicker.value;
        });
    }
    if (colorBorderPicker) {
        colorBorderPicker.addEventListener('input', () => {
            membershipCard.style.borderColor = colorBorderPicker.value;
        });
    }
    if (colorLinesPicker) {
        colorLinesPicker.addEventListener('input', () => {
            // Update neon labels, colons, highlights, custom tags, and barcodes
            document.querySelectorAll('.card-bp-logo, .card-blink-sub, .card-label, .card-colon, .card-tagline .font-handwritten').forEach(el => {
                el.style.color = colorLinesPicker.value;
            });
            document.querySelectorAll('.card-underline, .card-barcode-badge').forEach(el => {
                el.style.backgroundColor = colorLinesPicker.value;
            });
            // Update SVG lines neon pink stroke attributes
            document.querySelectorAll('.neon-svg path, .neon-svg line, .neon-svg rect, .neon-svg circle').forEach(el => {
                el.setAttribute('stroke', colorLinesPicker.value);
                if (el.tagName.toLowerCase() !== 'path' && el.tagName.toLowerCase() !== 'line') {
                    el.setAttribute('fill', colorLinesPicker.value);
                }
            });
        });
    }
    if (colorTextPicker) {
        colorTextPicker.addEventListener('input', () => {
            membershipCard.style.color = colorTextPicker.value;
            // Kept values, fan-club subheader, and taglines crisp white as in official K-pop design
        });
    }

    // Font family selection
    const fontBtns = document.querySelectorAll('.btn-font-toggle');
    fontBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            fontBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeCardFont = e.currentTarget.dataset.font;
            
            membershipCard.classList.remove('font-sans', 'font-serif', 'font-handwritten');
            membershipCard.classList.add('font-' + activeCardFont);
        });
    });

    // Sticker category switch
    const trayCatBtns = document.querySelectorAll('.btn-tray-cat');
    trayCatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            trayCatBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderStickerTray(e.currentTarget.dataset.cat);
        });
    });

    // Custom file upload sticker button
    if (btnUploadCustomSticker) {
        btnUploadCustomSticker.addEventListener('click', () => {
            customStickerInput.click();
        });
    }
    if (customStickerInput) {
        customStickerInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    SYSTEM_STICKERS.myphotos.unshift(event.target.result);
                    renderStickerTray('myphotos');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Card Actions
    if (btnDownloadCard) {
        btnDownloadCard.addEventListener('click', downloadCardImage);
    }
    if (btnShareCard) {
        btnShareCard.addEventListener('click', shareCardImage);
    }

    // 3D Parallax Tilt listeners disabled for static flat aesthetic
    /*
    if (cardCanvasWrapper) {
        cardCanvasWrapper.addEventListener('mousemove', handleCardParallaxTilt);
        cardCanvasWrapper.addEventListener('mouseleave', resetCardParallaxTilt);
    }
    */

    // Placed stickers dragging window-level event handlers
    window.addEventListener('mousemove', handleStickerInteractionMove);
    window.addEventListener('touchmove', handleStickerInteractionMove, { passive: false });
    window.addEventListener('mouseup', endStickerInteraction);
    window.addEventListener('touchend', endStickerInteraction);

}

// ==========================================================================
// 10-Question Personality Quiz Questions & Choices mapping
// ==========================================================================
const QUIZ_QUESTIONS = [
    {
        title: "1. What is your ideal weekend activity?",
        choices: [
            { text: "Exploring a cute bookshop or neighborhood cafe", member: "jisoo" },
            { text: "Attending a fashion event or shopping downtown", member: "jennie" },
            { text: "Strumming a guitar, singing, or painting at home", member: "rose" },
            { text: "Learning a new dance choreography or playing arcade games", member: "lisa" }
        ]
    },
    {
        title: "2. Pick your favorite fashion aesthetic:",
        choices: [
            { text: "Classic, elegant, and preppy", member: "jisoo" },
            { text: "Sleek, streetwear, and high-fashion luxury", member: "jennie" },
            { text: "Bohemian, cozy knitwear, and vintage flowy pieces", member: "rose" },
            { text: "Edgy, colorful, and bold accessories", member: "lisa" }
        ]
    },
    {
        title: "3. Choose your dream pet companion:",
        choices: [
            { text: "A cute, loyal puppy (like Dalgom!)", member: "jisoo" },
            { text: "A sweet, fluffy cat that loves to cuddle", member: "jennie" },
            { text: "A tiny aquarium fish or a sweet bird", member: "rose" },
            { text: "A high-energy, playful puppy (like Love!)", member: "lisa" }
        ]
    },
    {
        title: "4. What is your typical role in a friend group?",
        choices: [
            { text: "The funny older sibling who cracks jokes and keeps peace", member: "jisoo" },
            { text: "The trendsetter who coordinates the best places to go", member: "jennie" },
            { text: "The emotional supporter who gives the warmest hugs", member: "rose" },
            { text: "The active mood-maker who brings endless energy", member: "lisa" }
        ]
    },
    {
        title: "5. Select your favorite treat or beverage:",
        choices: [
            { text: "Sweet iced tea or a local fruit juice", member: "jisoo" },
            { text: "A classic Iced Americano to stay sharp", member: "jennie" },
            { text: "A warm, frothy vanilla latte or chamomile tea", member: "rose" },
            { text: "A sweet strawberry milkshake or mango smoothie", member: "lisa" }
        ]
    },
    {
        title: "6. What kind of music playlist do you listen to most?",
        choices: [
            { text: "Classic retro pop and easy-listening acoustic tunes", member: "jisoo" },
            { text: "Hip-hop, R&B, and modern synth beats", member: "jennie" },
            { text: "Indie folk, acoustic guitar ballads, and soft soundtracks", member: "rose" },
            { text: "High-energy dance pop, club hits, and global party tracks", member: "lisa" }
        ]
    },
    {
        title: "7. Pick your dream vacation destination:",
        choices: [
            { text: "Tokyo, Japan (cherry blossoms, old temples, and ramen)", member: "jisoo" },
            { text: "Paris, France (art galleries, cafes, and fashion houses)", member: "jennie" },
            { text: "London, UK (cozy parks, rainy streets, and musicals)", member: "rose" },
            { text: "Hawaii, USA (surfing, hiking, and tropical beaches)", member: "lisa" }
        ]
    },
    {
        title: "8. Choose your signature color palette:",
        choices: [
            { text: "Soft lavender and pastel sky blue", member: "jisoo" },
            { text: "Sleek charcoal black and pearl white", member: "jennie" },
            { text: "Warm rose gold and champagne pink", member: "rose" },
            { text: "Neon pink, bright yellow, and bold lime green", member: "lisa" }
        ]
    },
    {
        title: "9. How do you usually handle stress or pressure?",
        choices: [
            { text: "Stay calm, think logically, and crack a joke to ease the air", member: "jisoo" },
            { text: "Take immediate control, solve it, and keep a cool head", member: "jennie" },
            { text: "Let my emotions out, write, or listen to comfort music", member: "rose" },
            { text: "Stay positive, call my friends, and laugh it off", member: "lisa" }
        ]
    },
    {
        title: "10. Which stage performance vibe matches you best?",
        choices: [
            { text: "Stable, beautiful vocals on a stage filled with flowers", member: "jisoo" },
            { text: "A charismatic, powerful solo rap session in a chic outfit", member: "jennie" },
            { text: "Strumming an acoustic guitar under a single warm spotlight", member: "rose" },
            { text: "A high-energy, fast-paced dance break with laser lights", member: "lisa" }
        ]
    }
];

// Quiz state tracking
let quizCurrentIndex = 0;
let quizScores = { jisoo: 0, jennie: 0, rose: 0, lisa: 0 };

// Initialize or reset the quiz state
function initQuizState() {
    quizCurrentIndex = 0;
    quizScores = { jisoo: 0, jennie: 0, rose: 0, lisa: 0 };
    
    quizResultCard.classList.add('hidden');
    quizActiveCard.classList.remove('hidden');
    
    renderQuizQuestion();
}

// Render the active question in the DOM
function renderQuizQuestion() {
    const question = QUIZ_QUESTIONS[quizCurrentIndex];
    
    // Update progress bar
    quizQuestionNum.textContent = quizCurrentIndex + 1;
    const progressPercent = Math.round(((quizCurrentIndex + 1) / QUIZ_QUESTIONS.length) * 100);
    quizProgressText.textContent = `${progressPercent}%`;
    quizProgressFill.style.width = `${progressPercent}%`;
    
    // Update question text
    quizQuestionTitle.textContent = question.title;
    
    // Clear and build options buttons
    quizOptionsContainer.innerHTML = '';
    question.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `
            <span>${choice.text}</span>
            <i class="fa-solid fa-angle-right" style="font-size: 0.85rem; opacity: 0.6;"></i>
        `;
        
        btn.addEventListener('click', () => {
            // Add score
            quizScores[choice.member]++;
            
            // Move to next question or show result
            if (quizCurrentIndex < QUIZ_QUESTIONS.length - 1) {
                quizCurrentIndex++;
                renderQuizQuestion();
            } else {
                showQuizResult();
            }
        });
        
        quizOptionsContainer.appendChild(btn);
    });
}

// Display the computed personality result card
function showQuizResult() {
    quizActiveCard.classList.add('hidden');
    quizResultCard.classList.remove('hidden');
    
    // Determine winner (highest score)
    let winner = 'jisoo';
    let maxScore = -1;
    
    // Deterministic tie-breaker check in order: jennie -> jisoo -> rose -> lisa
    const members = ['jennie', 'jisoo', 'rose', 'lisa'];
    members.forEach(member => {
        if (quizScores[member] > maxScore) {
            maxScore = quizScores[member];
            winner = member;
        }
    });
    
    // Member profiles
    const profiles = {
        jisoo: {
            name: "🐰 JISOO",
            desc: "You are Jisoo! You are the stable, caring, and funny pillar of your group. You love classic aesthetics, books, and cafe-hopping. You show your affection through small gestures, have a great sense of humor (and dad jokes!), and keep a calm, positive head when things get tough.",
            img: "quiz_jisoo.jpg"
        },
        jennie: {
            name: "🐻 JENNIE",
            desc: "You are Jennie! You are charismatic, stylish, and a true trendsetter. While you might seem cool and confident on the outside, you are incredibly sweet, soft-hearted, and protective of the people you love. You appreciate luxury, streetwear fashion, and coffee shops.",
            img: "quiz_jennie.jpg"
        },
        rose: {
            name: "🐿️ ROSÉ",
            desc: "You are Rosé! You are deep, emotional, and artistic. You express yourself through music, art, and comfort writing. You have a warm, gentle soul, give the best hugs, and feel things deeply. You love vintage aesthetics, cozy sweaters, and acoustic playlists.",
            img: "quiz_rose.jpg"
        },
        lisa: {
            name: "🐥 LISA",
            desc: "You are Lisa! You are the energetic, fun-loving mood-maker. Your bright personality fills the room with positive vibes, and you love learning new skills (like dancing!). You are brave, optimistic, and always stay young at heart, bringing high-energy and laughter to your friends.",
            img: "quiz_lisa.jpg"
        }
    };
    
    const result = profiles[winner];
    quizResultName.textContent = result.name;
    quizResultDesc.textContent = result.desc;
    
    // Load result picture, fallback to placeholder if error/not uploaded
    quizResultImg.src = result.img;
    quizResultImg.onerror = () => {
        quizResultImg.classList.add('hidden');
        quizResultPlaceholder.classList.remove('hidden');
    };
    quizResultImg.onload = () => {
        quizResultImg.classList.remove('hidden');
        quizResultPlaceholder.classList.add('hidden');
    };
}

// Opens the Share on X Viral Modal
function openShareXModal(type = 'letter') {
    shareXModal.classList.add('active');
    
    // Set up X sharing link handler
    const btnSharePost = document.getElementById('btn-share-x-post');
    
    // Unbind any previous click handlers to prevent duplicates
    const newBtn = btnSharePost.cloneNode(true);
    btnSharePost.parentNode.replaceChild(newBtn, btnSharePost);
    
    newBtn.addEventListener('click', () => {
        let text = "";
        if (type === 'letter') {
            text = "hey, I've sealed my letters for BLACKPINK in the DearBlackpink Capsule, did you do yours?🖤💗";
        } else {
            text = "hey, I've shared my custom K-pop edits in the DearBlackpink Fan Media Showcase! check it out!🖤💗";
        }
        
        const websiteUrl = "https://dearblackpink.vercel.app";
        const fullShareText = `${text} ${websiteUrl}`;
        
        // Detect if loaded inside X (Twitter) in-app browser
        const isTwitterApp = /Twitter|TwitterAndroid|Twitter for iPhone/i.test(navigator.userAgent);
        
        if (isTwitterApp) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(fullShareText)
                    .then(() => {
                        showToast("X App detected! Link copied. Close browser and paste in a new post! 🖤💗");
                    })
                    .catch(err => {
                        console.warn("Clipboard copy failed:", err);
                    });
            }
            shareXModal.classList.remove('active');
            return;
        }
        
        // Copy to clipboard as a fallback so they can paste it if deep linking fails
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullShareText)
                .then(() => {
                    showToast("Text copied to clipboard! Redirecting to X...");
                })
                .catch(err => {
                    console.warn("Clipboard copy failed:", err);
                });
        }
        
        const twitterIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(websiteUrl)}`;
        
        // Detect mobile user agent
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        // Wait 800ms for user to read the toast, then redirect/open window
        setTimeout(() => {
            if (isMobile) {
                window.location.href = twitterIntentUrl;
            } else {
                window.open(twitterIntentUrl, '_blank');
            }
            shareXModal.classList.remove('active');
        }, 800);
    });
}



// Save letter helper
async function saveLetter(letter) {
    // Add to active local cache memory immediately for instant update
    if (loadedLetters) {
        loadedLetters.unshift({
            id: letter.id,
            from: letter.from,
            to: letter.to,
            message: letter.message,
            sticker: letter.sticker,
            timestamp: letter.timestamp
        });
    }

    // Save to database in background
    try {
        const { error } = await _supabase
            .from('letters')
            .insert([{
                sender: letter.from,
                recipient: letter.to,
                message: letter.message,
                sticker: letter.sticker,
                created_at: new Date(letter.timestamp).toISOString()
            }]);

        if (error) throw error;
        
        // Also save a fallback local copy
        const letters = JSON.parse(localStorage.getItem('polaroid_capsule_letters')) || [];
        letters.unshift(letter);
        localStorage.setItem('polaroid_capsule_letters', JSON.stringify(letters));
    } catch (err) {
        console.error('Error saving letter:', err);
        // Fallback save to local storage only
        const letters = JSON.parse(localStorage.getItem('polaroid_capsule_letters')) || [];
        letters.unshift(letter);
        localStorage.setItem('polaroid_capsule_letters', JSON.stringify(letters));
    }

    // Refresh letters progress bar counts
    fetchGlobalLettersCount();
}

// Display customized toast notification
function showToast(message) {
    toastMessage.textContent = message;
    toastNotification.classList.add('active');
    setTimeout(() => {
        toastNotification.classList.remove('active');
    }, 3000);
}

// Countdown Clock Tracker logic
function startCountdownTracker() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const updateTimer = () => {
        const now = new Date();
        const difference = TARGET_DATE - now;

        if (difference <= 0) {
            clearInterval(countdownInterval);
            cdDays.textContent = '00';
            cdHours.textContent = '00';
            cdMinutes.textContent = '00';
            cdSeconds.textContent = '00';
            
            // Vault is unlocked! If we are on countdown page, transition automatically
            if (viewCountdown.classList.contains('active')) {
                showToast('The Time Capsule is opening!');
                setTimeout(() => {
                    switchView(viewGallery);
                    renderPolaroidGallery();
                }, 1500);
            }
            return;
        }

        // Calculation of units
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Format UI
        cdDays.textContent = String(days).padStart(2, '0');
        cdHours.textContent = String(hours).padStart(2, '0');
        cdMinutes.textContent = String(minutes).padStart(2, '0');
        cdSeconds.textContent = String(seconds).padStart(2, '0');
    };

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

// Render Polaroid gallery
async function renderPolaroidGallery(forceFetch = false) {
    if (isVaultUnlocked()) {
        if (galleryWriteNew) galleryWriteNew.classList.add('hidden');
    } else {
        if (galleryWriteNew) galleryWriteNew.classList.remove('hidden');
    }

    let customLetters = [];
    
    if (forceFetch || !loadedLetters) {
        polaroidGrid.innerHTML = '<div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 40px; font-weight: 600; color: var(--color-text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Retrieving letters from vault...</div>';
        try {
            const { data, error } = await _supabase
                .from('letters')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            loadedLetters = data.map(item => ({
                id: item.id.toString(),
                from: item.sender,
                to: item.recipient,
                message: item.message,
                sticker: item.sticker,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (e) {
            console.error('Supabase fetch letters failed, falling back to local:', e);
            loadedLetters = JSON.parse(localStorage.getItem('polaroid_capsule_letters')) || [];
        }
    }

    customLetters = loadedLetters;
    const allLetters = [...customLetters, ...SEED_LETTERS];
    
    // Get active filter
    const activeFilterEl = document.querySelector('.btn-filter.active');
    const activeFilter = activeFilterEl ? activeFilterEl.dataset.filter : 'all';
    
    // Get search term
    const query = gallerySearch.value.trim().toLowerCase();
    
    // Filter logic
    let filtered = allLetters.filter(letter => {
        const config = parseStickerConfig(letter.sticker);
        
        // Exclude tree wishes from the Polaroid gallery
        if (config.stamp === 'wish' || letter.to === 'Tree') {
            return false;
        }

        // Search query filter
        const matchQuery = 
            letter.from.toLowerCase().includes(query) || 
            letter.to.toLowerCase().includes(query) ||
            letter.message.toLowerCase().includes(query);
            
        if (!matchQuery) return false;
        
        // Tab category filter
        if (activeFilter === 'sent-by-me') {
            return currentUser.sender && letter.from.toLowerCase() === currentUser.sender.toLowerCase();
        } else if (activeFilter === 'to-me') {
            return currentUser.sender && letter.to.toLowerCase() === currentUser.sender.toLowerCase();
        } else if (activeFilter.startsWith('member-')) {
            const targetMember = activeFilter.replace('member-', '');
            return config.member === targetMember;
        }
        
        return true;
    });

    // Update statistics badge count
    totalLettersCount.innerHTML = `<i class="fa-solid fa-images"></i> ${filtered.length} Polaroid${filtered.length === 1 ? '' : 's'} Sealed`;

    const btnLoadMoreLetters = document.getElementById('btn-load-more-letters');
    if (filtered.length > visibleLettersCount) {
        if (btnLoadMoreLetters) btnLoadMoreLetters.classList.remove('hidden');
    } else {
        if (btnLoadMoreLetters) btnLoadMoreLetters.classList.add('hidden');
    }

    let displayed = filtered.slice(0, visibleLettersCount);

    if (displayed.length === 0) {
        galleryEmpty.classList.remove('hidden');
        polaroidGrid.style.display = 'none';
        if (btnLoadMoreLetters) btnLoadMoreLetters.classList.add('hidden');
        return;
    }

    galleryEmpty.classList.add('hidden');
    polaroidGrid.style.display = 'grid';
    polaroidGrid.innerHTML = '';

    // Populate Polaroids
    displayed.forEach(letter => {
        const config = parseStickerConfig(letter.sticker);
        
        const polaroidCard = document.createElement('div');
        polaroidCard.className = `polaroid skin-${config.skin}`;
        
        // Random slight rotation to create realistic physical layout
        // Generating deterministic seed rotation based on ID to avoid fluttering on redraw
        const rotationAngle = getRotationForId(letter.id);
        polaroidCard.style.transform = `rotate(${rotationAngle}deg)`;

        // Icon for sticker
        const stickerIconClass = getStickerClass(config.stamp);

        // Member tag label
        let memberTagHtml = '';
        if (config.member && config.member !== 'all') {
            const memberLabels = {
                jisoo: '🐰 JISOO',
                jennie: '🐻 JENNIE',
                rose: '🐿️ ROSÉ',
                lisa: '🐥 LISA',
                blink: '🖤💗 BLINK'
            };
            const label = memberLabels[config.member] || config.member.toUpperCase();
            memberTagHtml = `<div class="polaroid-member-tag">${label}</div>`;
        }

        // Deletion authority check
        const isAuthorMe = currentUser.sender && letter.from.toLowerCase() === currentUser.sender.toLowerCase();
        const isSeedItem = letter.id.startsWith('seed-');
        const isAdmin = localStorage.getItem('capsule_simulated_bypass') === 'true';
        const showDeleteBtn = (isAuthorMe || isAdmin) && !isSeedItem;

        let deleteBtnHtml = '';
        if (showDeleteBtn) {
            deleteBtnHtml = `<button class="btn-delete-letter" data-id="${letter.id}" title="Delete letter"><i class="fa-regular fa-trash-can"></i></button>`;
        }

        polaroidCard.innerHTML = `
            <div class="polaroid-photo">
                ${memberTagHtml}
                <div class="polaroid-sticker-icon ${stickerIconClass.colorClass}">
                    <i class="${stickerIconClass.iconClass}"></i>
                </div>
                <div class="polaroid-text">${escapeHTML(letter.message)}</div>
            </div>
            <div class="polaroid-caption" style="position: relative;">
                ${deleteBtnHtml}
                <span class="polaroid-to">To: ${escapeHTML(letter.to)}</span>
                <span class="polaroid-from">From: ${escapeHTML(letter.from)}</span>
            </div>
        `;

        // Click event to view full details in modal
        polaroidCard.addEventListener('click', () => {
            openModal(letter);
        });

        if (showDeleteBtn) {
            const delBtn = polaroidCard.querySelector('.btn-delete-letter');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening modal
                deleteLetterItem(letter.id);
            });
        }

        polaroidGrid.appendChild(polaroidCard);
    });
}

// Generate rotation angles based on letter ID for consistent display rotation
function getRotationForId(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const angleRange = 5; // -2.5deg to 2.5deg
    const angle = ((Math.abs(hash) % 100) / 100) * angleRange - (angleRange / 2);
    return Number(angle.toFixed(1));
}

// Helper to escape HTML characters
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

// Client-side image compressor before upload
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.6) {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.FileReader || !window.HTMLCanvasElement) {
            return resolve(file);
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                try {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        if (width > height) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return resolve(file);
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', quality);
                } catch (e) {
                    console.error('Image compression error, uploading original:', e);
                    resolve(file);
                }
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

// Get correct icon class for stamps
function getStickerClass(stickerName) {
    switch (stickerName) {
        case 'heart':
            return { iconClass: 'fa-solid fa-heart', colorClass: 'sticker-heart-val' };
        case 'sparkle':
            return { iconClass: 'fa-solid fa-wand-magic-sparkles', colorClass: 'sticker-sparkle-val' };
        case 'star':
            return { iconClass: 'fa-solid fa-star', colorClass: 'sticker-star-val' };
        case 'flower':
            return { iconClass: 'fa-solid fa-seedling', colorClass: 'sticker-flower-val' };
        case 'smile':
            return { iconClass: 'fa-regular fa-face-smile-beam', colorClass: 'sticker-smile-val' };
        default:
            return { iconClass: 'fa-solid fa-heart', colorClass: 'sticker-heart-val' };
    }
}

// Modal open logic
function openModal(letter) {
    modalPolaroidText.textContent = letter.message;
    modalToName.textContent = letter.to;
    modalFromName.textContent = letter.from;
    
    const config = parseStickerConfig(letter.sticker);

    // Apply photocard skin to modal card
    const modalPolaroidCard = polaroidModal.querySelector('.polaroid-zoomed');
    if (modalPolaroidCard) {
        modalPolaroidCard.className = `polaroid-zoomed skin-${config.skin}`;
    }

    // Set sticker in modal
    const stickerIconClass = getStickerClass(config.stamp);
    modalPolaroidStamp.innerHTML = `<i class="${stickerIconClass.iconClass}"></i>`;
    modalPolaroidStamp.className = `polaroid-stamp ${stickerIconClass.colorClass}`;

    // Apply member dedication tag overlay inside modal photo area if not 'all'
    const modalPhotoArea = polaroidModal.querySelector('.polaroid-photo-area');
    let modalMemberBadge = modalPhotoArea.querySelector('.polaroid-member-tag');
    if (modalMemberBadge) {
        modalMemberBadge.remove();
    }
    if (config.member && config.member !== 'all') {
        const memberLabels = {
            jisoo: '🐰 JISOO',
            jennie: '🐻 JENNIE',
            rose: '🐿️ ROSÉ',
            lisa: '🐥 LISA',
            blink: '🖤💗 BLINK'
        };
        const label = memberLabels[config.member] || config.member.toUpperCase();
        
        modalMemberBadge = document.createElement('div');
        modalMemberBadge.className = 'polaroid-member-tag';
        modalMemberBadge.textContent = label;
        modalPhotoArea.appendChild(modalMemberBadge);
    }

    // Handle delete button in Zoom Modal for admins/authors
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    if (modalDeleteBtn) {
        modalDeleteBtn.dataset.letterId = letter.id;
        const isAuthorMe = currentUser.sender && letter.from.toLowerCase() === currentUser.sender.toLowerCase();
        const isSeedItem = letter.id.startsWith('seed-');
        const isAdmin = localStorage.getItem('capsule_simulated_bypass') === 'true';
        if ((isAuthorMe || isAdmin) && !isSeedItem) {
            modalDeleteBtn.classList.remove('hidden');
        } else {
            modalDeleteBtn.classList.add('hidden');
        }
    }
    
    // Formatted date string
    const date = new Date(letter.timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    modalPolaroidDate.textContent = date.toLocaleDateString('en-US', options);

    polaroidModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scrolling
}

// Modal close logic
function closeModal() {
    polaroidModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Admin Modal Logic
function openAdminModal() {
    adminPasscodeInput.value = '';
    adminPasscodeInput.type = 'password';
    togglePasswordVisibility.innerHTML = '<i class="fa-regular fa-eye"></i>';
    passcodeErrorMsg.style.opacity = '0';
    passcodeCardContent.classList.remove('shake');
    adminPasscodeModal.classList.add('active');
    setTimeout(() => adminPasscodeInput.focus(), 150);
}

function closeAdminModal() {
    adminPasscodeModal.classList.remove('active');
}

// Media Hub Upload & Rendering Helpers
function handleMediaFileSelection(file) {
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB limit
    if (file.size > maxSizeBytes) {
        showToast('File is too large! Maximum allowed size is 50MB.');
        resetUploadPreview();
        return;
    }

    uploadedFileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

    if (!uploadedFileType) {
        showToast('Invalid file format! Please select a photo or video file.');
        resetUploadPreview();
        return;
    }

    // Keep reference to the actual File object to upload to Supabase Storage
    selectedFileObject = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedFileData = e.target.result;
        renderUploadPreview(uploadedFileData, uploadedFileType);
    };
    reader.readAsDataURL(file);
}

function renderUploadPreview(dataUrl, type) {
    const previousMedia = dropzonePreview.querySelector('img, video');
    if (previousMedia) {
        previousMedia.remove();
    }

    let mediaEl;
    if (type === 'image') {
        mediaEl = document.createElement('img');
        mediaEl.src = dataUrl;
    } else {
        mediaEl = document.createElement('video');
        mediaEl.src = dataUrl;
        mediaEl.controls = true;
        mediaEl.muted = true;
    }

    dropzonePreview.insertBefore(mediaEl, btnRemovePreview);
    dropzonePrompt.classList.add('hidden');
    dropzonePreview.classList.remove('hidden');
}

function resetUploadPreview() {
    mediaFileInput.value = '';
    uploadedFileData = null;
    uploadedFileType = null;
    selectedFileObject = null;
    
    const previousMedia = dropzonePreview.querySelector('img, video');
    if (previousMedia) {
        previousMedia.remove();
    }
    
    dropzonePreview.classList.add('hidden');
    dropzonePrompt.classList.remove('hidden');
}

function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function renderMediaShowcase(forceFetch = false) {
    let customMedia = [];
    
    if (forceFetch || !loadedMedia) {
        mediaGrid.innerHTML = '<div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 40px; font-weight: 600; color: var(--color-text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading shared edits...</div>';
        try {
            const { data, error } = await _supabase
                .from('media')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            loadedMedia = data.map(item => ({
                id: item.id.toString(),
                author: item.author,
                caption: item.caption,
                fileData: item.file_url,
                fileType: item.file_type,
                timestamp: new Date(item.created_at).getTime()
            }));
            console.log('Successfully mapped loadedMedia! Count:', loadedMedia.length);
        } catch (e) {
            console.error('Supabase fetch media failed, falling back to local:', e);
            loadedMedia = JSON.parse(localStorage.getItem('polaroid_capsule_media')) || [];
        }
    }

    customMedia = loadedMedia;
    const allMedia = [...customMedia, ...SEED_MEDIA];

    totalMediaCount.innerHTML = `<i class="fa-solid fa-photo-film"></i> ${allMedia.length} Creation${allMedia.length === 1 ? '' : 's'} Shared`;

    const btnLoadMoreMedia = document.getElementById('btn-load-more-media');
    if (allMedia.length > visibleMediaCount) {
        if (btnLoadMoreMedia) btnLoadMoreMedia.classList.remove('hidden');
    } else {
        if (btnLoadMoreMedia) btnLoadMoreMedia.classList.add('hidden');
    }

    let displayed = allMedia.slice(0, visibleMediaCount);

    if (displayed.length === 0) {
        mediaEmpty.classList.remove('hidden');
        mediaGrid.style.display = 'none';
        if (btnLoadMoreMedia) btnLoadMoreMedia.classList.add('hidden');
        return;
    }

    mediaEmpty.classList.add('hidden');
    mediaGrid.style.display = 'grid';
    mediaGrid.innerHTML = '';

    displayed.forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';

        let mediaTag = '';
        if (item.fileType === 'image') {
            mediaTag = `<img src="${item.fileData}" alt="${escapeHTML(item.caption)}">`;
        } else {
            const ytId = getYouTubeId(item.fileData);
            if (ytId) {
                mediaTag = `<iframe src="https://www.youtube.com/embed/${ytId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; border:none;"></iframe>`;
            } else {
                // For TikTok/Instagram/others, show a beautiful clickable preview card
                let platform = 'Video';
                let icon = 'fa-solid fa-play';
                if (item.fileData.includes('tiktok.com')) {
                    platform = 'TikTok';
                    icon = 'fa-brands fa-tiktok';
                } else if (item.fileData.includes('instagram.com')) {
                    platform = 'Instagram';
                    icon = 'fa-brands fa-instagram';
                }
                
                mediaTag = `
                    <a href="${item.fileData}" target="_blank" rel="noopener noreferrer" class="external-video-link-preview" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#1C1819; color:#FFF0F2; text-decoration:none; gap:12px;">
                        <div class="video-badge"><i class="fa-solid fa-square-arrow-up-right"></i> External</div>
                        <div class="platform-icon-circle" style="width:56px; height:56px; border-radius:50%; background:var(--color-primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:white;">
                            <i class="${icon}"></i>
                        </div>
                        <span style="font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Play on ${platform}</span>
                    </a>
                `;
            }
        }

        const isAuthorMe = currentUser.sender && item.author.toLowerCase() === currentUser.sender.toLowerCase();
        const isAdmin = localStorage.getItem('capsule_simulated_bypass') === 'true';
        // Check if it is a custom database item (numeric string ids or uuid) vs seed item (seed-media-X)
        const isSeedItem = item.id.startsWith('seed-media-');
        const showDeleteBtn = (isAuthorMe || isAdmin) && !isSeedItem; 
        
        let deleteBtnHtml = '';
        if (showDeleteBtn) {
            deleteBtnHtml = `<button class="btn-delete-media" data-id="${item.id}" title="Delete creation"><i class="fa-regular fa-trash-can"></i></button>`;
        }

        const date = new Date(item.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        card.innerHTML = `
            <div class="media-viewport">
                ${mediaTag}
            </div>
            <div class="media-card-info">
                ${deleteBtnHtml}
                <div class="media-card-caption">${escapeHTML(item.caption)}</div>
                <div class="media-card-meta">
                    <span class="media-card-author">By: ${escapeHTML(item.author)}</span>
                    <span class="media-card-date">${dateStr}</span>
                </div>
            </div>
        `;

        if (showDeleteBtn) {
            const delBtn = card.querySelector('.btn-delete-media');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMediaItem(item.id);
            });
        }

        mediaGrid.appendChild(card);
    });
}

// Promise-based custom confirmation dialog
function showCustomConfirm(message, confirmText = "Delete") {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const okBtn = document.getElementById('confirm-ok-btn');
        
        msgEl.textContent = message;
        okBtn.textContent = confirmText;
        
        modal.classList.add('active');
        
        function cleanup(result) {
            modal.classList.remove('active');
            cancelBtn.removeEventListener('click', onCancel);
            okBtn.removeEventListener('click', onOk);
            resolve(result);
        }
        
        function onCancel() { cleanup(false); }
        function onOk() { cleanup(true); }
        
        cancelBtn.addEventListener('click', onCancel);
        okBtn.addEventListener('click', onOk);
    });
}

async function deleteMediaItem(id) {
    // 1. Instantly remove from local cached memory and re-render grid
    if (loadedMedia) {
        loadedMedia = loadedMedia.filter(item => item.id !== id);
    }
    renderMediaShowcase(false); // fast re-render!
    
    // 2. Perform background delete query to database
    try {
        const { error } = await _supabase
            .from('media')
            .delete()
            .eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error('Failed to delete from database:', e);
    }

    // 3. Sync local fallback copy in parallel
    let mediaList = JSON.parse(localStorage.getItem('polaroid_capsule_media')) || [];
    mediaList = mediaList.filter(item => item.id !== id);
    localStorage.setItem('polaroid_capsule_media', JSON.stringify(mediaList));
    
    showToast('Creation deleted.');
}

async function deleteLetterItem(id) {
    // 1. Instantly remove from local cached memory and re-render grid
    if (loadedLetters) {
        loadedLetters = loadedLetters.filter(item => item.id !== id);
    }
    renderPolaroidGallery(false); // fast re-render!
    
    // 2. Perform background delete query to database
    try {
        const { error } = await _supabase
            .from('letters')
            .delete()
            .eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error('Failed to delete letter from database:', e);
    }

    // 3. Sync local fallback copy in parallel
    let lettersList = JSON.parse(localStorage.getItem('polaroid_capsule_letters')) || [];
    lettersList = lettersList.filter(item => item.id !== id);
    localStorage.setItem('polaroid_capsule_letters', JSON.stringify(lettersList));
    
    showToast('Letter deleted successfully.');
    closeModal();
}

// ==========================================================================
// BLACKPINK 10th Anniversary specialized helper logic
// ==========================================================================

// Safe JSON parser for sticker column
function parseStickerConfig(stickerStr) {
    let config = { stamp: 'heart', skin: 'classic', member: 'all' };
    if (!stickerStr) return config;
    try {
        const parsed = JSON.parse(stickerStr);
        if (parsed && typeof parsed === 'object') {
            return {
                stamp: parsed.stamp || 'heart',
                skin: parsed.skin || 'classic',
                member: parsed.member || 'all'
            };
        }
    } catch (e) {
        // Fallback for string stamp values
    }
    config.stamp = stickerStr;
    return config;
}

// 1. BLACK & PINK Theme Toggle initialization
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle-btn');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('capsule_theme_v2') || 'dark';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('capsule_theme_v2', isDark ? 'dark' : 'light');
        
        if (isDark) {
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            showToast("BLACK & PINK mode activated 🖤💗");
        } else {
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            showToast("Classic light mode activated 🤍🌸");
        }
    });
}

// 2. Lo-Fi Ambient Music Player Playlist & Playback
const playlist = [
    { title: "Stay — BLACKPINK", url: "stay.mp3" }
];
let currentTrackIndex = 0;

function initAudioPlayer() {
    const audio = document.getElementById('ambient-audio');
    const playBtn = document.getElementById('btn-player-play');
    const prevBtn = document.getElementById('btn-player-prev');
    const nextBtn = document.getElementById('btn-player-next');
    const trackTitle = document.getElementById('player-track-title');
    const vinyl = document.getElementById('vinyl-disc');
    
    if (!audio || !playBtn) return;
    
    function loadTrack(index) {
        currentTrackIndex = index;
        audio.src = playlist[index].url;
        trackTitle.textContent = playlist[index].title;
    }

    // Autoplay fallback on first click/keypress/touch anywhere on the screen (only if not on Media Hub)
    function autoplayOnInteraction() {
        const isMediaHubActive = viewMediaHub.classList.contains('active');
        if (isMediaHubActive) return; // Wait until they switch to Capsule
        
        if (audio.paused) {
            (audio.play() || Promise.resolve()).then(() => {
                playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                vinyl.classList.add('playing');
                if (photoRollTrack) photoRollTrack.classList.add('playing');
                // Played successfully, remove interaction listeners
                document.removeEventListener('click', autoplayOnInteraction);
                document.removeEventListener('keydown', autoplayOnInteraction);
                document.removeEventListener('touchend', autoplayOnInteraction);
            }).catch(e => {
                console.warn("Autoplay blocked by browser until user click.", e);
            });
        } else {
            document.removeEventListener('click', autoplayOnInteraction);
            document.removeEventListener('keydown', autoplayOnInteraction);
            document.removeEventListener('touchend', autoplayOnInteraction);
        }
    }

    document.addEventListener('click', autoplayOnInteraction);
    document.addEventListener('keydown', autoplayOnInteraction);
    document.addEventListener('touchend', autoplayOnInteraction);
    
    loadTrack(0);

    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            (audio.play() || Promise.resolve()).then(() => {
                playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                vinyl.classList.add('playing');
                if (photoRollTrack) photoRollTrack.classList.add('playing');
            }).catch(e => {
                console.log("Audio play blocked by browser policy. Interaction required.");
                showToast("Click play again to start Stay song.");
            });
        } else {
            audio.pause();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            vinyl.classList.remove('playing');
            if (photoRollTrack) photoRollTrack.classList.remove('playing');
        }
    });
    
    prevBtn.addEventListener('click', () => {
        let newIndex = currentTrackIndex - 1;
        if (newIndex < 0) newIndex = playlist.length - 1;
        loadTrack(newIndex);
        (audio.play() || Promise.resolve()).then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            vinyl.classList.add('playing');
            if (photoRollTrack) photoRollTrack.classList.add('playing');
        });
    });
    
    nextBtn.addEventListener('click', () => {
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= playlist.length) newIndex = 0;
        loadTrack(newIndex);
        (audio.play() || Promise.resolve()).then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            vinyl.classList.add('playing');
            if (photoRollTrack) photoRollTrack.classList.add('playing');
        });
    });

    // Attempt to autoplay immediately on load (will work if browser MEI or settings allow it)
    (audio.play() || Promise.resolve()).then(() => {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinyl.classList.add('playing');
        if (photoRollTrack) photoRollTrack.classList.add('playing');
        // Successfully played on load, remove interaction triggers
        document.removeEventListener('click', autoplayOnInteraction);
        document.removeEventListener('keydown', autoplayOnInteraction);
        document.removeEventListener('touchend', autoplayOnInteraction);
    }).catch(e => {
        console.log("Immediate autoplay blocked by browser policy. Falling back to first interaction trigger.", e);
    });
}

// 3. Global Letters sealed count query
async function fetchGlobalLettersCount() {
    try {
        const { count, error } = await _supabase
            .from('letters')
            .select('*', { count: 'exact', head: true })
            .neq('recipient', 'Tree');
            
        if (error) throw error;
        updateLettersProgress(count);
    } catch (e) {
        console.error("Failed to query global letters count:", e);
        const localLetters = (JSON.parse(localStorage.getItem('polaroid_capsule_letters')) || [])
            .filter(item => item.to !== 'Tree');
        const count = localLetters.length + SEED_LETTERS.length;
        updateLettersProgress(count);
    }
}

function updateLettersProgress(count) {
    const target = 500;
    const percentage = Math.min((count / target) * 100, 100).toFixed(2);
    
    // Update gatekeeper view
    const progressFill = document.getElementById('target-progress-fill');
    const countText = document.getElementById('target-count-text');
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (countText) countText.textContent = `${count.toLocaleString()} / ${target.toLocaleString()}`;
    
    // Update countdown view
    const cdProgressFill = document.getElementById('cd-target-progress-fill');
    const cdCountText = document.getElementById('cd-target-count-text');
    if (cdProgressFill) cdProgressFill.style.width = `${percentage}%`;
    if (cdCountText) cdCountText.textContent = `${count.toLocaleString()} / ${target.toLocaleString()}`;
}


// ==========================================================================
// PWA INSTALL LOGIC & SERVICE WORKER REGISTRATION
// ==========================================================================

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('PWA Service Worker registered successfully!', reg.scope);
            })
            .catch(err => {
                console.error('PWA Service Worker registration failed:', err);
            });
    });

    // Reload page when service worker updates and takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent standard browser install prompt banner
    e.preventDefault();
    // Cache the event prompt
    deferredPrompt = e;
    // Show the Install Button in the header
    if (btnInstallApp) {
        btnInstallApp.classList.remove('hidden');
    }
});

// Hide Install Button on successful installation
window.addEventListener('appinstalled', (evt) => {
    console.log('App was successfully installed on the home screen!');
    if (btnInstallApp) {
        btnInstallApp.classList.add('hidden');
    }
    showToast("Dear BLACKPINK installed on your home screen! 🖤💗");
});


// ==========================================================================
// BLINK CARD MEMBERSHIP GENERATOR HELPER METHODS
// ==========================================================================

function updateCardBiasSignature() {
    const selectedBiasEl = document.querySelector('input[name="bias-choice"]:checked');
    const bias = selectedBiasEl ? selectedBiasEl.value : '';
    
    // 1. Update text label on card
    const biasNames = {
        jisoo: 'JISOO ♡',
        jennie: 'JENNIE ♡',
        rose: 'ROSÉ ♡',
        lisa: 'LISA ♡'
    };
    const valBias = document.getElementById('card-val-bias');
    if (valBias) {
        valBias.textContent = bias ? biasNames[bias] : '';
    }
    
    // 2. Update signature image source
    if (cardBiasSignature) {
        if (!bias) {
            cardBiasSignature.classList.add('hidden');
            cardBiasSignature.src = '';
        } else {
            cardBiasSignature.onerror = () => {
                cardBiasSignature.classList.add('hidden');
            };
            cardBiasSignature.onload = () => {
                cardBiasSignature.classList.remove('hidden');
            };
            cardBiasSignature.src = BIAS_SIGNATURES[bias];
        }
    }
}

function renderStickerTray(category) {
    if (!stickersTrayGrid) return;
    
    stickersTrayGrid.innerHTML = '';
    const stickers = SYSTEM_STICKERS[category] || [];
    
    if (stickers.length === 0) {
        stickersTrayGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; font-size: 0.8rem; color: var(--color-text-muted); padding: 20px;">No stickers yet.</div>';
        return;
    }
    
    stickers.forEach(src => {
        const item = document.createElement('div');
        item.className = 'tray-sticker-item';
        
        const img = document.createElement('img');
        img.src = src;
        img.onerror = () => {
            // Draw placeholder emoji
            item.innerHTML = '✨';
        };
        
        item.appendChild(img);
        item.addEventListener('click', () => {
            addStickerToCard(src);
        });
        stickersTrayGrid.appendChild(item);
    });
}

function addStickerToCard(src) {
    const id = 'placed-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const stickerObj = {
        id: id,
        src: src,
        x: 180, // starting position center
        y: 110,
        scale: 1.0,
        rotation: 0,
        flipped: false
    };
    
    cardPlacedStickers.push(stickerObj);
    drawStickerOnCanvas(stickerObj);
    selectSticker(id);
}

function drawStickerOnCanvas(stickerObj) {
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable-sticker-wrapper sticker-feel';
    wrapper.id = stickerObj.id;
    wrapper.style.width = '70px';
    wrapper.style.height = '70px';
    
    const img = document.createElement('img');
    img.src = stickerObj.src;
    img.onerror = () => {
        img.style.display = 'none';
        const placeholder = document.createElement('span');
        placeholder.textContent = '✨';
        placeholder.style.fontSize = '2rem';
        wrapper.appendChild(placeholder);
    };
    wrapper.appendChild(img);
    
    // Add interactive click handles
    wrapper.innerHTML += `
        <div class="sticker-handle handle-rotate"><i class="fa-solid fa-arrows-spin"></i></div>
        <div class="sticker-handle handle-scale"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></div>
        <div class="sticker-handle btn-del-sticker"><i class="fa-solid fa-xmark"></i></div>
        <div class="sticker-handle btn-flip-sticker"><i class="fa-solid fa-arrows-left-right"></i></div>
    `;
    
    // Position the wrapper element
    updateStickerElementTransform(wrapper, stickerObj);
    
    // Mousedown listener to drag or select
    wrapper.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('sticker-handle')) return;
        handleStickerInteractionStart(e, 'drag', stickerObj.id);
    });
    wrapper.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('sticker-handle')) return;
        handleStickerInteractionStart(e, 'drag', stickerObj.id);
    }, { passive: false });
    
    // Wire handles listeners
    const rotBtn = wrapper.querySelector('.handle-rotate');
    const scaleBtn = wrapper.querySelector('.handle-scale');
    const delBtn = wrapper.querySelector('.btn-del-sticker');
    const flipBtn = wrapper.querySelector('.btn-flip-sticker');
    
    rotBtn.addEventListener('mousedown', (e) => {
        handleStickerInteractionStart(e, 'rotate', stickerObj.id);
    });
    rotBtn.addEventListener('touchstart', (e) => {
        handleStickerInteractionStart(e, 'rotate', stickerObj.id);
    }, { passive: false });
    
    scaleBtn.addEventListener('mousedown', (e) => {
        handleStickerInteractionStart(e, 'scale', stickerObj.id);
    });
    scaleBtn.addEventListener('touchstart', (e) => {
        handleStickerInteractionStart(e, 'scale', stickerObj.id);
    }, { passive: false });
    
    delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSticker(stickerObj.id);
    });
    delBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        deleteSticker(stickerObj.id);
    });
    
    flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        flipSticker(stickerObj.id);
    });
    flipBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        flipSticker(stickerObj.id);
    });
    
    cardStickerCanvas.appendChild(wrapper);
}

function updateStickerElementTransform(el, stickerObj) {
    el.style.left = stickerObj.x + 'px';
    el.style.top = stickerObj.y + 'px';
    const flipScale = stickerObj.flipped ? -1 : 1;
    el.style.transform = `rotate(${stickerObj.rotation}deg) scale(${stickerObj.scale * flipScale}, ${stickerObj.scale})`;
}

function selectSticker(id) {
    selectedStickerId = id;
    document.querySelectorAll('.draggable-sticker-wrapper').forEach(w => {
        if (w.id === id) {
            w.classList.add('active');
        } else {
            w.classList.remove('active');
        }
    });
}

function deleteSticker(id) {
    cardPlacedStickers = cardPlacedStickers.filter(s => s.id !== id);
    const wrapper = document.getElementById(id);
    if (wrapper) wrapper.remove();
    if (selectedStickerId === id) selectedStickerId = null;
}

function flipSticker(id) {
    const sticker = cardPlacedStickers.find(s => s.id === id);
    if (sticker) {
        sticker.flipped = !sticker.flipped;
        const wrapper = document.getElementById(id);
        if (wrapper) updateStickerElementTransform(wrapper, sticker);
    }
}

function handleStickerInteractionStart(e, action, id) {
    e.preventDefault();
    selectSticker(id);
    activeStickerAction = action;
    activeStickerEl = document.getElementById(id);
    
    const sticker = cardPlacedStickers.find(s => s.id === id);
    if (!sticker) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStartX = clientX;
    dragStartY = clientY;
    stickerStartLeft = sticker.x;
    stickerStartTop = sticker.y;
    stickerStartWidth = activeStickerEl.offsetWidth;
    stickerStartHeight = activeStickerEl.offsetHeight;
    stickerStartRotation = sticker.rotation;
    
    // For rotate/scale, compute relative angle and distance from the center of the sticker
    const rect = activeStickerEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    stickerCenterPointerDist = Math.sqrt(dx * dx + dy * dy);
    stickerCenterPointerAngle = Math.atan2(dy, dx);
}

function handleStickerInteractionMove(e) {
    if (!activeStickerAction || !activeStickerEl) return;
    
    const sticker = cardPlacedStickers.find(s => s.id === selectedStickerId);
    if (!sticker) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (activeStickerAction === 'drag') {
        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;
        sticker.x = stickerStartLeft + dx;
        sticker.y = stickerStartTop + dy;
    } else if (activeStickerAction === 'rotate' || activeStickerAction === 'scale') {
        const rect = activeStickerEl.getBoundingClientRect();
        
        // Find absolute center relative to viewport
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        
        if (activeStickerAction === 'rotate') {
            const currentAngle = Math.atan2(dy, dx);
            const angleDiff = currentAngle - stickerCenterPointerAngle;
            sticker.rotation = stickerStartRotation + (angleDiff * 180 / Math.PI);
        } else if (activeStickerAction === 'scale') {
            const currentDist = Math.sqrt(dx * dx + dy * dy);
            const scaleFactor = currentDist / stickerCenterPointerDist;
            sticker.scale = Math.max(0.3, Math.min(3.0, scaleFactor));
        }
    }
    
    updateStickerElementTransform(activeStickerEl, sticker);
}

function endStickerInteraction() {
    activeStickerAction = null;
    activeStickerEl = null;
}

// 3D Parallax Tilt Card implementation
function handleCardParallaxTilt(e) {
    const card = membershipCard;
    const glare = document.getElementById('card-holo-glare');
    if (!card) return;
    
    const rect = cardCanvasWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = (centerY - y) / 10; // max 10 degrees tilt
    const tiltY = (x - centerX) / 10;
    
    card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    
    if (glare && (activeCardFinish === 'glossy' || activeCardFinish === 'holo')) {
        const px = (x / rect.width) * 100;
        const py = (y / rect.height) * 100;
        glare.style.backgroundPosition = `${px}% ${py}%`;
    }
}

function resetCardParallaxTilt() {
    const card = membershipCard;
    if (card) {
        card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    }
}

// Canvas Compilation Drawer methods (Matching horizontal landscape exactly)
function compileCardCanvas() {
    return new Promise((resolve) => {
        // High resolution sizing matching landscape ratio
        let width = 960;
        let height = 600;
        if (activeCardShape === 'square') {
            width = 760;
            height = 760;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Define theme colors
        const bgColor = colorBgPicker.value;
        const borderColor = colorBorderPicker.value;
        const linesColor = colorLinesPicker.value;
        const textColor = colorTextPicker.value;
        
        // 1. Clip shapes (Venom shape horizontal or Rounded Rect)
        ctx.save();
        if (activeCardShape === 'venom') {
            ctx.beginPath();
            ctx.moveTo(width * 0.1, 0);
            ctx.lineTo(width * 0.9, 0);
            ctx.lineTo(width, height * 0.15);
            ctx.lineTo(width, height * 0.85);
            ctx.lineTo(width * 0.9, height);
            ctx.lineTo(width * 0.1, height);
            ctx.lineTo(0, height * 0.85);
            ctx.lineTo(0, height * 0.15);
            ctx.closePath();
            ctx.clip();
        } else {
            // Draw rounded rectangle clip
            const radius = 38;
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(width - radius, 0);
            ctx.quadraticCurveTo(width, 0, width, radius);
            ctx.lineTo(width, height - radius);
            ctx.quadraticCurveTo(width, height, width - radius, height);
            ctx.lineTo(radius, height);
            ctx.quadraticCurveTo(0, height, 0, height - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.clip();
        }
        
        // 2. Draw background color
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        // 3. Draw Background Patterns
        if (activeCardPattern === 'plaid') {
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 4;
            const step = 40;
            for (let i = 0; i < width; i += step) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
            }
            for (let j = 0; j < height; j += step) {
                ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
            }
        } else if (activeCardPattern === 'dots') {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            const radius = 4;
            const step = 32;
            for (let i = 16; i < width; i += step) {
                for (let j = 16; j < height; j += step) {
                    ctx.beginPath();
                    ctx.arc(i, j, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (activeCardPattern === 'checker') {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            const size = 60;
            for (let i = 0; i < width; i += size * 2) {
                for (let j = 0; j < height; j += size * 2) {
                    ctx.fillRect(i, j, size, size);
                    ctx.fillRect(i + size, j + size, size, size);
                }
            }
        } else if (activeCardPattern === 'hearts') {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '24px Arial';
            const step = 60;
            for (let i = 20; i < width; i += step) {
                for (let j = 30; j < height; j += step) {
                    ctx.fillText('❤', i, j);
                }
            }
        } else if (activeCardPattern === 'ruled') {
            ctx.strokeStyle = 'rgba(255, 117, 144, 0.12)';
            ctx.lineWidth = 2.5;
            const step = 28 * (width / 480);
            for (let j = step; j < height; j += step) {
                ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
            }
        }
        ctx.restore(); // Restore from clipping mask so stickers and frames can draw outside borders!
        
        // 4. Draw outer border frame
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 14;
        ctx.strokeRect(0, 0, width, height);
        
        // Determine font style
        let fontName = 'sans-serif';
        if (activeCardFont === 'serif') fontName = 'Playfair Display, Georgia, serif';
        if (activeCardFont === 'handwritten') fontName = 'Caveat, cursive';
        
        // 5. Center-aligned details rows (NAME, JOIN DATE, BIAS)
        ctx.textAlign = 'left';
        
        // Centering coordinates
        const labelX = width / 2 - 180;
        const colonX = width / 2 - 50;
        const valX = width / 2 - 30;
        const startY = height / 2 - 72;
        const rowGap = 72;
        
        function drawInfoRow(label, value, y) {
            // Label in pink
            ctx.fillStyle = linesColor;
            ctx.font = `bold 18px sans-serif`;
            ctx.fillText(label, labelX, y);
            
            // Colon in pink
            ctx.fillText(':', colonX, y);
            
            // Value in white
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold 22px ${fontName}`;
            ctx.fillText(value, valX, y);
            
            // Underline under value
            ctx.strokeStyle = linesColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(valX, y + 8);
            ctx.lineTo(valX + 320, y + 8);
            ctx.stroke();
        }
        
        const nameVal = cardValName.textContent;
        const dateVal = cardValDate.textContent;
        
        // Parse Bias member name
        const selectedBiasEl = document.querySelector('input[name="bias-choice"]:checked');
        const bias = selectedBiasEl ? selectedBiasEl.value : 'jisoo';
        const biasNames = {
            jisoo: 'JISOO ♡',
            jennie: 'JENNIE ♡',
            rose: 'ROSÉ ♡',
            lisa: 'LISA ♡'
        };
        const biasVal = biasNames[bias];
        
        drawInfoRow('NAME', nameVal, startY);
        drawInfoRow('JOIN DATE', dateVal, startY + rowGap);
        drawInfoRow('BIAS', biasVal, startY + rowGap * 2);
        
        // 6. Draw Bias Signature image (bottom right)
        const sigImg = new Image();
        sigImg.src = cardBiasSignature.src;
        sigImg.onload = () => {
            ctx.save();
            const sigX = width - 180;
            const sigY = height - 90;
            const sigW = 140;
            const sigH = 65;
            
            // Draw signature offscreen to apply ink color tint
            const offScreenCanvas = document.createElement('canvas');
            offScreenCanvas.width = sigW;
            offScreenCanvas.height = sigH;
            const oCtx = offScreenCanvas.getContext('2d');
            oCtx.drawImage(sigImg, 0, 0, sigW, sigH);
            
            const ink = document.querySelector('input[name="ink-choice"]:checked').value;
            let filterColor = '#111111';
            if (ink === 'gold') filterColor = '#d5a350';
            if (ink === 'pink') filterColor = '#FF7590';
            
            oCtx.globalCompositeOperation = 'source-in';
            oCtx.fillStyle = filterColor;
            oCtx.fillRect(0, 0, sigW, sigH);
            
            ctx.drawImage(offScreenCanvas, sigX, sigY);
            ctx.restore();
            
            drawStickersAndFrame();
        };
        
        sigImg.onerror = () => {
            // Draw cursive signature text fallback if loaded
            if (cardBiasSignature.src && !cardBiasSignature.classList.contains('hidden')) {
                ctx.fillStyle = linesColor;
                ctx.font = `italic 22px ${fontName}`;
                ctx.fillText('Signature', width - 140, height - 60);
            }
            drawStickersAndFrame();
        };
        
        function drawStickersAndFrame() {
            // 7. Placed Stickers rendering
            let stickerCount = cardPlacedStickers.length;
            if (stickerCount === 0) {
                finishCanvasOverlays();
                return;
            }
            
            let index = 0;
            function drawNextSticker() {
                if (index >= stickerCount) {
                    finishCanvasOverlays();
                    return;
                }
                const sticker = cardPlacedStickers[index];
                const stickerImg = new Image();
                stickerImg.src = sticker.src;
                
                stickerImg.onload = () => {
                    ctx.save();
                    
                    // Card width represents 480px in editor
                    const scaleFactor = width / 480;
                    
                    // stX, stY coordinates center points
                    const stX = (sticker.x + 35) * scaleFactor;
                    const stY = (sticker.y + 35) * scaleFactor;
                    
                    ctx.translate(stX, stY);
                    ctx.rotate(sticker.rotation * Math.PI / 180);
                    
                    const flipScale = sticker.flipped ? -1 : 1;
                    ctx.scale(sticker.scale * flipScale, sticker.scale);
                    
                    const stSize = 70 * scaleFactor;
                    ctx.drawImage(stickerImg, -stSize/2, -stSize/2, stSize, stSize);
                    
                    ctx.restore();
                    index++;
                    drawNextSticker();
                };
                
                stickerImg.onerror = () => {
                    index++;
                    drawNextSticker();
                };
            }
            
            drawNextSticker();
        }
        
        function finishCanvasOverlays() {
            // 8. Draw Card Holder Frames
            if (activeHolderFrame === 'bunny') {
                ctx.save();
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = bgColor;
                ctx.lineWidth = 14;
                
                // Draw left ear
                ctx.beginPath();
                ctx.ellipse(width * 0.28, 40, 28, 60, -Math.PI/12, 0, Math.PI*2);
                ctx.fill(); ctx.stroke();
                
                // Draw right ear
                ctx.beginPath();
                ctx.ellipse(width * 0.72, 40, 28, 60, Math.PI/12, 0, Math.PI*2);
                ctx.fill(); ctx.stroke();
                ctx.restore();
            } else if (activeHolderFrame === 'kitty') {
                // Hanger chains
                ctx.fillStyle = '#CCCCCC';
                ctx.beginPath();
                ctx.arc(width*0.2, 20, 10, 0, Math.PI*2);
                ctx.arc(width*0.8, 20, 10, 0, Math.PI*2);
                ctx.fill();
            }
            
            resolve(canvas);
        }
    });
}
function downloadCardImage() {
    showToast('Compiling your Membership Card...');
    compileCardCanvas().then(canvas => {
        try {
            const link = document.createElement('a');
            link.download = `BLINK_Membership_${cardValId.textContent}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('Card saved to your device!');
        } catch (e) {
            console.error('Download failed:', e);
            showToast('Could not auto-download. Try long-pressing/sharing instead!');
        }
    });
}

function shareCardImage() {
    showToast('Compiling card for sharing...');
    compileCardCanvas().then(canvas => {
        canvas.toBlob(blob => {
            if (!blob) {
                showToast('Compiling failed.');
                return;
            }
            
            const file = new File([blob], `BLINK_Membership_${cardValId.textContent}.png`, { type: 'image/png' });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    title: 'My BLINK Membership Card',
                    text: `Check out my official 10-Year BLINK Fan Club Card! 🖤💗 ID: ${cardValId.textContent}`,
                    files: [file]
                }).catch(err => {
                    console.log('Share canceled or failed:', err);
                });
            } else {
                // Fallback copy message + download file
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(`Create your 10-Year BLINK Membership Card at https://dearblackpink.vercel.app 🖤💗`)
                        .then(() => showToast('Share link copied! Auto-downloading card...'))
                        .catch(() => showToast('Auto-downloading card...'));
                } else {
                    showToast('Auto-downloading card...');
                }
                
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.download = `BLINK_Membership_${cardValId.textContent}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }, 1000);
            }
        }, 'image/png');
    });
}

// ==========================================================================
// VIP BACKSTAGE PASS GENERATOR ENGINE
// ==========================================================================

let selectedBiasPass = 'ot4';
let selectedPhotoSrc = 'bp_pic1.jpg';
let customPhotoDataUrl = null;
let selectedPassBg = '#121212';
let selectedPassFinish = 'glossy';



function updatePassLabels() {
    const valBias = document.getElementById('pass-val-bias');
    const badgeInput = document.getElementById('pass-input-badge');
    if (valBias && badgeInput) {
        let displayBias = selectedBiasPass.toUpperCase();
        if (selectedBiasPass === 'rose') {
            displayBias = 'ROSÉ';
        }
        valBias.textContent = displayBias + ' / ' + badgeInput.value;
    }
}

function initPassState() {
    const nameInput = document.getElementById('pass-input-name');
    if (nameInput) {
        nameInput.value = '';
    }
    const valName = document.getElementById('pass-val-name');
    if (valName) {
        valName.textContent = 'YOUR NAME HERE';
    }

    // Reset bias state
    selectedBiasPass = 'ot4';
    updatePassTheme('ot4');
    
    const biasBtns = document.querySelectorAll('.btn-bias-pass');
    biasBtns.forEach(btn => {
        if (btn.dataset.bias === 'ot4') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Reset photo pickers
    selectedPhotoSrc = 'bp_pic1.jpg';
    customPhotoDataUrl = null;
    const previewPhoto = document.getElementById('pass-preview-photo');
    if (previewPhoto) {
        previewPhoto.src = 'bp_pic1.jpg';
    }
    const thumbnails = document.querySelectorAll('.btn-thumbnail-pick');
    thumbnails.forEach(thumb => {
        if (thumb.dataset.imgSrc === 'bp_pic1.jpg') {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });

    // Reset fields
    const songInput = document.getElementById('pass-input-song');
    const valSong = document.getElementById('pass-val-song');
    if (songInput && valSong) {
        songInput.value = 'STAY';
        valSong.textContent = 'STAY';
    }

    const badgeInput = document.getElementById('pass-input-badge');
    const valStamp = document.getElementById('pass-val-stamp');
    if (badgeInput && valStamp) {
        badgeInput.value = 'Born Pink Era';
        valStamp.textContent = 'Born Pink Era 🌸';
    }

    // Reset card background color to absolute black and finish to glossy
    selectedPassBg = '#121212';
    selectedPassFinish = 'glossy';
    const card = document.getElementById('vip-pass-card');
    if (card) {
        card.style.backgroundColor = '#121212';
        card.classList.remove('finish-foil', 'finish-glitter');
        card.classList.add('finish-glossy');
    }
    const finishBtns = document.querySelectorAll('.btn-finish-pass');
    finishBtns.forEach(btn => {
        if (btn.dataset.finish === 'glossy') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updatePassLabels();
}

function updatePassTheme(bias) {
    const card = document.getElementById('vip-pass-card');
    if (!card) return;

    // Remove old classes
    card.classList.remove('theme-ot4', 'theme-jisoo', 'theme-jennie', 'theme-rose', 'theme-lisa');
    card.classList.add(`theme-${bias}`);
}

function initPassListeners() {


    // Pass finish selector listener
    const finishBtns = document.querySelectorAll('.btn-finish-pass');
    finishBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            finishBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPassFinish = btn.dataset.finish;
            
            const card = document.getElementById('vip-pass-card');
            if (card) {
                card.classList.remove('finish-glossy', 'finish-foil', 'finish-glitter');
                card.classList.add(`finish-${selectedPassFinish}`);
            }
        });
    });

    // Bias selection listener
    const biasBtns = document.querySelectorAll('.btn-bias-pass');
    biasBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            biasBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedBiasPass = btn.dataset.bias;
            updatePassTheme(selectedBiasPass);
            updatePassLabels();
        });
    });



    // Name text sync
    const nameInput = document.getElementById('pass-input-name');
    const valName = document.getElementById('pass-val-name');
    if (nameInput && valName) {
        nameInput.addEventListener('input', () => {
            valName.textContent = nameInput.value.trim().toUpperCase() || 'YOUR NAME HERE';
        });
    }

    // Anthem select sync
    const songInput = document.getElementById('pass-input-song');
    const valSong = document.getElementById('pass-val-song');
    if (songInput && valSong) {
        songInput.addEventListener('change', () => {
            valSong.textContent = songInput.value;
        });
    }

    // Stamp select sync
    const badgeInput = document.getElementById('pass-input-badge');
    const valStamp = document.getElementById('pass-val-stamp');
    if (badgeInput && valStamp) {
        badgeInput.addEventListener('change', () => {
            let emoji = ' 🌸';
            if (badgeInput.value === 'Square One Era') emoji = ' ⬛';
            if (badgeInput.value === 'Square Two Era') emoji = ' 🟥';
            if (badgeInput.value === 'As If It\'s Your Last Era') emoji = ' 💖';
            if (badgeInput.value === 'Square Up Era') emoji = ' 🟦';
            if (badgeInput.value === 'Kill This Love Era') emoji = ' 💔';
            if (badgeInput.value === 'The Album Era') emoji = ' 👑';
            if (badgeInput.value === 'Born Pink Era') emoji = ' 🌸';
            if (badgeInput.value === 'DEADLINE Era') emoji = ' ⏳';
            
            valStamp.textContent = badgeInput.value + emoji;
            updatePassLabels();
        });
    }

    // Preloaded photo picks
    const thumbnails = document.querySelectorAll('.btn-thumbnail-pick');
    const previewPhoto = document.getElementById('pass-preview-photo');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            selectedPhotoSrc = thumb.dataset.imgSrc;
            customPhotoDataUrl = null;
            if (previewPhoto) previewPhoto.src = selectedPhotoSrc;
        });
    });

    // Upload custom photo handler
    const uploadTrigger = document.getElementById('btn-pass-upload-trigger');
    const fileInput = document.getElementById('pass-photo-upload');
    if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                customPhotoDataUrl = event.target.result;
                if (previewPhoto) previewPhoto.src = customPhotoDataUrl;
                // Deselect preloaded thumbnails
                thumbnails.forEach(t => t.classList.remove('active'));
            };
            reader.readAsDataURL(file);
        });
    }

    // Download action triggers share modal
    const downloadBtn = document.getElementById('btn-pass-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            downloadPassAsPNG();
            
            // Show share modal dialog after initiating download
            const shareModal = document.getElementById('pass-share-modal');
            if (shareModal) {
                shareModal.classList.add('active');
                
                const nameText = document.getElementById('pass-val-name').textContent;
                const xLink = document.getElementById('btn-share-modal-x');
                const waLink = document.getElementById('btn-share-modal-wa');
                const copyBtn = document.getElementById('btn-share-modal-copy');
                
                const shareText = encodeURIComponent(`Just designed my personalized BLACKPINK VIP Concert Pass! Create yours at Dear BLACKPINK 🎫✨ #BLACKPINK #BLINK`);
                
                if (xLink) xLink.href = `https://twitter.com/intent/tweet?text=${shareText}`;
                if (waLink) waLink.href = `https://api.whatsapp.com/send?text=${shareText}`;
                
                if (copyBtn) {
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(window.location.href);
                        showToast("Link copied to clipboard!");
                    };
                }
                
                const closeBtn = document.getElementById('pass-share-close-btn');
                if (closeBtn) {
                    closeBtn.onclick = () => shareModal.classList.remove('active');
                }
                
                const cancelBtn = document.getElementById('btn-share-modal-cancel');
                if (cancelBtn) {
                    cancelBtn.onclick = () => shareModal.classList.remove('active');
                }
            }
        });
    }

    // Share on X (Twitter) (Control Panel Share Button)
    const shareBtn = document.getElementById('btn-pass-share-x');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const text = encodeURIComponent("Just designed my custom BLACKPINK VIP Backstage Pass for the 10th Anniversary Time Capsule! Create yours at Dear BLACKPINK 🎫✨ #BLACKPINK #BLINK");
            const shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
            window.open(shareUrl, '_blank');
        });
    }
}

// Helper to draw an image inside a Canvas region mimicking "object-fit: cover"
function drawCoverImage(ctx, img, dx, dy, dWidth, dHeight) {
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    const imageAspectRatio = imgWidth / imgHeight;
    const canvasRegionAspectRatio = dWidth / dHeight;
    
    let sx, sy, sWidth, sHeight;
    
    if (imageAspectRatio > canvasRegionAspectRatio) {
        // Image is wider than target aspect ratio (crop horizontally)
        sHeight = imgHeight;
        sWidth = imgHeight * canvasRegionAspectRatio;
        sx = (imgWidth - sWidth) / 2;
        sy = 0;
    } else {
        // Image is taller than target aspect ratio (crop vertically)
        sWidth = imgWidth;
        sHeight = imgWidth / canvasRegionAspectRatio;
        sx = 0;
        sy = (imgHeight - sHeight) / 2;
    }
    
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}

// Draw and download backstage pass lanyard
function downloadPassAsPNG() {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    // Enable high-quality anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Get color themes
    let borderClr = '#FF7590';
    let textAccent = '#FF7590';
    let photoBg = '#1E1A1B';
    
    if (selectedBiasPass === 'jisoo') {
        borderClr = '#8F66FF';
        textAccent = '#AC92FF';
        photoBg = '#17151E';
    } else if (selectedBiasPass === 'jennie') {
        borderClr = '#FF1E56';
        textAccent = '#FF3E70';
        photoBg = '#1E1517';
    } else if (selectedBiasPass === 'rose') {
        borderClr = '#FFA6C9';
        textAccent = '#FFA6C9';
        photoBg = '#1E1618';
    } else if (selectedBiasPass === 'lisa') {
        borderClr = '#FFD000';
        textAccent = '#FFE066';
        photoBg = '#1E1E14';
    }

    // Set finish colors
    let cardBorderClr = borderClr;
    let cardTextAccent = textAccent;
    
    if (selectedPassFinish === 'foil') {
        // High quality gold foil linear gradient
        const goldGrad = ctx.createLinearGradient(40, 120, 1240, 1880);
        goldGrad.addColorStop(0, '#BF953F');
        goldGrad.addColorStop(0.25, '#FCF6BA');
        goldGrad.addColorStop(0.5, '#B38728');
        goldGrad.addColorStop(0.75, '#FBF5B7');
        goldGrad.addColorStop(1, '#AA771C');
        cardBorderClr = goldGrad;
        cardTextAccent = goldGrad;
    }

    // Clear background outer margin (transparent border region)
    ctx.clearRect(0, 0, 1280, 1920);

    // Draw fabric lanyard strap running off the top
    ctx.fillStyle = '#1E1517'; // dark charcoal
    ctx.fillRect(616, 0, 48, 100);
    // Draw vertical pink/magenta accent stripe down middle of lanyard strap
    ctx.fillStyle = '#FF7590';
    ctx.fillRect(636, 0, 8, 100);

    // Draw metallic silver clip hooking into the slot
    ctx.fillStyle = '#7F7F7F'; // dark silver border
    ctx.fillRect(600, 78, 80, 44);
    ctx.fillStyle = '#D3D3D3'; // shiny metallic body
    ctx.fillRect(604, 82, 72, 36);
    
    // Draw card background inset (40px margins, offset to start at y=120, perfect rectangle)
    ctx.fillStyle = '#121212';
    ctx.fillRect(40, 120, 1200, 1760);

    // Draw outer pass border inset (perfect rectangle, 24px thickness)
    ctx.lineWidth = 24;
    ctx.strokeStyle = cardBorderClr;
    ctx.strokeRect(40, 120, 1200, 1760);

    // Draw lanyard punched slot cutout at top center of card
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.ellipse(640, 170, 48, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2F2F2F';
    ctx.stroke();

    // Draw Header Tag (inset, soft pink label)
    ctx.fillStyle = '#FF8FA3';
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillText('10TH ANNIVERSARY', 120, 260);

    // Draw Logo Title (inset, high contrast white)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px "Playfair Display", serif';
    ctx.fillText('Dear BLACKPINK', 120, 350);

    // Draw VIP ACCESS badge (inset, rounded)
    ctx.fillStyle = (selectedPassFinish === 'foil') ? cardBorderClr : textAccent;
    ctx.beginPath();
    ctx.roundRect(880, 210, 280, 84, 16);
    ctx.fill();

    ctx.fillStyle = (selectedPassFinish === 'foil') ? '#121212' : '#FFFFFF';
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIP ACCESS', 1020, 262);
    ctx.textAlign = 'left'; // Restore

    // Draw dashed header separator
    ctx.lineWidth = 8;
    ctx.strokeStyle = cardBorderClr;
    ctx.setLineDash([24, 16]);
    ctx.beginPath();
    ctx.moveTo(120, 410);
    ctx.lineTo(1160, 410);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Draw photo frame background (inset, perfect rectangle)
    ctx.fillStyle = photoBg;
    ctx.fillRect(120, 460, 1040, 760);
    ctx.lineWidth = 8;
    ctx.strokeStyle = cardBorderClr;
    ctx.strokeRect(120, 460, 1040, 760);

    // Draw profile photo (inset, perfect rectangle cropping)
    const previewImg = document.getElementById('pass-preview-photo');
    if (previewImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(124, 464, 1032, 752);
        ctx.clip();
        drawCoverImage(ctx, previewImg, 124, 464, 1032, 752);
        ctx.restore();
    }

    // Draw holographic disk seal on photo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(1040, 1100, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Details Rows
    const nameText = document.getElementById('pass-val-name').textContent;
    const stampText = document.getElementById('pass-val-stamp').textContent;
    const songText = document.getElementById('pass-val-song').textContent;
    const biasName = document.getElementById('pass-val-bias').textContent;

    // Row 1 details
    ctx.fillStyle = '#A0A0A0';
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillText('VIP NAME', 120, 1310);
    ctx.fillText('STAMP', 720, 1310);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px "Inter", sans-serif';
    ctx.fillText(nameText, 120, 1390);

    // Draw rubber stamp style badge on canvas for stamp Text
    ctx.save();
    ctx.translate(900, 1390);
    ctx.rotate(-8 * Math.PI / 180);
    
    // Stamp box
    ctx.strokeStyle = cardTextAccent;
    ctx.lineWidth = 8;
    ctx.strokeRect(-180, -50, 360, 100);
    ctx.lineWidth = 3;
    ctx.strokeRect(-188, -58, 376, 116);
    
    // Stamp text inside rubber badge
    ctx.fillStyle = cardTextAccent;
    ctx.font = 'bold 26px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stampText.toUpperCase(), 0, 0);
    
    ctx.restore();

    // Row 2 details
    ctx.fillStyle = '#A0A0A0';
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillText('FAVORITE SONG', 120, 1530);
    ctx.fillText('BIAS GROUP', 720, 1530);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px "Inter", sans-serif';
    ctx.fillText(songText, 120, 1610);

    ctx.fillStyle = cardTextAccent;
    ctx.font = 'bold 44px "Inter", sans-serif';
    ctx.fillText(biasName, 720, 1610);

    // Dashed footer separator
    ctx.lineWidth = 8;
    ctx.strokeStyle = cardBorderClr;
    ctx.setLineDash([24, 16]);
    ctx.beginPath();
    ctx.moveTo(120, 1690);
    ctx.lineTo(1160, 1690);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Draw Spotify QR Code
    const qrX = 120;
    const qrY = 1730;
    
    // Background card for QR code
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - 8, qrY - 8, 148, 148);
    ctx.lineWidth = 4;
    ctx.strokeStyle = cardBorderClr;
    ctx.strokeRect(qrX - 8, qrY - 8, 148, 148);
    
    const qrImg = document.getElementById('preview-spotify-qr-img');
    if (qrImg) {
        ctx.drawImage(qrImg, qrX, qrY, 132, 132);
    }

    // Draw Spotify Scan label next to QR code
    ctx.fillStyle = cardTextAccent;
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillText('SPOTIFY SCAN PASS', 720, 1785);

    // Draw serial number
    ctx.fillStyle = '#A0A0A0';
    ctx.font = '32px monospace';
    ctx.fillText('BP-20260807-VIP', 720, 1845);

    // Draw premium diagonal hologram sheen overlay across the entire card
    const sheen = ctx.createLinearGradient(40, 120, 1240, 1880);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(0.42, 'rgba(255, 255, 255, 0.06)');
    sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0.12)');
    sheen.addColorStop(0.48, 'rgba(255, 182, 193, 0.08)'); // soft pink shine
    sheen.addColorStop(0.51, 'rgba(180, 240, 255, 0.08)'); // soft cyan shine
    sheen.addColorStop(0.55, 'rgba(255, 255, 255, 0.04)');
    sheen.addColorStop(0.62, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(40, 120, 1200, 1760);

    // Draw sparkling diamond glitter overlay if glitter finish is active
    if (selectedPassFinish === 'glitter') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        const seed = nameText.length || 7;
        for (let i = 0; i < 150; i++) {
            const x = 40 + ((Math.sin(i * 12.3 + seed) + 1) / 2) * 1200;
            const y = 120 + ((Math.cos(i * 45.6 + seed) + 1) / 2) * 1760;
            const size = ((Math.sin(i * 78.9) + 1) / 2) * 4 + 1.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Download PNG
    const link = document.createElement('a');
    link.download = `Dear_BLACKPINK_VIP_Pass_${nameText.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}


