document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Helpers */

// Run a feature safely; when a failure is occuring it never halt other features.
function safeInit(name, fn) {
    try {
        fn();
    } catch (error) {
        console.warn(`Feature "${name}" could not start:`, error);
    }
}

// Throttle scroll work to one run per animation frame.
const scrollCallbacks = [];
function onScroll(callback) {
    scrollCallbacks.push(callback);
}
function startScrollListener() {
    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            scrollCallbacks.forEach(cb => cb());
            ticking = false;
        });
    }, { passive: true });
    scrollCallbacks.forEach(cb => cb());
}

/* 1. Mobile hamburger menu */
function initMobileMenu() {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");
    if (!hamburger || !navLinks) return;

    const setOpen = (open) => {
        navLinks.classList.toggle("open", open);
        hamburger.setAttribute("aria-expanded", String(open));
    };

    hamburger.addEventListener("click", () => {
        setOpen(!navLinks.classList.contains("open"));
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) setOpen(false);
    });
}

/* 2. Active navigation link highlighting (scroll spy) */
function initScrollSpy() {
    const sections = document.querySelectorAll("main section[id]");
    const navItems = document.querySelectorAll(".nav-links a");
    if (!sections.length || !navItems.length) return;

    onScroll(() => {
        let current = sections[0].id;
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 160) current = section.id;
        });

        // Highlights the last link when the bottom of the page is reached
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
            current = sections[sections.length - 1].id;
        }

        navItems.forEach(item => {
            const isActive = item.getAttribute("href") === `#${current}`;
            item.classList.toggle("active", isActive);
            if (isActive) item.setAttribute("aria-current", "page");
            else item.removeAttribute("aria-current");
        });
    });
}

/* 3. Scroll progress bar */
function initScrollProgress() {
    const bar = document.getElementById("scrollProgress");
    if (!bar) return;

    onScroll(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
        bar.style.width = `${percent}%`;
    });
}

/* 4. Back-to-top button to ease navigating back to the top */
function initBackToTop() {
    const button = document.getElementById("backToTop");
    if (!button) return;

    onScroll(() => {
        button.hidden = window.scrollY < 500;
    });

    button.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
}

/* 5. Reveal-on-scroll animation */
function initRevealOnScroll() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
        items.forEach(el => el.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach(el => observer.observe(el));
}

/* 6. Typing effect in the main page (Aesthetic purposes) */
function initTypingEffect() {
    const target = document.getElementById("typedText");
    if (!target || prefersReducedMotion) return;

    const phrases = [
        "Hye.... Welcome to My Portfolio !!!",
        "Click the button below to start :D",
        "psst.... this website is purely to learn Web Development for TMN3223."
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
        const phrase = phrases[phraseIndex];
        charIndex += deleting ? -1 : 1;
        target.textContent = phrase.slice(0, charIndex);

        let delay = deleting ? 40 : 85;
        if (!deleting && charIndex === phrase.length) {
            deleting = true;
            delay = 1600;
        } else if (deleting && charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            delay = 400;
        }
        setTimeout(tick, delay);
    }

    target.textContent = "";
    setTimeout(tick, 600);
}

/* 7. Portrait photo fallback */
function initPortraitFallback() {
    document.querySelectorAll(".portrait-img").forEach(img => {
        const frame = img.closest(".photo-frame");
        if (!frame) return;

        const markMissing = () => frame.classList.add("no-photo");
        img.addEventListener("error", markMissing);
        if (img.complete && img.naturalWidth === 0) markMissing();
    });
}

/* 8. Portrait pop-up */
function initPortraitModal() {
    const trigger = document.getElementById("portraitBtn");
    const modal = document.getElementById("portraitModal");
    if (!trigger || !modal) return;

    const closeButtons = modal.querySelectorAll("[data-close-modal]");
    const closeButton = modal.querySelector(".modal-close");
    let lastFocused = null;

    function getFocusable() {
        return modal.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])");
    }

    function onKeydown(e) {
        if (e.key === "Escape") {
            closeModal();
        } else if (e.key === "Tab") {
            const focusable = getFocusable();
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    function openModal() {
        lastFocused = document.activeElement;
        modal.hidden = false;
        document.body.classList.add("no-scroll");
        document.addEventListener("keydown", onKeydown);
        closeButton.focus();
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("no-scroll");
        document.removeEventListener("keydown", onKeydown);
        if (lastFocused) lastFocused.focus();
    }

    trigger.addEventListener("click", openModal);
    closeButtons.forEach(btn => btn.addEventListener("click", closeModal));
}

/* 9. Project category filter to make it easy to categorize each specified field */
function initProjectFilter() {
    const cards = document.querySelectorAll(".project-item");
    const buttons = document.querySelectorAll(".filter-btn");
    const searchInput = document.getElementById("projectSearch");
    const counter = document.getElementById("projectCount");
    const noResults = document.getElementById("noResults");
    if (!cards.length) return;

    let activeFilter = "all";

    function applyFilters() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        let visible = 0;

        cards.forEach(card => {
            const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
            const matchesSearch = query === "" || card.textContent.toLowerCase().includes(query);
            const show = matchesCategory && matchesSearch;
            card.hidden = !show;
            if (show) visible++;
        });

        if (counter) counter.textContent = `Showing ${visible} of ${cards.length} projects`;
        if (noResults) noResults.hidden = visible !== 0;
    }

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            activeFilter = btn.dataset.filter;
            buttons.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle("active", isActive);
                b.setAttribute("aria-pressed", String(isActive));
            });
            applyFilters();
        });
    });

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    applyFilters();
}

/* 11. Cursor glow on cards */
function initCardGlow() {
    document.querySelectorAll(".glow-card").forEach(card => {
        card.addEventListener("pointermove", (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
            card.style.setProperty("--my", `${e.clientY - rect.top}px`);
        });
    });
}

/* 12. Message character counter */
function initCharCounter() {
    const textarea = document.getElementById("message");
    const counter = document.getElementById("messageCount");
    if (!textarea || !counter) return;

    const max = Number(textarea.getAttribute("maxlength")) || 500;

    function update() {
        const length = textarea.value.length;
        counter.textContent = `${length} / ${max}`;
        counter.classList.toggle("warn", length >= max * 0.9);
    }

    textarea.addEventListener("input", update);
    update();
}

/* Contact details */
const CONTACT = {
    email: "odrihhhhh1506@gmail.com",
    whatsapp: "60103663530",                
    whatsappDisplay: "+60 10-366 3530", 
    linkedin: "https://www.linkedin.com/in/audrey-chan-hui-jing-73b04a340/"
};

/* 13. Direct contact channels either email, WhatsApp, or LinkedIn */
function initContactChannels() {
    const emailLink = document.getElementById("emailLink");
    const whatsappLink = document.getElementById("whatsappLink");
    const linkedinLink = document.getElementById("linkedinLink");
    const copyStatus = document.getElementById("copyStatus");

    if (emailLink) {
        emailLink.href = `mailto:${CONTACT.email}`;
        emailLink.textContent = CONTACT.email;
    }
    if (whatsappLink) {
        whatsappLink.href = `https://wa.me/${CONTACT.whatsapp}`;
        whatsappLink.textContent = CONTACT.whatsappDisplay;
        whatsappLink.target = "_blank";
        whatsappLink.rel = "noopener noreferrer";
        whatsappLink.setAttribute("aria-label", `Chat with me on WhatsApp at ${CONTACT.whatsappDisplay} (opens in a new tab)`);
    }
    if (linkedinLink) {
        linkedinLink.href = CONTACT.linkedin;
        linkedinLink.textContent = CONTACT.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
        linkedinLink.target = "_blank";
        linkedinLink.rel = "noopener noreferrer";
        linkedinLink.setAttribute("aria-label", "Open my LinkedIn profile (opens in a new tab)");
    }

    const copyValues = {
        email: CONTACT.email,
        whatsapp: CONTACT.whatsappDisplay,
        linkedin: CONTACT.linkedin
    };

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
    }

    document.querySelectorAll(".copy-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const key = button.dataset.copy;
            try {
                await copyText(copyValues[key]);
                button.textContent = "Copied!";
                if (copyStatus) copyStatus.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} copied to clipboard.`;
            } catch (error) {
                button.textContent = "Press Ctrl+C";
                if (copyStatus) copyStatus.textContent = "Copy failed. Please select the text and copy it manually.";
            }
            setTimeout(() => { button.textContent = "Copy"; }, 2000);
        });
    });
}

/* 14. Contact form validation and option to send via email or WhatsApp */
function initContactForm() {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
    if (!form) return;

    const fields = {
        name: {
            input: document.getElementById("name"),
            error: document.getElementById("nameError"),
            validate: (v) => {
                if (v === "") return "Please enter your name.";
                if (v.length < 2) return "Your name must be at least 2 characters.";
                return "";
            }
        },
        email: {
            input: document.getElementById("email"),
            error: document.getElementById("emailError"),
            validate: (v) => {
                if (v === "") return "Please enter your email.";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address.";
                return "";
            }
        },
        message: {
            input: document.getElementById("message"),
            error: document.getElementById("messageError"),
            validate: (v) => {
                if (v === "") return "Please write a message.";
                if (v.length < 10) return "Your message must be at least 10 characters.";
                return "";
            }
        }
    };

    function validateField(field) {
        const message = field.validate(field.input.value.trim());
        field.error.textContent = message;
        field.input.setAttribute("aria-invalid", message ? "true" : "false");
        return message === "";
    }

    // Validate each field as soon as the user leaves it, then keep it fresh while typing
    Object.values(fields).forEach(field => {
        field.input.addEventListener("blur", () => validateField(field));
        field.input.addEventListener("input", () => {
            if (field.input.getAttribute("aria-invalid") === "true") validateField(field);
        });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (status) status.textContent = "";

        const results = Object.values(fields).map(validateField);
        const firstInvalid = Object.values(fields).find(f => f.input.getAttribute("aria-invalid") === "true");

        if (firstInvalid) {
            firstInvalid.input.focus();
            return;
        }

        if (results.every(Boolean)) {
            const channel = e.submitter && e.submitter.dataset.channel ? e.submitter.dataset.channel : "email";
            const name = fields.name.input.value.trim();
            const email = fields.email.input.value.trim();
            const message = fields.message.input.value.trim();

            if (channel === "whatsapp") {
                const text = `Hi Audrey, I'm ${name} (${email}).\n\n${message}`; //for example, the message directs to Whatsapp and users are free to edit however they like
                window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
                if (status) status.textContent = "Opening WhatsApp with your message. Press send there to deliver it.";
            } else {
                const subject = `Portfolio enquiry from ${name}`;
                const body = `${message}\n\nFrom: ${name} (${email})`; //for example, it directs to the users preferred choice of email app and users are free to add or edit any inquiries
                window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                if (status) status.textContent = "Opening your email app with your message. Press send there to deliver it.";
            }
            form.reset();
            Object.values(fields).forEach(f => f.input.setAttribute("aria-invalid", "false"));
            const counter = document.getElementById("messageCount");
            if (counter) counter.textContent = "0 / 500";
        }
    });
}

/* 14. Footer year */
function initFooterYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
}

/* Start everything */
document.addEventListener("DOMContentLoaded", () => {
    safeInit("mobile menu", initMobileMenu);
    safeInit("scroll spy", initScrollSpy);
    safeInit("scroll progress", initScrollProgress);
    safeInit("back to top", initBackToTop);
    safeInit("reveal on scroll", initRevealOnScroll);
    safeInit("typing effect", initTypingEffect);
    safeInit("portrait fallback", initPortraitFallback);
    safeInit("portrait modal", initPortraitModal);
    safeInit("project filter", initProjectFilter);
    safeInit("card glow", initCardGlow);
    safeInit("character counter", initCharCounter);
    safeInit("contact channels", initContactChannels);
    safeInit("contact form", initContactForm);
    safeInit("footer year", initFooterYear);

    startScrollListener();
});
