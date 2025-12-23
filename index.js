<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>High-Stack Challenge - JS Version</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
    <style>
        body { margin: 0; padding: 0; overflow: hidden; background: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
        canvas { border: 2px solid #333; }
        #ui { position: absolute; top: 20px; left: 20px; pointer-events: none; }
    </style>
</head>
<body>
    <div id="ui">
        <h1 id="score">Blocks: 0</h1>
        <p id="rank">Rank: Rookie</p>
        <p>A: Rotate | Click: Drop</p>
    </div>

    <script>
        // --- 1. Matter.js 설정 ---
        const { Engine, Render, Runner, Bodies, Composite, Body, Vertices } = Matter;
        const engine = Engine.create();
        const world = engine.world;
        engine.gravity.y = 1.5; // 중력 설정

        const screenWidth = 800;
        const screenHeight = 720;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = screenWidth;
        canvas.height = screenHeight;
        document.body.appendChild(canvas);

        // --- 2. 게임 데이터 ---
        let score = 0;
        let gameOver = false;
        let canCreate = true;
        const blocks = [];
        
        // 이미지 경로 데이터
        const blockConfigs = {
            "Square": {
                vertices: [{x:-50, y:-50}, {x:50, y:-50}, {x:50, y:50}, {x:-50, y:50}],
                images: ["images/square.png", "images/9aff562fdf575bcacbea3cd3330c576e (3).png"]
            },
            "Diamond": {
                vertices: [{x:0, y:-70}, {x:70, y:0}, {x:0, y:70}, {x:-70, y:0}],
                images: ["images/diamond.png", "images/9aff562fdf575bcacbea3cd3330c576e.png"]
            },
            "L_Shape": {
                // L자형은 두 개의 사각형 결합체로 구성
                parts: [
                    { x: 0, y: 25, w: 100, h: 50 }, // 가로바
                    { x: -25, y: -25, w: 50, h: 50 } // 세로바
                ],
                images: ["images/L_shape.png", "images/63a1aff59ec47d0b600ea81c51125b1d (1).png"]
            }
        };

        // 이미지 로딩/캐싱
        const imageCache = {};
        function getImg(path) {
            if (!imageCache[path]) {
                const img = new Image();
                img.src = path;
                imageCache[path] = img;
            }
            return imageCache[path];
        }

        // --- 3. 바닥 생성 ---
        const ground = Bodies.rectangle(screenWidth/2, screenHeight - 40, 500, 20, { 
            isStatic: true, 
            friction: 1.0,
            render: { fillStyle: '#00C800' }
        });
        Composite.add(world, ground);

        // --- 4. 조종 중인 블록 (Ghost Block) ---
        let ghost = {
            x: screenWidth / 2,
            y: 100,
            angle: 0,
            type: "Square"
        };

        function resetGhost() {
            const types = Object.keys(blockConfigs);
            ghost.type = types[Math.floor(Math.random() * types.length)];
            ghost.angle = 0;
        }

        // --- 5. 입력 처리 ---
        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            ghost.x = e.clientX - rect.left;
        });

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'a') ghost.angle -= 0.1;
            if (e.key.toLowerCase() === 'r' && gameOver) location.reload();
        });

        window.addEventListener('mousedown', () => {
            if (canCreate && !gameOver) {
                dropBlock();
                canCreate = false;
                setTimeout(() => { canCreate = true; resetGhost(); }, 2000);
            }
        });

        function dropBlock() {
            const config = blockConfigs[ghost.type];
            let newBody;

            if (ghost.type === "L_Shape") {
                const part1 = Bodies.rectangle(ghost.x + config.parts[0].x, ghost.y + config.parts[0].y, config.parts[0].w, config.parts[0].h);
                const part2 = Bodies.rectangle(ghost.x + config.parts[1].x, ghost.y + config.parts[1].y, config.parts[1].w, config.parts[1].h);
                newBody = Body.create({ parts: [part1, part2] });
            } else {
                newBody = Bodies.fromVertices(ghost.x, ghost.y, [config.vertices]);
            }

            Body.setAngle(newBody, ghost.angle);
            newBody.friction = 0.8;
            newBody.restitution = 0.1;
            newBody.customData = { type: ghost.type };
            
            blocks.push(newBody);
            Composite.add(world, newBody);
            score++;
            document.getElementById('score').innerText = `Blocks: ${score}`;
        }

        // --- 6. 메인 루프 (그리기) ---
        function update() {
            Engine.update(engine);

            // 배경 클리어
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, screenWidth, screenHeight);

            // 바닥 그리기
            ctx.fillStyle = "#00C800";
            ctx.fillRect(screenWidth/2 - 250, screenHeight - 50, 500, 20);

            // 떨어지는 블록들 그리기
            blocks.forEach((body, index) => {
                const type = body.customData.type;
                const config = blockConfigs[type];
                
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                
                // 이미지 겹쳐서 그리기
                config.images.forEach(path => {
                    const img = getImg(path);
                    ctx.drawImage(img, -50, -50, 100, 100);
                });
                ctx.restore();

                // 게임 오버 체크 (화면 밖으로 나감)
                if (body.position.y > screenHeight + 50) {
                    gameOver = true;
                }
            });

            // 조종 중인 고스트 블록 그리기
            if (canCreate && !gameOver) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.translate(ghost.x, ghost.y);
                ctx.rotate(ghost.angle);
                blockConfigs[ghost.type].images.forEach(path => {
                    ctx.drawImage(getImg(path), -50, -50, 100, 100);
                });
                ctx.restore();
            }

            if (gameOver) {
                ctx.fillStyle = "rgba(255,0,0,0.7)";
                ctx.font = "48px Arial";
                ctx.textAlign = "center";
                ctx.fillText("GAME OVER!", screenWidth/2, screenHeight/2);
                ctx.font = "24px Arial";
                ctx.fillText("Press 'R' to Restart", screenWidth/2, screenHeight/2 + 50);
            }

            requestAnimationFrame(update);
        }

        update();
    </script>
</body>
</html>
