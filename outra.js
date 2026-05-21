// Transição de página (Lógica original restaurada)
const transition = document.querySelector('.page-transition');
const flash = document.querySelector('.screen-flash');

window.addEventListener('pageshow', () => {
    if (transition) transition.classList.remove('active');
    if (flash) {
        flash.classList.remove('active');
        void flash.offsetWidth; // forçar reflow
        flash.classList.add('active');
    }
});

// Interceptar links para animação de saída
document.querySelectorAll('a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = this.getAttribute('href');
        
        // Só aplica em links internos que não sejam âncoras na mesma página
        if (target && !target.startsWith('#') && !target.startsWith('mailto:') && !target.startsWith('tel:')) {
            e.preventDefault();
            if (transition) transition.classList.add('active');
            
            setTimeout(() => {
                window.location.href = target;
            }, 800);
        } else if (target && target.startsWith('#') && target !== '#') {
            // Smooth Scroll for Anchor Links
            e.preventDefault();
            const targetElement = document.querySelector(target);
            if(targetElement) {
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