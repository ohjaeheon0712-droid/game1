const { Engine, Render, Runner, Bodies, Composite, Body } = Matter;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 1.2; 

// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 720;

// 블록 설정 (알려주신 3개의 이미지만 사용)
const blockConfigs = {
    "Square": {
        vertices: [{x:-50, y:-50}, {x:50, y:-50}, {x:50, y:50}, {x:-50, y:50}],
        image: "images/9aff562fdf575bcacbea3cd3330c576e (3).png", // Square 전용
        color: "#4CAF50"
    },
    "Diamond": {
        vertices: [{x:0, y:-70}, {x:70, y:0}, {x:0, y:70}, {x:-70, y:0}],
        image: "images/9aff562fdf575bcacbea3cd3330c576e.png", // Diamond 전용
        color: "#2196F3"
    },
    "L_Shape": {
        parts: [{x:0, y:25, w:100, h:50}, {x:-25, y:-25, w:50, h:50}],
        image: "images/63a1aff59ec47d0b600ea81c51125b1d (1).png", // L-Shape 전용
        color: "#FF9800"
    }
};

// 이미지 캐싱 함수
const imageCache = {};
function getImg(path) {
    if (!imageCache[path]) {
        const img = new Image();
        img.src = path;
        imageCache[path] = img;
    }
    return imageCache[path];
}

// 1. 바닥 생성 (길이를 550 -> 200으로 대폭 축소)
const groundWidth = 200; 
const ground = Bodies.rectangle(400, 690, groundWidth, 20, { 
    isStatic: true, 
    friction: 1.0 
});
Composite.add(world, ground);

// 게임 상태 변수
let ghost = { x: 400, y: 100, angle: 0, type: "Square" };
let blocks = [];
let score = 0;
let gameOver = false;
let canCreate = true;

// 마우스 이동에 따라 미리보기 블록 이동
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    ghost.x = e.clientX - rect.left;
});

// A키로 회전, R키로 재시작
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a') ghost.angle += 0.3;
    if (e.key.toLowerCase() === 'r' && gameOver) location.reload();
});

// 클릭 시 블록 낙하
window.addEventListener('mousedown', () => {
    if (canCreate && !gameOver) {
        dropBlock();
        canCreate = false;
        setTimeout(() => {
            canCreate = true;
            const types = Object.keys(blockConfigs);
            ghost.type = types[Math.floor(Math.random() * types.length)];
            ghost.angle = 0;
        }, 1500); // 다음 블록 생성 대기 시간
    }
});

function dropBlock() {
    const config = blockConfigs[ghost.type];
    let newBody;

    if (ghost.type === "L_Shape") {
        const p1 = Bodies.rectangle(ghost.x, ghost.y + 25, 100, 50);
        const p2 = Bodies.rectangle(ghost.x - 25, ghost.y - 25, 50, 50);
        newBody = Body.create({ parts: [p1, p2] });
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

// 그리기 루프
function draw() {
    Engine.update(engine);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 바닥 그리기 (축소된 길이에 맞춤)
    ctx.fillStyle = "#333";
    ctx.fillRect(400 - (groundWidth/2), 680, groundWidth, 20);

    // 쌓인 블록들 그리기
    blocks.forEach(body => {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        
        const config = blockConfigs[body.customType];
        const img = getImg(config.image);

        // 이미지 로딩 성공 시 이미지 출력, 실패 시 색상 상자 출력
        if (img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, -50, -50, 100, 100);
        } else {
            ctx.fillStyle = config.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(-50, -50, 100, 100);
        }
        ctx.restore();

        // 화면 아래로 떨어지면 게임 오버
        if (body.position.y > 800) gameOver = true;
    });

    // 떨어뜨리기 전 미리보기 (Ghost)
    if (canCreate && !gameOver) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.translate(ghost.x, ghost.y);
        ctx.rotate(ghost.angle);
        const ghostImg = getImg(blockConfigs[ghost.type].image);
        if (ghostImg.complete && ghostImg.naturalWidth !== 0) {
            ctx.drawImage(ghostImg, -50, -50, 100, 100);
        } else {
            ctx.fillStyle = "gray";
            ctx.fillRect(-50, -50, 100, 100);
        }
        ctx.restore();
    }

    // 게임 오버 메시지
    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", 400, 360);
        ctx.font = "20px Arial";
        ctx.fillText("Press 'R' to Restart", 400, 410);
    }

    requestAnimationFrame(draw);
}

draw();
