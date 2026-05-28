// Registra o Plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Detecção de mobile para otimizações de performance
const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
    || (window.innerWidth <= 900 || window.innerHeight > window.innerWidth);

// Inicialização do Lenis (Smooth Scroll) — usando window padrão
const lenis = new Lenis({
    duration: isMobileDevice ? 0.8 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false, // Permite o feeling nativo no touch
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/**
 * ==========================================
 * 1. CONFIGURAÇÃO DO ENQUADRAMENTO DA CÂMERA
 * ==========================================
 */
window.addEventListener('load', () => {
    const zoomConfig = {
        // ESTADO INICIAL (No topo da página)
        // Câmera levemente acima e à direita, olhando para o computador
        initialCamera: { x: 0, y: 2.5, z: -1.8 },
        initialLookAt: { x: -13, y: 3, z: -7.2 },

        // ESTADO FINAL (calculado dinamicamente após carregar o GLB)
        targetCamera: { x: 0, y: 0, z: 0 },
        targetLookAt: { x: 0, y: 0, z: 0 },

        // Distância da câmera à tela no fim do scroll
        // Quanto MENOR, mais perto (0.1 = praticamente "dentro" da tela)
        cameraDistance: 0.15
    };


    /**
     * ==========================================
     * 2. CONFIGURAÇÃO BÁSICA DO THREE.JS
     * ==========================================
     */
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    // Fundo preto na cena 3D — NÃO interfere nas cores do modelo!
    // Sem isso + alpha:true, o background do CSS "sangra" pelo canvas.
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    const currentLookAt = {
        x: zoomConfig.initialLookAt.x,
        y: zoomConfig.initialLookAt.y,
        z: zoomConfig.initialLookAt.z
    };

    camera.position.set(zoomConfig.initialCamera.x, zoomConfig.initialCamera.y, zoomConfig.initialCamera.z);
    camera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !isMobileDevice, // Desativa antialiasing no mobile para ganhar performance
        powerPreference: isMobileDevice ? 'low-power' : 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // No mobile, limita o pixel ratio a 1 para reduzir carga de GPU (melhora drástica de performance)
    renderer.setPixelRatio(isMobileDevice ? 1 : Math.min(window.devicePixelRatio, 2));

    // outputEncoding GARANTE que as cores do GLB fiquem fiéis ao Blender.
    // Sem isso, modelos PBR (.glb) ficam escuros/lavados.
    renderer.outputEncoding = THREE.sRGBEncoding;

    // NÃO usar toneMapping — ele altera as cores originais!
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;


    /**
     * ==========================================
     * 2.1. ILUMINAÇÃO
     * ==========================================
     */
    // Luz ambiente suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // Luz direcional principal (simula sol/teto)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
    directionalLight.position.set(3, 8, 3);
    scene.add(directionalLight);

    // Contra-luz para preencher sombras
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.1);
    fillLight.position.set(-3, 8, -3);
    scene.add(fillLight);

    // Luz que simula o brilho emitido pela tela do monitor (será posicionada no loader)
    const screenLight = new THREE.PointLight(0xffffff, 3.0, 15);
    // screenLight.position.set(0, 0, 0); // Inicializada no loader


    /**
     * ==========================================
     * 3. CARREGAMENTO DO MODELO 3D
     * ==========================================
     */
    const loader = new THREE.GLTFLoader();
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    const modelPath = 'computador.glb';

    /**
     * --- ANIMAÇÃO CANVAS PARA A TELA DO MONITOR ---
     * Cria um canvas offscreen que desenha "cards" animados
     * simulando projetos/vídeos passando. Funciona sem CORS!
     */
    const screenCanvas = document.createElement('canvas');
    // No mobile renderizamos a tela do monitor em menor resolução para poupar a CPU/GPU
    screenCanvas.width = isMobileDevice ? 256 : 512;
    screenCanvas.height = isMobileDevice ? 144 : 288; // ~16:9
    const ctx = screenCanvas.getContext('2d');

    // Vídeo fonte da tela
    const video = document.getElementById('video-source');
    // Garantir que o vídeo tente dar play (necessário interação ou ser mudo)
    video.play().catch(e => console.log("Auto-play prevenido, aguardando interação:", e));

    // Canvas auxiliar de 1x1 para capturar a cor média da tela sem pesar a performance
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 1;
    sampleCanvas.height = 1;
    const sampleCtx = sampleCanvas.getContext('2d');

    function drawScreenContent() {
        const w = screenCanvas.width;
        const h = screenCanvas.height;
        // 1. Reseta qualquer transformação anterior e limpa a tela
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        // 2. Aplica a inversão para o texto ficar correto (Olá)
        ctx.translate(w, 0);
        ctx.scale(-1, 1);

        if (video.readyState >= video.HAVE_CURRENT_DATA) {
            // Desenha o vídeo ocupando toda a área do canvas
            ctx.drawImage(video, 0, 0, w, h);
        } else {
            // Placeholder enquanto o vídeo carrega
            ctx.fillStyle = '#000';
            // ctx.fillRect(0, 0, w, h);
            // ctx.fillStyle = '#fff';
            // ctx.font = '14px Arial';
            // ctx.textAlign = 'center';
            // ctx.textBaseline = 'middle';
            // ctx.fillText('Carregando vídeo...', w / 2, h / 2);
        }
    }

    // Atualiza a textura a cada frame
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;
    screenTexture.encoding = THREE.sRGBEncoding;

    // Ajuste de rotação para alinhar o vídeo horizontalmente no modelo GLB
    screenTexture.center.set(0.5, 0.5);
    screenTexture.rotation = Math.PI / 2;

    // Material da tela — emissivo para parecer que a tela está "acesa"
    const screenMaterial = new THREE.MeshStandardMaterial({
        map: screenTexture,
        emissive: 0xffffff,
        emissiveMap: screenTexture,
        emissiveIntensity: 4,
        side: THREE.DoubleSide,
        toneMapped: false
    });

    // Grupo do computador
    const pcGroup = new THREE.Group();
    scene.add(pcGroup);

    let telaMesh = null;

    loader.load(modelPath, (gltf) => {
        const computerModel = gltf.scene;

        // Debug: lista todos os meshes do GLB com detalhes
        console.log('--- MESHES NO GLB ---');
        computerModel.traverse((child) => {
            if (child.isMesh) {
                child.geometry.computeBoundingBox();
                const size = new THREE.Vector3();
                child.geometry.boundingBox.getSize(size);
                console.log(`Mesh: "${child.name}" | Material: "${child.material?.name || '-'}" | Tamanho: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
            }
        });

        // Coleta TODOS os planos do modelo
        const allPlanos = [];
        computerModel.traverse((child) => {
            if (child.isMesh) {
                const n = child.name.toLowerCase();
                if (n.includes('plano') || n.includes('plane')) {
                    allPlanos.push(child);
                }
            }
        });

        console.log(`Total de planos encontrados: ${allPlanos.length}`);
        allPlanos.forEach((p, i) => {
            p.geometry.computeBoundingBox();
            const s = new THREE.Vector3();
            p.geometry.boundingBox.getSize(s);
            console.log(`  Plano[${i}]: "${p.name}" | Size: ${s.x.toFixed(3)} x ${s.y.toFixed(3)} x ${s.z.toFixed(3)}`);
        });

        // Plano[0] = tela do monitor (onde o conteúdo aparece)
        // Plano[1+] = outros planos (mesa, chão, etc) — NÃO MEXER
        if (allPlanos.length > 0) {
            allPlanos[0].material = screenMaterial;
            telaMesh = allPlanos[0];
            console.log(`>>> TELA DO MONITOR: "${allPlanos[0].name}"`);

            // Adiciona a luz diretamente à tela para que ela siga o movimento e rotação
            telaMesh.add(screenLight);
            // Posiciona a luz um pouco mais à frente e inclinada para baixo para pegar no teclado
            // Em coordenadas locais: X=centro, Y=abaixo do centro, Z=frente
            screenLight.position.set(0, -0.2, 0.4);
        }

        pcGroup.add(computerModel);

        // RESPONSIVIDADE DO MODELO 3D
        const isMobile = window.innerWidth <= 900 || window.innerHeight > window.innerWidth;

        if (isMobile) {
            // Ajustes para Celular: mais centralizado, mais para cima e menor
            pcGroup.position.set(0, -0.5, 2);
            pcGroup.scale.set(1.8, 1.8, 1.8);
            pcGroup.rotation.set(0, -Math.PI / 6, 0);
        } else {
            // Desktop: POSIÇÃO — direita do usuário
            pcGroup.position.set(6, -0.2, 6);
            // ESCALA — ampliado
            pcGroup.scale.set(3.5, 3.5, 3.5);
            // ROTAÇÃO — um pouco mais virado pra mostrar a tela
            pcGroup.rotation.set(0, -Math.PI / 5, 0);
        }

        // Calcula os alvos da câmera baseados na posição da tela
        if (telaMesh) {
            telaMesh.geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            telaMesh.geometry.boundingBox.getCenter(center);

            // Calcula a normal do plano para saber a direção "pra frente"
            telaMesh.geometry.computeVertexNormals();
            const normalAttr = telaMesh.geometry.getAttribute('normal');
            const faceNormal = new THREE.Vector3(
                normalAttr.getX(0),
                normalAttr.getY(0),
                normalAttr.getZ(0)
            ).normalize();

            const screenCenterTarget = new THREE.Object3D();
            screenCenterTarget.position.copy(center);
            telaMesh.add(screenCenterTarget);

            // Posiciona a câmera na direção da normal do plano
            const cameraTarget = new THREE.Object3D();
            cameraTarget.position.set(
                center.x + faceNormal.x * zoomConfig.cameraDistance,
                center.y + faceNormal.y * zoomConfig.cameraDistance,
                center.z + faceNormal.z * zoomConfig.cameraDistance
            );
            telaMesh.add(cameraTarget);

            // Salva rotação, zera para calcular posição world, restaura
            const startRotation = pcGroup.rotation.y;
            pcGroup.rotation.set(0, 0, 0);
            pcGroup.updateMatrixWorld(true);

            const worldScreenCenter = new THREE.Vector3();
            screenCenterTarget.getWorldPosition(worldScreenCenter);

            const worldCameraTarget = new THREE.Vector3();
            cameraTarget.getWorldPosition(worldCameraTarget);

            zoomConfig.targetLookAt = { x: worldScreenCenter.x, y: worldScreenCenter.y, z: worldScreenCenter.z };
            zoomConfig.targetCamera = { x: worldCameraTarget.x, y: worldCameraTarget.y, z: worldCameraTarget.z };

            pcGroup.rotation.set(0, startRotation, 0);

            console.log('Normal do plano:', faceNormal);
            console.log('Target Camera:', zoomConfig.targetCamera);
            console.log('Target LookAt:', zoomConfig.targetLookAt);
        }

        setupScrollAnimation();
    }, undefined, (error) => {
        console.error('Falha ao carregar o modelo 3D:', error);
    });


    /**
     * ==========================================
     * 4. ANIMAÇÃO DE ZOOM COM SCROLL (GSAP)
     * ==========================================
     */
    function setupScrollAnimation() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".scroll-content",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5
            }
        });

        // Move a câmera até em frente à tela
        tl.to(camera.position, {
            x: zoomConfig.targetCamera.x,
            y: zoomConfig.targetCamera.y,
            z: zoomConfig.targetCamera.z,
            ease: "power2.inOut"
        }, 0);

        // Move o foco (lookAt) para o centro da tela
        tl.to(currentLookAt, {
            x: zoomConfig.targetLookAt.x,
            y: zoomConfig.targetLookAt.y,
            z: zoomConfig.targetLookAt.z,
            ease: "power2.inOut",
            onUpdate: () => {
                camera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z);
            }
        }, 0);

        // Remove a rotação do modelo para a tela ficar 100% de frente
        tl.to(pcGroup.rotation, {
            x: 0,
            y: 0,
            z: 0,
            ease: "power2.inOut"
        }, 0);

        // Esconde o texto conforme chega na tela
        tl.to(".scroll-content", {
            opacity: 0,
            ease: "power2.in",
            scrollTrigger: {
                trigger: ".fade-out-section",
                start: "top center",
                end: "bottom bottom",
                scrub: 1
            }
        });

        ScrollTrigger.create({
            trigger: ".nav-trigger-section",
            start: "top bottom",
            onEnter: () => {
                window.location.href = 'sobre.html';
            }
        });
    }


    /**
     * ==========================================
     * 5. LOOP E RESPONSIVIDADE
     * ==========================================
     */

    // Controle de FPS para mobile — renderiza no máximo a cada ~33ms (30fps) no mobile
    const TARGET_FPS = isMobileDevice ? 30 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    let lastFrameTime = 0;
    let colorSampleCounter = 0;
    const COLOR_SAMPLE_EVERY = isMobileDevice ? 6 : 2; // Amostra cor menos vezes por segundo no mobile

    const tick = (timestamp) => {
        requestAnimationFrame(tick);

        // Limita FPS no mobile
        const elapsed = timestamp - lastFrameTime;
        if (elapsed < FRAME_INTERVAL) return;
        lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);

        // Atualiza a animação do canvas da tela
        drawScreenContent();
        screenTexture.needsUpdate = true;

        // Captura a cor média da tela para a luz dinâmica (desativado no mobile para poupar performance)
        if (!isMobileDevice) {
            colorSampleCounter++;
            if (colorSampleCounter >= COLOR_SAMPLE_EVERY) {
                colorSampleCounter = 0;
                try {
                    sampleCtx.drawImage(screenCanvas, 0, 0, 1, 1);
                    const pixelData = sampleCtx.getImageData(0, 0, 1, 1).data;
                    const targetColor = new THREE.Color(`rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`);
                    screenLight.color.lerp(targetColor, 0.1);
                } catch (e) {
                    // Silenciosamente ignora erros de CORS no Ambilight para não travar o site
                }
            }
        }

        renderer.render(scene, camera);
    };
    requestAnimationFrame(tick);

    let windowWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        // Evita recalcular tudo no mobile se for apenas uma alteração de altura (ex: barra do nav)
        if (window.innerWidth === windowWidth && window.innerWidth <= 900) {
            return;
        }
        windowWidth = window.innerWidth;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        const dpr = isMobileDevice ? 1 : Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(dpr);
    });

}); // Fim do window.addEventListener('load')
