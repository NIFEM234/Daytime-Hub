// Google Analytics (GA4) loader: reads `meta[name="ga-measurement-id"]` and injects gtag if present
(function loadGAFromMeta() {
    try {
        const meta = document.querySelector('meta[name="ga-measurement-id"]');
        const id = meta?.getAttribute('content')?.trim();
        if (!id) return;

        // Inject gtag script
        const s = document.createElement('script');
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
        document.head.appendChild(s);

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); } // eslint-disable-line no-inner-declarations
        window.gtag = window.gtag || gtag;
        gtag('js', new Date());
        gtag('config', id, { send_page_view: true });
    } catch (e) {
        // fail silently
        console.warn('GA loader error', e);
    }
})();

// Gallery filter section switching and animation
document.addEventListener('DOMContentLoaded', function () {
    // Mobile nav toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navbar = document.querySelector('.navbar');
    const siteNav = document.getElementById('site-nav');
    if (navToggle && navbar && siteNav) {
        const setOpen = (isOpen) => {
            navbar.setAttribute('data-open', isOpen ? 'true' : 'false');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        navToggle.addEventListener('click', (e) => {
            const open = navbar.getAttribute('data-open') === 'true';
            setOpen(!open);
        });

        // Close on escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setOpen(false);
        });

        // NOTE: we intentionally do NOT close the nav when clicking elsewhere on the page.
        // The nav should remain visible until the user explicitly closes it via the
        // toggle (X) or presses Escape. This prevents it disappearing while the user
        // scrolls or interacts with page content.
    }
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

        // If the mobile nav is currently open, keep the navbar visible so the
        // dropdown remains on-screen while the user scrolls. Only hide when
        // nav is closed.
        const isNavOpen = navbar.getAttribute('data-open') === 'true';

        if (currentY <= 10) {
            navbar.classList.remove('navbar--hidden');
            navbar.classList.remove('navbar--scrolled');
        } else if (!isNavOpen) {
            if (delta > 8) {
                navbar.classList.add('navbar--hidden');
            } else if (delta < -8) {
                navbar.classList.remove('navbar--hidden');
            }
        } else {
            // nav open -> ensure navbar is visible
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
    line.innerHTML = `Website created and last updated ${formattedDate} - by <a href="https://mail.google.com/mail/?view=cm&fs=1&to=oluwanifemijosiah02@gmail.com" target="_blank" rel="noopener noreferrer">oluwanifemijosiah02@gmail.com</a>, <a href="tel:+447587993762">07587993762</a> <a class="footer-church-link" href="http://www.gravesendmethodistchurch.org.uk/" target="_blank" rel="noopener noreferrer">Gravesend Methodist Church Link</a>`;

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

// About page: play-overlay and interactive video enhancements
document.addEventListener('DOMContentLoaded', function () {
    const containers = document.querySelectorAll('.video-hero-container');
    if (!containers.length) return;

    containers.forEach((container) => {
        const video = container.querySelector('video');
        const overlay = container.querySelector('.video-overlay');
        const btn = container.querySelector('.video-play-button');
        if (!video) return;

        const play = async () => {
            try {
                // attempt to play (muted autoplay could be blocked, explicit user click works)
                await video.play();
                container.classList.add('video-playing');
                video.setAttribute('controls', '');
            } catch (err) {
                console.warn('Unable to play video automatically', err);
            }
        };

        const pause = () => {
            try {
                video.pause();
                container.classList.remove('video-playing');
            } catch (err) {
                // ignore
            }
        };

        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                play();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', (e) => {
                play();
            });
        }

        video.addEventListener('play', () => container.classList.add('video-playing'));
        video.addEventListener('pause', () => container.classList.remove('video-playing'));
        video.addEventListener('ended', () => {
            container.classList.remove('video-playing');
            try { video.currentTime = 0; } catch (e) { }
        });
    });
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

// Friendly AI-like chatbot: polite, helpful, and concise canned responses
document.addEventListener('DOMContentLoaded', function () {
    const chatbot = document.getElementById('chatbot');
    if (!chatbot) return;

    const toggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chat-window');
    const messages = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Accessibility: ensure messages container is announced
    if (messages) messages.setAttribute('aria-live', 'polite');

    const openChat = () => {
        chatbot.classList.add('chatbot--open');
        if (chatWindow) {
            chatWindow.style.display = 'flex';
            chatWindow.setAttribute('aria-hidden', 'false');
        }
        input?.focus();
    };

    const renderMessageContent = (text) => {
        // Convert simple filename hints into links and preserve plain text otherwise
        const wrapper = document.createElement('div');
        // light parsing for page hints like "donate.html" -> anchor
        const parts = text.split(/(\b[a-zA-Z0-9_-]+\.html\b)/g);
        parts.forEach((part) => {
            if (/\b[a-zA-Z0-9_-]+\.html\b/.test(part)) {
                const a = document.createElement('a');
                a.href = part;
                a.textContent = part.replace('.html', '').replace(/[-_]/g, ' ').replace(/(^.|\s.)/g, s => s.toUpperCase());
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.color = 'var(--primary)';
                a.style.textDecoration = 'underline';
                wrapper.appendChild(a);
            } else {
                wrapper.appendChild(document.createTextNode(part));
            }
        });
        return wrapper;
    };

    const appendMessage = (who, text) => {
        if (!messages) return;
        const el = document.createElement('div');
        el.className = who === 'user' ? 'user-message' : 'bot-message';
        el.setAttribute('role', 'article');
        const content = renderMessageContent(text);
        el.appendChild(content);
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight + 200;
    };

    const appendBotMessage = (text, suggestions) => {
        // slight delay to feel conversational
        const typing = document.createElement('div');
        typing.className = 'bot-message typing';
        typing.textContent = 'Typing…';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight + 200;
        setTimeout(() => {
            typing.remove();
            appendMessage('bot', text);
            if (Array.isArray(suggestions) && suggestions.length) appendSuggestions(suggestions);
        }, 500 + Math.min(1000, text.length * 12));
    };

    const appendSuggestions = (items) => {
        if (!messages) return;
        const wrap = document.createElement('div');
        wrap.className = 'chat-suggestions';
        items.forEach((it) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chat-suggestion';
            btn.textContent = it;
            btn.addEventListener('click', () => {
                handleUser(it);
            });
            wrap.appendChild(btn);
        });
        messages.appendChild(wrap);
        messages.scrollTop = messages.scrollHeight + 200;
    };

    const keywordReply = (text) => {
        const t = (text || '').toLowerCase().trim();
        // greetings and short responses
        if (/^(hi|hello|hey|hiya|yo|good morning|good afternoon|good evening|i)$/i.test(t) || t.length <= 2 && /^[a-z]$/i.test(t)) {
            return { text: `Hi there! I'm the DayTime Hub helper — I'm here to be helpful and kind. How can I assist you today?`, suggestions: ['Opening hours', 'Donate', 'Volunteer', 'Contact'] };
        }
        // exact-ish patterns and helpful suggestions
        if (/\b(open|hours|when)\b/.test(t)) return { text: `We're open on Monday, Wednesday and Friday from 10:00–12:00. You're always welcome to drop by — would you like a map or directions?`, suggestions: ['Get directions', 'Contact'] };
        if (/\b(donate|donation|give)\b/.test(t)) return { text: `Thank you — donations make a real difference to our work. You can give via the Donate page (donate.html) or contact us to arrange a gift. Would you like the Donate page?`, suggestions: ['Open Donate page', 'How donations are used'] };
        if (/\b(volunt|volunteer|help out)\b/.test(t)) return { text: `That's wonderful — we welcome volunteers. See the Volunteer page for roles and the application form (volunteer.html). Would you like to view it?`, suggestions: ['Open Volunteer page'] };
        if (/\b(contact|phone|email|reach)\b/.test(t)) return { text: `You can call 01474 328249 or email communitycentremanager@gmail.com. I can open the Contact page for you.`, suggestions: ['Open Contact page'] };
        if (/\b(address|where|location|map)\b/.test(t)) return { text: `We are at 4 Wilfred Street, Gravesend, DA12 2HA. Here's a Google Maps link: https://maps.google.com?q=4+Wilfred+Street+Gravesend`, suggestions: ['Open Maps', 'Get directions'] };
        if (/\b(service|services|help|support)\b/.test(t)) return { text: `We offer breakfast, showers, laundry, advice and partner support. Tell me which service you're interested in and I can give more detail.`, suggestions: ['Breakfast', 'Showers', 'Advice'] };
        if (/\b(gallery|photos)\b/.test(t)) return { text: `See photos on the Gallery page (gallery.html) to get a feel for our activities.`, suggestions: ['Open Gallery page'] };
        if (/\b(apply|application)\b/.test(t)) return { text: `Do you mean applying to volunteer, or applying for support? I can point you to the right page.`, suggestions: ['Volunteer', 'Support'] };
        if (/\b(thank|thanks|cheers)\b/.test(t)) return { text: `You're very welcome — happy to help!` };
        return null;
    };

    const handleUser = (raw) => {
        const text = (raw || '').trim();
        if (!text) {
            // If the user has already sent messages, don't repeat the 'No worries' prompt
            const hasUserMsg = messages && messages.querySelector && messages.querySelector('.user-message');
            if (!hasUserMsg) {
                appendBotMessage("No worries — when you're ready, type a short question. I'm friendly and happy to help!");
            }
            return;
        }
        // append user message and clear input
        appendMessage('user', text);
        if (input) { input.value = ''; input.focus(); }

        const quick = keywordReply(text);
        if (quick) {
            // quick may be object with text and suggestions
            if (typeof quick === 'string') appendBotMessage(quick);
            else appendBotMessage(quick.text, quick.suggestions || []);
            return;
        }

        // If nothing matched, respond helpfully and offer choices
        appendBotMessage("That's a great question — I can help. Could you tell me whether you mean Opening hours, Donate, Volunteer or Contact?", ['Opening hours', 'Donate', 'Volunteer', 'Contact']);
    };

    // Toggle open/close on button click / keyboard
    const closeChat = () => {
        chatbot.classList.remove('chatbot--open');
        if (chatWindow) {
            chatWindow.style.display = 'none';
            chatWindow.setAttribute('aria-hidden', 'true');
        }
        if (input) input.blur();
        // clear messages so chat is refreshed next open
        if (messages) messages.innerHTML = '';
    };

    const toggleChat = () => {
        const isOpen = chatbot.classList.contains('chatbot--open');
        if (isOpen) closeChat(); else openChat();
    };

    if (toggle) {
        toggle.addEventListener('click', (e) => { e.preventDefault(); toggleChat(); });
        toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChat(); } });
    }

    if (sendBtn) sendBtn.addEventListener('click', () => handleUser(input?.value));
    if (input) input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUser(input.value);
        }
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

/* Splash screen control: hide on window load or after timeout */
(function () {
    try {
        const splash = document.getElementById('dth-splash');
        if (!splash) return;

        // duration in ms for the fake loading progress (tweak as desired)
        const splashDuration = 2000;

        // expose duration to CSS via variable so the progress-fill animation matches
        try { splash.style.setProperty('--splash-duration', splashDuration + 'ms'); } catch (e) { }

        let removed = false;

        const doHide = () => {
            if (removed) return;
            removed = true;
            splash.classList.add('splash-hidden');
            // restore scrolling
            document.body.classList.remove('splash-visible');
            // notify other code that the splash has been hidden
            try { window.dispatchEvent(new Event('dth-splash-hidden')); } catch (e) { }
            setTimeout(() => {
                try { splash.remove(); } catch (e) { /* ignore */ }
            }, 420);
        };

        // Start progress animation and hide when it completes.
        const progressFill = splash.querySelector('.dth-splash__progress-fill');
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (progressFill && !prefersReduced) {
            // update aria-valuenow during the animation for screen readers
            const start = performance.now();
            const step = (now) => {
                const elapsed = Math.min(now - start, splashDuration);
                const pct = Math.round((elapsed / splashDuration) * 100);
                progressFill.setAttribute('aria-valuenow', String(pct));
                if (elapsed < splashDuration && !removed) {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);

            // listen for animation end on the fill element
            progressFill.addEventListener('animationend', () => {
                try { progressFill.setAttribute('aria-valuenow', '100'); } catch (e) { }
                doHide();
            }, { once: true });
        } else {
            // Reduced motion: just wait the duration then hide
            setTimeout(doHide, splashDuration);
        }

        // Also hide when resources finished loading (short delay after load)
        window.addEventListener('load', () => {
            setTimeout(() => {
                // ensure we only hide after at least the splashDuration has completed
                // if the progress animation is still running, doHide will be called by animationend
                if (!removed) doHide();
            }, 160);
        }, { once: true });

        // Fallback: ensure splash doesn't hang longer than 5s
        setTimeout(() => { doHide(); }, Math.max(3000, splashDuration + 500));

        // Accessibility: allow hiding with touch or click (small devices)
        splash.addEventListener('click', doHide);
    } catch (e) {
        // non-fatal
        console.warn('Splash init error', e);
    }
})();

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
// Increase idle timeout so the chatbot stays visible a bit longer before auto-hiding
const chatIdleMs = 15000;
// Mobile peek delay (only used for a single initial peek unless previously seen)
const mobileChatPeekMs = 9000;
const mobileChatPeekClass = 'chatbot--peek';
const mobileChatMq = window.matchMedia('(max-width: 768px)');
let mobileChatPeekTimer;

function scheduleMobileChatPeek() {
    if (!chatbot || !mobileChatMq.matches) return;
    clearTimeout(mobileChatPeekTimer);
    // Only show the initial mobile peek if the user hasn't already seen it.
    try {
        const seen = window.localStorage.getItem('chatbotPeekSeen') === 'true';
        if (seen) return;
    } catch (e) {
        // ignore storage errors and allow peek
    }
    mobileChatPeekTimer = setTimeout(() => {
        if (chatWindow && chatWindow.style.display === 'flex') return;
        chatbot.classList.add(mobileChatPeekClass);
        try { window.localStorage.setItem('chatbotPeekSeen', 'true'); } catch (e) { }
    }, mobileChatPeekMs);
}

function showMobileChatbot() {
    if (!chatbot || !mobileChatMq.matches) return;
    // Explicit show: remove peek state so the full button is visible.
    chatbot.classList.remove(mobileChatPeekClass);
}

function closeChatWindow() {
    if (!chatWindow || !chatMessages) return;
    chatWindow.style.display = 'none';
    chatMessages.innerHTML = '';
    const note = document.getElementById('chatbot-note');
    if (note) note.style.display = 'block';
    // Stop any active voice recognition or speech when chat is closed.
    try {
        if (recognition && isListening) {
            recognition.stop();
            isListening = false;
            if (voiceBtn) voiceBtn.textContent = '🎤';
        }
    } catch (e) {
        console.error('Error stopping recognition on close:', e);
    }

    try {
        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) {
            speechSynthesis.cancel();
            isSpeaking = false;
            setSpeakingState(false);
        }
    } catch (e) {
        console.error('Error cancelling speech on close:', e);
    }

    // Reset voice UI state
    voiceDraftText = '';
    lastInputWasVoice = false;
    updateVoiceStatus('hidden');

    // Do not automatically schedule another peek after closing due to inactivity.
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
        // Mark that the next bot message should be spoken because the user just asked a question.
        // Speak for any explicit user send (button, Enter, or voice note).
        speakOnNextBotMessage = true;
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

// Do not auto-show the chatbot on general page activity (scroll/click/keys).
// Only schedule an initial peek on mobile once, and thereafter only open when the
// user explicitly clicks the chatbot toggle.
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
    // Only show the cookie banner on the homepage
    if (!document.body.classList.contains('home')) return;

    const consentKey = 'cookieConsent';
    const sessionKey = 'cookieBannerDismissed';
    if (sessionStorage.getItem(sessionKey)) return;

    const showBanner = () => {
        // If dismiss recorded while waiting, abort
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

        // Auto-hide after 10s and mark session dismissed
        setTimeout(() => {
            sessionStorage.setItem(sessionKey, 'true');
            hideBanner();
        }, 10000);
    };

    // If splash present, wait for splash to be hidden before showing cookie banner
    const splash = document.getElementById('dth-splash');
    if (splash) {
        const onHidden = () => {
            showBanner();
        };
        // If already hidden, show immediately
        window.addEventListener('dth-splash-hidden', onHidden, { once: true });
        // Fallback in case event not fired
        setTimeout(() => { showBanner(); }, 3200);
    } else {
        showBanner();
    }
}

document.addEventListener('DOMContentLoaded', initCookieBanner);
