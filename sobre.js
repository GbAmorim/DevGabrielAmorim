// Efeito de flash na tela ao carregar
const flash = document.querySelector('.screen-flash');

window.addEventListener('pageshow', () => {
    if (flash) {
        flash.classList.remove('active');
        void flash.offsetWidth; // forçar reflow
        flash.classList.add('active');
    }
});

// Interceptar links apenas para rolagem suave
document.querySelectorAll('a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = this.getAttribute('href');

        if (target && target.startsWith('#') && target !== '#') {
            // Smooth Scroll for Anchor Links
            e.preventDefault();
            const targetElement = document.querySelector(target);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// GSAP Animations for Modern Apple-style Portfolio
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Hero Animations
        const tl = gsap.timeline();
        tl.from(".hero-subtitle", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.2 })
            .from(".hero-title", { y: 50, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.5")
            .from(".hero-description", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
            .from(".hero-actions", { y: 20, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
            .from(".marquee-container", { opacity: 0, duration: 1.5, ease: "power2.inOut" }, "-=0.5");

        // ScrollTrigger: Fade Up General
        gsap.utils.toArray('.gsap-fade-up').forEach(element => {
            if (!element.closest('.hero-section')) {
                gsap.from(element, {
                    scrollTrigger: {
                        trigger: element,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
                });
            }
        });

        // ScrollTrigger: Reveal
        gsap.utils.toArray('.gsap-reveal').forEach(element => {
            if (!element.closest('.hero-section')) {
                gsap.from(element, {
                    scrollTrigger: {
                        trigger: element,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    },
                    y: 60, opacity: 0, duration: 1, ease: "power4.out"
                });
            }
        });

        // ScrollTrigger: Cards (Projetos e Especialidades)
        gsap.utils.toArray('.gsap-stagger-card').forEach((element) => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top 90%", // Dispara mais cedo para evitar que não carregue
                    toggleActions: "play none none reverse"
                },
                y: 50, opacity: 0, duration: 0.8, ease: "back.out(1.2)"
            });
        });

        // Left / Right Fades
        gsap.utils.toArray('.gsap-fade-right').forEach(element => {
            gsap.from(element, {
                scrollTrigger: { trigger: element, start: "top 80%", toggleActions: "play none none reverse" },
                x: -50, opacity: 0, duration: 1, ease: "power3.out"
            });
        });

        gsap.utils.toArray('.gsap-fade-left').forEach(element => {
            gsap.from(element, {
                scrollTrigger: { trigger: element, start: "top 80%", toggleActions: "play none none reverse" },
                x: 50, opacity: 0, duration: 1, ease: "power3.out"
            });
        });

        // Refresh triggers just in case of layout shifts
        window.addEventListener('load', () => {
            ScrollTrigger.refresh();
        });
    }
});

// Botão Voltar ao Topo
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Interceptar form submission para popup customizado
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = "Enviando...";
        submitBtn.disabled = true;

        fetch(contactForm.action, {
            method: 'POST',
            body: new FormData(contactForm),
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                showPopup("Mensagem enviada com sucesso!", true);
                contactForm.reset();
            } else {
                showPopup("Ocorreu um erro ao enviar. Tente novamente.", false);
            }
        })
        .catch(error => {
            showPopup("Erro de conexão. Tente novamente.", false);
        })
        .finally(() => {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    });

    function showPopup(message, isSuccess) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            padding: 15px 25px;
            border-radius: 8px;
            background: ${isSuccess ? 'rgba(40, 167, 69, 0.95)' : 'rgba(220, 53, 69, 0.95)'};
            color: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            opacity: 0;
            transition: all 0.4s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        popup.textContent = message;

        document.body.appendChild(popup);

        void popup.offsetWidth;

        popup.style.opacity = '1';
        popup.style.transform = 'translateX(-50%) translateY(0)';

        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => popup.remove(), 400);
        }, 3000);
    }
}