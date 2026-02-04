// Gallery filter section switching and animation
document.addEventListener('DOMContentLoaded', function () {
    if (window.location.protocol === 'file:') {
        const base = document.querySelector('base');
        if (base) {
            base.href = './';
        }

        const shouldRewrite = (value) => {
            if (!value) return false;
            const lower = value.toLowerCase();
            if (lower.startsWith('http') || lower.startsWith('mailto:') || lower.startsWith('tel:') || lower.startsWith('data:') || lower.startsWith('blob:') || lower.startsWith('#')) {
                return false;
            }
            return true;
        };

        const rewriteValue = (value) => {
            const cleaned = value.replace(/^\/+/, '');
            if (cleaned.startsWith('./') || cleaned.startsWith('../')) return cleaned;
            return `./${cleaned}`;
        };

        document.querySelectorAll('[src]').forEach((el) => {
            const raw = el.getAttribute('src');
            if (!shouldRewrite(raw)) return;
            el.setAttribute('src', rewriteValue(raw));
        });

        document.querySelectorAll('link[href]').forEach((el) => {
            const raw = el.getAttribute('href');
            if (!shouldRewrite(raw)) return;
            el.setAttribute('href', rewriteValue(raw));
        });

        document.querySelectorAll('[poster]').forEach((el) => {
            const raw = el.getAttribute('poster');
            if (!shouldRewrite(raw)) return;
            el.setAttribute('poster', rewriteValue(raw));
        });
    }

    const filterPills = document.querySelectorAll('.filter-pill');
    const sections = {
        all: document.getElementById('gallery-all'),
        daily: document.getElementById('gallery-daily'),
        volunteers: document.getElementById('gallery-volunteers'),
        events: document.getElementById('gallery-events')
    };
    let currentSection = sections.all;

    filterPills.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active from all
            filterPills.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            // Add active to clicked
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Hide all sections
            Object.values(sections).forEach(sec => {
                sec.style.display = 'none';
                sec.classList.remove('slide-in-right');
            });
            // Show selected section with animation
            const sectionKey = btn.getAttribute('data-section');
            const showSection = sections[sectionKey];
            if (showSection) {
                showSection.style.display = '';
                // Trigger reflow for animation
                void showSection.offsetWidth;
                showSection.classList.add('slide-in-right');
                currentSection = showSection;
            }
        });
    });
    if (!document.querySelector('base')) {
        const base = document.createElement('base');
        base.href = window.location.protocol === 'file:' ? './' : '/';
        document.head.prepend(base);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavbar = () => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;

        if (currentY <= 10) {
            navbar.classList.remove('navbar--hidden');
            navbar.classList.remove('navbar--scrolled');
        } else if (delta > 8) {
            navbar.classList.add('navbar--hidden');
        } else if (delta < -8) {
            navbar.classList.remove('navbar--hidden');
        }

        if (currentY > 10) {
            navbar.classList.add('navbar--scrolled');
        }

        lastScrollY = currentY;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    }, { passive: true });
});

document.addEventListener('DOMContentLoaded', function () {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    if (!newsletterForms.length) return;

    newsletterForms.forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            let status = form.querySelector('.newsletter-status');
            if (!status) {
                status = document.createElement('div');
                status.className = 'newsletter-status';
                form.appendChild(status);
            }
            status.textContent = 'Thanks for subscribing!';
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const chatbot = document.getElementById('chatbot');
    if (!chatbot) return;

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                chatbot.classList.add('chatbot--left');
            } else {
                chatbot.classList.remove('chatbot--left');
            }
        });
    }, { threshold: 0.3 });

    observer.observe(heroSection);
});

document.addEventListener('DOMContentLoaded', function () {
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    if (!emailLinks.length) return;

    emailLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
        if (!email) return;

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
        link.setAttribute('href', gmailUrl);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const copyButtons = document.querySelectorAll('[data-copy-value]');
    if (!copyButtons.length) return;

    copyButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const value = button.getAttribute('data-copy-value') || '';
            if (!value) return;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(value);
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = value;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    textarea.remove();
                }

                const original = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = original;
                }, 1200);
            } catch (err) {
                console.error('Copy failed', err);
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('back-to-top')) return;

    const button = document.createElement('button');
    button.id = 'back-to-top';
    button.type = 'button';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5l-6.5 6.5 1.4 1.4L11 8.8V19h2V8.8l4.1 4.1 1.4-1.4z" />
        </svg>
    `;

    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(button);

    const toggleVisibility = () => {
        if (window.scrollY > 240) {
            button.classList.add('is-visible');
        } else {
            button.classList.remove('is-visible');
        }
    };

    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility, { passive: true });
});

document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.site-last-updated')) return;

    const footerBottom = document.querySelector('.footer-bottom');
    if (!footerBottom) return;

    const lastUpdated = new Date();
    lastUpdated.setDate(lastUpdated.getDate() - 1);

    const formattedDate = lastUpdated.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const line = document.createElement('div');
    line.className = 'site-last-updated';
    line.innerHTML = `Website last updated ${formattedDate} - by <a href="https://mail.google.com/mail/?view=cm&fs=1&to=oluwanifemijosiah02@gmail.com" target="_blank" rel="noopener noreferrer">oluwanifemijosiah02@gmail.com</a>&nbsp;&nbsp;&nbsp;,&nbsp;&nbsp;&nbsp;<a href="tel:+447587993762">07587993762</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="http://www.gravesendmethodistchurch.org.uk/" target="_blank" rel="noopener noreferrer">Gravesend Methodist Church Link</a>`;

    footerBottom.appendChild(line);
});

document.addEventListener('DOMContentLoaded', function () {
    const videos = document.querySelectorAll('video');
    if (!videos.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (!entry.isIntersecting) {
                try {
                    video.pause();
                    video.currentTime = 0;
                } catch (err) {
                    console.warn('Unable to reset video', err);
                }
            }
        });
    }, { threshold: 0.2 });

    videos.forEach((video) => observer.observe(video));
});

document.addEventListener('DOMContentLoaded', function () {
    const banner = document.querySelector('.announcement-banner');
    if (!banner) return;

    const isActive = banner.getAttribute('data-active') === 'true';
    if (!isActive) {
        banner.style.display = 'none';
        return;
    }

    const announcementId = banner.getAttribute('data-announcement-id') || 'default';
    const dismissedKey = `announcementDismissed:${announcementId}`;
    const dismissed = window.localStorage.getItem(dismissedKey);
    if (dismissed === 'true') {
        banner.style.display = 'none';
        return;
    }

    const closeButton = banner.querySelector('.announcement-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            banner.style.display = 'none';
            window.localStorage.setItem(dismissedKey, 'true');
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const calendarLinks = document.querySelectorAll('.event-calendar');
    if (!calendarLinks.length) return;

    calendarLinks.forEach((link) => {
        const date = link.getAttribute('data-date');
        const title = link.getAttribute('data-title');
        const location = link.getAttribute('data-location') || '';
        const details = link.getAttribute('data-details') || '';

        if (!date || !title) {
            link.setAttribute('aria-disabled', 'true');
            return;
        }

        const start = date.replace(/-/g, '');
        const end = start;
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${start}/${end}`,
            details,
            location
        });
        link.setAttribute('href', `https://calendar.google.com/calendar/render?${params.toString()}`);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
        link.setAttribute('aria-disabled', 'false');
    });
});
const slides = document.querySelectorAll(".hero-slider img");

if (slides.length) {
    let index = 0;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === 0));

    setInterval(() => {
        slides[index].classList.remove("active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("active");
    }, 4000);
}

// Chatbot functionality
const chatbot = document.getElementById('chatbot');
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('chat-window');
const chatMessages = document.getElementById('chat-messages');
let chatInput = document.getElementById('chat-input');
if (chatInput && !['INPUT', 'TEXTAREA'].includes(chatInput.tagName)) {
    chatInput = chatInput.querySelector('input, textarea');
}
if (!chatInput) {
    chatInput = document.getElementById('user-input');
}
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');

const chatInputArea = document.getElementById('chat-input-area')
    || (chatInput ? chatInput.closest('#chat-input') : null)
    || (chatInput ? chatInput.parentElement : null);

let voiceStatus = document.getElementById('voice-status');
if (!voiceStatus && chatInputArea) {
    voiceStatus = document.createElement('div');
    voiceStatus.id = 'voice-status';
    voiceStatus.className = 'voice-status';
    voiceStatus.setAttribute('aria-live', 'polite');
    voiceStatus.innerHTML = `
        <div class="voice-note" aria-hidden="true">
            <span class="voice-note__icon">🎙️</span>
            <span class="voice-note__label">Voice note ready</span>
            <span class="voice-note__bars">
                <i></i><i></i><i></i><i></i><i></i>
            </span>
        </div>
        <span class="voice-status__text">Tap send to post your voice note.</span>
    `;
    if (chatInputArea.parentElement) {
        chatInputArea.parentElement.insertBefore(voiceStatus, chatInputArea);
    } else {
        chatInputArea.insertBefore(voiceStatus, chatInputArea.firstChild);
    }
}

const voiceConsentKey = 'voiceConsentGranted';
let voiceAllowed = localStorage.getItem(voiceConsentKey) === 'true';

let voiceConsentBtn = document.getElementById('voice-consent-btn');
if (!voiceConsentBtn && chatInputArea) {
    voiceConsentBtn = document.createElement('button');
    voiceConsentBtn.id = 'voice-consent-btn';
    voiceConsentBtn.type = 'button';
    voiceConsentBtn.textContent = 'Allow voice';
    voiceConsentBtn.setAttribute('aria-label', 'Allow voice input');
    if (voiceBtn && voiceBtn.parentElement === chatInputArea) {
        chatInputArea.insertBefore(voiceConsentBtn, voiceBtn);
    } else {
        chatInputArea.appendChild(voiceConsentBtn);
    }
}

let ttsStopBtn = document.getElementById('tts-stop-btn');
if (!ttsStopBtn && chatInputArea) {
    ttsStopBtn = document.createElement('button');
    ttsStopBtn.id = 'tts-stop-btn';
    ttsStopBtn.type = 'button';
    ttsStopBtn.textContent = 'Stop';
    ttsStopBtn.setAttribute('aria-label', 'Stop speaking');
    if (sendBtn && sendBtn.parentElement === chatInputArea) {
        chatInputArea.insertBefore(ttsStopBtn, sendBtn.nextSibling);
    } else {
        chatInputArea.appendChild(ttsStopBtn);
    }
}

let isListening = false;
let recognition;
let voiceDraftText = '';
let lastInputWasVoice = false;
let speakOnNextBotMessage = false;
let isSpeaking = false;
let chatIdleTimer;
const chatIdleMs = 10000;
const mobileChatPeekMs = 6500;
const mobileChatPeekClass = 'chatbot--peek';
const mobileChatMq = window.matchMedia('(max-width: 768px)');
let mobileChatPeekTimer;

function scheduleMobileChatPeek() {
    if (!chatbot || !mobileChatMq.matches) return;
    clearTimeout(mobileChatPeekTimer);
    mobileChatPeekTimer = setTimeout(() => {
        if (chatWindow && chatWindow.style.display === 'flex') return;
        chatbot.classList.add(mobileChatPeekClass);
    }, mobileChatPeekMs);
}

function showMobileChatbot() {
    if (!chatbot || !mobileChatMq.matches) return;
    chatbot.classList.remove(mobileChatPeekClass);
    scheduleMobileChatPeek();
}

function closeChatWindow() {
    if (!chatWindow || !chatMessages) return;
    chatWindow.style.display = 'none';
    chatMessages.innerHTML = '';
    const note = document.getElementById('chatbot-note');
    if (note) note.style.display = 'block';
    scheduleMobileChatPeek();
}

function resetChatIdleTimer() {
    if (!chatWindow || chatWindow.style.display !== 'flex') return;
    clearTimeout(chatIdleTimer);
    chatIdleTimer = setTimeout(() => {
        closeChatWindow();
    }, chatIdleMs);
}

function updateVoiceStatus(state = 'hidden') {
    if (!voiceStatus) return;
    if (!voiceAllowed) {
        voiceStatus.style.display = 'none';
        return;
    }
    voiceStatus.classList.remove('voice-status--recording', 'voice-status--idle');
    if (state === 'recording') {
        voiceStatus.classList.add('voice-status--recording');
        voiceStatus.style.display = 'flex';
        const text = voiceStatus.querySelector('.voice-status__text');
        if (text) text.textContent = 'Listening... speak slowly and tap stop when finished.';
    } else if (state === 'idle') {
        voiceStatus.classList.add('voice-status--idle');
        voiceStatus.style.display = 'flex';
        const text = voiceStatus.querySelector('.voice-status__text');
        if (text) text.textContent = 'Tap send to post your voice note.';
    } else {
        voiceStatus.style.display = 'none';
    }
}

function applyVoiceConsentUI() {
    if (voiceBtn) {
        voiceBtn.disabled = !voiceAllowed;
        voiceBtn.setAttribute('aria-disabled', String(!voiceAllowed));
    }
    if (voiceConsentBtn) {
        voiceConsentBtn.style.display = voiceAllowed ? 'none' : 'inline-flex';
    }
    if (!voiceAllowed) {
        updateVoiceStatus('hidden');
    }
}

if (voiceConsentBtn) {
    voiceConsentBtn.addEventListener('click', () => {
        const allowed = window.confirm('Allow voice input for this chatbot?');
        if (!allowed) return;
        voiceAllowed = true;
        localStorage.setItem(voiceConsentKey, 'true');
        applyVoiceConsentUI();
        if (voiceBtn) voiceBtn.focus();
    });
}

function setSpeakingState(isSpeaking) {
    if (!ttsStopBtn) return;
    ttsStopBtn.style.display = isSpeaking ? 'inline-flex' : 'none';
    ttsStopBtn.disabled = !isSpeaking;
}

if (ttsStopBtn) {
    setSpeakingState(false);
    ttsStopBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        setSpeakingState(false);
        resetChatIdleTimer();
    });
}

const directionForm = document.getElementById('direction-form');
if (directionForm) {
    directionForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const postcodeInput = document.getElementById('postcode-input');
        const origin = postcodeInput ? postcodeInput.value.trim() : '';
        if (!origin) {
            return;
        }
        const destination = 'DA12 2HA';
        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
        window.open(url, '_blank', 'noopener');
    });
}

// Knowledge base for DayTime Hub information
const knowledgeBase = [
    {
        keywords: ['help', 'do', 'what', 'mission', 'purpose'],
        answer: 'DayTime Hub is a community charity that supports people affected by homelessness, addiction, mental health issues, domestic abuse, and exploitation. We provide a warm breakfast, showers, laundry facilities, clothing, and a safe, welcoming space for everyone.'
    },
    {
        keywords: ['volunteer', 'help', 'volunteering'],
        answer: 'We welcome volunteers! You can help with breakfast service, laundry assistance, welcoming guests, or administrative tasks. Visit our Volunteer page to fill out an application form. We have opportunities Monday through Friday.'
    },
    {
        keywords: ['donate', 'donation', 'give', 'support'],
        answer: 'Your donations help us provide essential services. You can donate money through our secure online system, or contribute non-perishable food items, clothing, blankets, and household goods. Visit our Donate page for details.'
    },
    {
        keywords: ['location', 'where', 'address', 'find'],
        answer: 'We are located at Gravesend Methodist Church Community Centre, 4 Wilfred Street, Gravesend. You can find us on the map on our homepage or contact page.'
    },
    {
        keywords: ['hours', 'time', 'open', 'when'],
        answer: 'DayTime Hub is open Monday through Friday. Our breakfast service and facilities are available during these times. Please check our About page for specific hours.'
    },
    {
        keywords: ['services', 'offer', 'provide', 'facilities'],
        answer: 'We provide: warm breakfast meals, shower facilities, laundry service, clothing assistance, a safe community space, and support for those in need. We also offer guidance and connections to additional support services.'
    },
    {
        keywords: ['contact', 'phone', 'email', 'reach'],
        answer: 'You can contact us through the Contact page on our website. We have a contact form, and you can find our location details and additional information there.'
    },
    {
        keywords: ['gallery', 'photos', 'images', 'see'],
        answer: 'Check out our Gallery page to see photos of our community, volunteers, and the warm atmosphere at DayTime Hub. It showcases the positive impact we make every day.'
    },
    {
        keywords: ['about', 'story', 'history', 'who'],
        answer: 'DayTime Hub is run by Gravesend Methodist Church Community Centre. We have been supporting our community for many years, providing dignity and hope to those who need it most. Our charity number is 1132238.'
    },
    {
        keywords: ['breakfast', 'food', 'meal', 'eat'],
        answer: 'We serve a warm, nutritious breakfast to all our guests. This is a key part of our service, providing not just food but also a welcoming start to the day in a supportive environment.'
    },
    {
        keywords: ['privacy', 'policy', 'data', 'information'],
        answer: 'We respect your privacy and comply with GDPR regulations. Please visit our Privacy Policy page for detailed information about how we handle personal data.'
    }
];

function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'bot-message';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addVoiceNoteMessage(transcript) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message voice-note-message';
    const note = document.createElement('div');
    note.className = 'voice-note voice-note--sent';

    const icon = document.createElement('span');
    icon.className = 'voice-note__icon';
    icon.textContent = '🎙️';

    const label = document.createElement('span');
    label.className = 'voice-note__label';
    label.textContent = 'Voice note';

    const bars = document.createElement('span');
    bars.className = 'voice-note__bars';
    bars.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) {
        bars.appendChild(document.createElement('i'));
    }

    const srOnly = document.createElement('span');
    srOnly.className = 'sr-only';
    srOnly.textContent = transcript || 'Voice note sent.';

    note.appendChild(icon);
    note.appendChild(label);
    note.appendChild(bars);
    messageDiv.appendChild(note);
    messageDiv.appendChild(srOnly);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to find best matching response
function getResponse(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = null;
    let maxMatches = 0;

    for (const item of knowledgeBase) {
        let matches = 0;
        for (const keyword of item.keywords) {
            if (lowerMessage.includes(keyword)) {
                matches++;
            }
        }
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = item;
        }
    }

    if (bestMatch && maxMatches > 0) {
        return bestMatch.answer;
    }

    return 'Hello! I\'m here to help with information about DayTime Hub. Please feel free to ask about our services, volunteering, donating, our location, or anything else you\'d like to know.';
}

function sendMessage(triggeredBySendButton = false) {
    if (!chatInput) return;
    const message = chatInput.value.trim();
    if (message) {
        speakOnNextBotMessage = triggeredBySendButton;
        if (lastInputWasVoice || voiceDraftText) {
            addVoiceNoteMessage(message);
        } else {
            addMessage(message, true);
        }
        const response = getResponse(message);
        setTimeout(() => addMessage(response), 500);
        chatInput.value = '';
        voiceDraftText = '';
        lastInputWasVoice = false;
        updateVoiceStatus('hidden');
        resetChatIdleTimer();
    }
}

// Toggle chat window
chatbotToggle.addEventListener('click', () => {
    const isVisible = chatWindow.style.display === 'flex';
    if (isVisible) {
        // Closing: hide and clear messages
        closeChatWindow();
    } else {
        // Opening: show and add greeting
        chatWindow.style.display = 'flex';
        addMessage('Hello! Thank you for getting in touch. How may I assist you today?');
        const note = document.getElementById('chatbot-note');
        if (note) note.style.display = 'none';
        showMobileChatbot();
        resetChatIdleTimer();
    }
});

// Send message on button click
if (sendBtn) {
    sendBtn.addEventListener('click', () => sendMessage(true));
}

// Send message on Enter key
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(false);
        }
    });

    chatInput.addEventListener('input', () => {
        if (!isListening) {
            voiceDraftText = '';
            lastInputWasVoice = false;
            updateVoiceStatus('hidden');
        }
        resetChatIdleTimer();
    });
}

if (chatWindow) {
    ['click', 'mousemove', 'touchstart', 'keydown'].forEach((eventName) => {
        chatWindow.addEventListener(eventName, resetChatIdleTimer, { passive: true });
    });
}

['scroll', 'touchstart', 'click', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, showMobileChatbot, { passive: true });
});

if (mobileChatMq.matches) {
    scheduleMobileChatPeek();
}

// Voice input
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    recognition.onresult = (event) => {
        if (isSpeaking) {
            return;
        }
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                voiceDraftText += result[0].transcript + ' ';
            } else {
                interimTranscript += result[0].transcript;
            }
        }
        const combined = `${voiceDraftText} ${interimTranscript}`.trim();
        if (chatInput) {
            chatInput.value = combined;
        }
        lastInputWasVoice = true;
        updateVoiceStatus(isListening ? 'recording' : 'idle');
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        addMessage('Sorry, I couldn\'t hear you. Please try again or type your message.');
        updateVoiceStatus('hidden');
    };

    recognition.onend = () => {
        isListening = false;
        if (voiceBtn) voiceBtn.textContent = '🎤';
        updateVoiceStatus(voiceDraftText.trim() ? 'idle' : 'hidden');
    };

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (!voiceAllowed) {
                if (voiceConsentBtn) {
                    voiceConsentBtn.focus();
                }
                updateVoiceStatus('hidden');
                return;
            }
            if (isListening) {
                recognition.stop();
                isListening = false;
                voiceBtn.textContent = '🎤';
                updateVoiceStatus(voiceDraftText.trim() ? 'idle' : 'hidden');
            } else {
                voiceDraftText = '';
                lastInputWasVoice = true;
                recognition.start();
                isListening = true;
                voiceBtn.textContent = '⏹️';
                updateVoiceStatus('recording');
            }
            resetChatIdleTimer();
        });
    }
} else {
    if (voiceBtn) voiceBtn.style.display = 'none';
    addMessage('Voice input is not supported in your browser. Please type your questions.');
}

applyVoiceConsentUI();

// Text-to-speech for responses
function speak(text) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB'; // British English
        utterance.rate = 0.9; // Slower, clearer pacing
        utterance.pitch = 0.9; // Slightly lower for a softer tone
        utterance.volume = 1;
        const speakDelayMs = 250;

        utterance.onstart = () => {
            isSpeaking = true;
            setSpeakingState(true);
            if (recognition && isListening) {
                recognition.stop();
            }
        };
        utterance.onend = () => {
            isSpeaking = false;
            setSpeakingState(false);
        };
        utterance.onerror = () => {
            isSpeaking = false;
            setSpeakingState(false);
        };

        // Wait for voices to load, then select female British voice
        if (speechSynthesis.getVoices().length === 0) {
            const onVoicesChanged = () => {
                speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                setTimeout(() => selectAndSpeak(utterance), speakDelayMs);
            };
            speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
        } else {
            setTimeout(() => selectAndSpeak(utterance), speakDelayMs);
        }

        function selectAndSpeak(utterance) {
            const voices = speechSynthesis.getVoices();
            // Try to find a female British voice
            let selectedVoice = voices.find(voice =>
                voice.lang.startsWith('en-GB') &&
                (voice.name.toLowerCase().includes('female') ||
                    voice.name.toLowerCase().includes('woman') ||
                    voice.name.toLowerCase().includes('zira') ||
                    voice.name.toLowerCase().includes('hazel') ||
                    voice.name.toLowerCase().includes('susan') ||
                    voice.name.toLowerCase().includes('google uk english female') ||
                    voice.name.toLowerCase().includes('uk english female'))
            );

            // If no specific female found, use any British voice
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith('en-GB'));
            }

            // If still no British voice, use any female voice
            if (!selectedVoice) {
                selectedVoice = voices.find(voice =>
                    voice.name.toLowerCase().includes('female') ||
                    voice.name.toLowerCase().includes('woman') ||
                    voice.name.toLowerCase().includes('zira') ||
                    voice.name.toLowerCase().includes('hazel') ||
                    voice.name.toLowerCase().includes('susan')
                );
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            speechSynthesis.speak(utterance);
        }
    }
}
// Modify addMessage to speak bot responses
const originalAddMessage = addMessage;
addMessage = function (message, isUser = false) {
    originalAddMessage(message, isUser);
    if (!isUser && speakOnNextBotMessage) {
        speakOnNextBotMessage = false;
        speak(message);
    }
};

// Offer-card bounce trigger: add 'bounce' class on hover/focus/touch
document.addEventListener('DOMContentLoaded', () => {
    const offerCards = document.querySelectorAll('.offer-card');
    if (!offerCards) return;

    offerCards.forEach(card => {
        const trigger = () => {
            card.classList.remove('bounce');
            // force reflow to restart animation
            void card.offsetWidth;
            card.classList.add('bounce');
        };

        card.addEventListener('mouseenter', trigger);
        card.addEventListener('focus', trigger, true);
        card.addEventListener('touchstart', trigger, { passive: true });

        card.addEventListener('animationend', () => {
            card.classList.remove('bounce');
        });
    });
});

function initCookieBanner() {
    const consentKey = 'cookieConsent';
    const sessionKey = 'cookieBannerDismissed';
    if (sessionStorage.getItem(sessionKey)) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner cookie-banner--side';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');

    banner.innerHTML = `
        <div class="cookie-banner__glow" aria-hidden="true"></div>
        <button class="cookie-banner__close" type="button" aria-label="Close cookie notice" data-consent="dismiss">×</button>
        <div class="cookie-banner__content">
            <span class="cookie-banner__eyebrow">Consent Patch</span>
            <h2 class="cookie-banner__title">Cookies &amp; Care</h2>
            <p>We use cookies to improve your experience. You can accept or decline non-essential cookies. Read our <a href="privacy.html">Privacy Policy</a>.</p>
            <div class="cookie-banner__actions" role="group" aria-label="Cookie choices">
                <button class="btn cookie-banner__btn" data-consent="accept" type="button">Accept</button>
                <button class="btn secondary cookie-banner__btn" data-consent="decline" type="button">Decline</button>
            </div>
        </div>
    `;

    const hideBanner = () => {
        if (banner.classList.contains('cookie-banner--hide')) return;
        banner.classList.add('cookie-banner--hide');
        setTimeout(() => banner.remove(), 450);
    };

    const handleClick = (event) => {
        const action = event.target.getAttribute('data-consent');
        if (!action) return;

        if (action === 'accept') {
            localStorage.setItem(consentKey, 'accepted');
        } else if (action === 'decline') {
            localStorage.setItem(consentKey, 'declined');
        } else {
            localStorage.setItem(consentKey, 'dismissed');
        }

        sessionStorage.setItem(sessionKey, 'true');
        hideBanner();
    };

    banner.addEventListener('click', handleClick);
    document.body.appendChild(banner);

    setTimeout(() => {
        sessionStorage.setItem(sessionKey, 'true');
        hideBanner();
    }, 10000);
}

document.addEventListener('DOMContentLoaded', initCookieBanner);
