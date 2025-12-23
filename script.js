// --- 1. Matter.js 엔진 모듈 설정 ---
const { Engine, Render, Runner, Bodies, Composite, Body } = Matter;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 1.2; 

// --- 2. 캔버스 설정 ---
const screenWidth = 800;
const screenHeight = 720;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = screenWidth;
canvas.height = screenHeight;
document.body.appendChild(canvas);

// --- 3. 게임 데이터 및 설정 (경로: folder/ 로 수정) ---
const blockConfigs = {
    "Square": {
        vertices: [{x:-50, y:-50}, {x:50, y:-50}, {x:50, y:50}, {x:-50, y:50}],
        // ⭐️ 경로 수정됨
        images: ["folder/square.png", "folder/9aff562fdf575bcacbea3cd3330c576e (3).png"]
    },
    "Diamond": {
        vertices: [{x:0, y:-70}, {x:70, y:0}, {x:0, y:70}, {x:-70, y:0}],
        // ⭐️ 경로 수정됨
        images: ["folder/diamond.png", "folder/9aff562fdf575bcacbea3cd3330c576e.png"]
    },
    "L_Shape": {
        parts: [
            { x: 0, y: 25, w: 100, h: 50 }, 
            { x: -25, y: -25, w: 50, h: 50 }
        ],
        // ⭐️ 경로 수정됨
        images: ["folder/L_shape.png", "folder/63a1aff59ec47d0b600ea81c51125b1d (1).png"]
    }
};

const imageCache = {};
function getImg(path) {
    if (!imageCache[path]) {
        const img = new Image();
        img.src = path;
        imageCache[path] = img;
    }
    return imageCache[path];
}

// --- 4. 정적 바닥 생성 ---
const ground = Bodies.rectangle(screenWidth / 2, screenHeight - 30, 550, 20, { 
    isStatic: true, 
    friction: 1.0
});
Composite.add(world, ground);

// --- 5. 고스트 블록 ---
let ghost = { x: screenWidth / 2, y: 100, angle: 0, type: "Square" };
let score = 0;
let gameOver = false;
let canCreate = true;
const blocks = [];

function resetGhost() {
    const types = Object.keys(blockConfigs);
    ghost.type = types[Math.floor(Math.random() * types.length)];
    ghost.angle = 0;
}

// --- 6. 입력 처리 ---
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    ghost.x = e.clientX - rect.left;
});

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a') ghost.angle += 0.2;
    if (e.key.toLowerCase() === 'r' && gameOver) location.reload();
});

window.addEventListener('mousedown', () => {
    if (canCreate && !gameOver) {
        dropBlock();
        canCreate = false;
        setTimeout(() => { canCreate = true; resetGhost(); }, 2000);
    }
});

// --- 7. 블록 물리 생성 ---
function dropBlock() {
    const config = blockConfigs[ghost.type];
    let newBody;

    if (ghost.type === "L_Shape") {
        // L자형 물리 엔진 조합 (Compound Body)
        const part1 = Bodies.rectangle(ghost.x, ghost.y + 25, 100, 50);
        const part2 = Bodies.rectangle(ghost.x - 25, ghost.y - 25, 50, 50);
        newBody = Body.create({ parts: [part1, part2] });
    } else {
        newBody = Bodies.fromVertices(ghost.x, ghost.y, [config.vertices]);
    }

    Body.setAngle(newBody, ghost.angle);
    newBody.friction = 0.8;
    newBody.customType = ghost.type;
    
    blocks.push(newBody);
    Composite.add(world, newBody);
    score++;
    document.getElementById('score').innerText = `Blocks: ${score}`;
}

// --- 8. 그리기 루프 ---
function draw() {
    Engine.update(engine);
    ctx.clearRect(0, 0, screenWidth, screenHeight);

    // 바닥
    ctx.fillStyle = "#00C800";
    ctx.fillRect(screenWidth / 2 - 275, screenHeight - 40, 550, 20);

    // 블록들
    blocks.forEach((body) => {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        blockConfigs[body.customType].images.forEach(path => {
            ctx.drawImage(getImg(path), -50, -50, 100, 100);
        });
        ctx.restore();

        if (body.position.y > screenHeight + 100) gameOver = true;
    });

    // 미리보기 (Ghost)
    if (canCreate && !gameOver) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.translate(ghost.x, ghost.y);
        ctx.rotate(ghost.angle);
        blockConfigs[ghost.type].images.forEach(path => {
            ctx.drawImage(getImg(path), -50, -50, 100, 100);
        });
        ctx.restore();
    }

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0,0,screenWidth, screenHeight);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "50px Arial";
        ctx.fillText("GAME OVER", screenWidth/2, screenHeight/2);
    }
    requestAnimationFrame(draw);
}
draw();
