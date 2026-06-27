// THE POLAROID CAPSULE - APPLICATION LOGIC AND SUPABASE SYNCRONIZATION
const SUPABASE_URL = 'https://bmrabjysahblnosnpqia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcmFianlzYWhibG5vc25wcWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTcyODYsImV4cCI6MjA5Nzc3MzI4Nn0.Igx7yAd98DyTqPxZmGtl-QxdIO0TW3_YrDjpr-swhjo';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Target Date: August 8, 2026, at 12:00 AM Midnight KST (Korean Standard Time)
// 12:00 AM KST corresponds to 3:00 PM UTC on August 7th
const TARGET_DATE = new Date("2026-08-07T15:00:00Z");

// App State
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

// Elements
const viewGatekeeper = document.getElementById('view-gatekeeper');
const viewWrite = document.getElementById('view-write');
const viewCountdown = document.getElementById('view-countdown');
const viewGallery = document.getElementById('view-gallery');
const viewMediaHub = document.getElementById('view-media-hub');
const viewQuiz = document.getElementById('view-quiz');
const navCapsule = document.getElementById('nav-capsule');
const navQuiz = document.getElementById('nav-quiz');
const navMediaHub = document.getElementById('nav-media-hub');

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
    if (targetView !== viewMediaHub && targetView !== viewQuiz) {
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
            audio.play().then(() => {
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

    // Media Form Submission
    mediaUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const author = mediaAuthorInput.value.trim();
        const caption = mediaCaptionInput.value.trim();
        
        if (!uploadedFileData || !uploadedFileType || !selectedFileObject) {
            showToast('Please select an image or video to share.');
            return;
        }

        // Disable button during upload
            // Disable button during upload
        const submitBtn = mediaUploadForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Uploading to Cloud... <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            let fileToUpload = selectedFileObject;
            
            // Compress if it is an image
            if (uploadedFileType === 'image') {
                submitBtn.innerHTML = 'Optimizing Image... <i class="fa-solid fa-wand-magic-sparkles"></i>';
                try {
                    fileToUpload = await compressImage(selectedFileObject);
                    console.log(`Original image size: ${(selectedFileObject.size / 1024).toFixed(1)}KB, Compressed: ${(fileToUpload.size / 1024).toFixed(1)}KB`);
                } catch (compressErr) {
                    console.error('Image compression failed, using original:', compressErr);
                }
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
            
            const fileUrl = urlData.publicUrl;

            // 3. Save entry to Supabase media database table
            const { error: dbError } = await _supabase
                .from('media')
                .insert([{
                    author: author,
                    caption: caption,
                    file_url: fileUrl,
                    file_type: uploadedFileType
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
            resetUploadPreview();
            showToast('Creation shared successfully!');
            
            // Reload Grid
            loadedMedia = null;
            await renderMediaShowcase(true);

            // Trigger the Share on X popup for media edits after 1.5 seconds so they can see the success toast first!
            setTimeout(() => {
                openShareXModal('media');
            }, 1500);
        } catch (error) {
            console.error('Upload failed:', error);
            showToast('Upload failed! Please check your file size or database connection.');
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
    const btnShareXClose = document.getElementById('btn-share-x-close');
    if (btnShareXClose) {
        btnShareXClose.addEventListener('click', () => {
            shareXModal.classList.remove('active');
        });
    }

    if (shareXModal) {
        shareXModal.addEventListener('click', (e) => {
            if (e.target === shareXModal) {
                shareXModal.classList.remove('active');
            }
        });
    }
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
// Opens the Share on X Viral Modal
function openShareXModal(type = 'letter') {
    if (!shareXModal) return;
    shareXModal.classList.add('active');
    
    const btnSharePost = document.getElementById('btn-share-x-post');
    if (!btnSharePost) return;
    
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
            return; // STOP HERE to prevent browser redirect crash inside X app
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
// Helper to escape HTML characters
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

// Client-side image compressor before upload
function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) {
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

// Renders visual preview inside file dropzone
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

// Resets visual preview inside file dropzone
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

// Renders the fan creation edits grid
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
            mediaTag = `
                <div class="video-badge"><i class="fa-solid fa-circle-play"></i> Video</div>
                <video src="${item.fileData}" muted loop playsinline controls></video>
            `;
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

// Instantly deletes media edits from cache and background database without prompt
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

// Instantly deletes sealed wishes from cache and background database without prompt
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
            audio.play().then(() => {
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
            audio.play().then(() => {
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
        audio.play().then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            vinyl.classList.add('playing');
            if (photoRollTrack) photoRollTrack.classList.add('playing');
        });
    });
    
    nextBtn.addEventListener('click', () => {
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= playlist.length) newIndex = 0;
        loadTrack(newIndex);
        audio.play().then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            vinyl.classList.add('playing');
            if (photoRollTrack) photoRollTrack.classList.add('playing');
        });
    });

    // Attempt to autoplay immediately on load (will work if browser MEI or settings allow it)
    audio.play().then(() => {
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
