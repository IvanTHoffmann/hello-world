
// html elements
var html_score;
var html_debug;
var html_canvas;
var html_curBet;
var context;

// back-end variables
var windowWidth = 1;
var windowHeight = 1;
var canvasSize = 1;
var gameSize = 120;
var gameScale = 1;
var teams = []
var lastFrameTime = Date.now();

// gameplay variables
var score = 100;
var nEntities = 40;
var teamBet = 0;
var entities = [];

// "structs"
function team(color){
    this.color = color;
    this.last_population = 0;
    this.population = 0;
}

function entity(x, y, r, team){
    this.x = x;
    this.y = y;
    this.r = r;
    this.team = team;
    this.move_x = 0;
    this.move_y = 0;
    this.speed = .007;
}

// window callbacks
window.onload = function(){
    html_score = document.getElementById("score");
    html_debug = document.getElementById("debug");
    html_canvas = document.getElementById("canvas");
    html_curBet = document.getElementById("curBet");
    context = html_canvas.getContext("2d");
    
    requestAnimationFrame(update);
    arrangeElements();

    teams.push(new team("red"));
    teams.push(new team("green"));
    teams.push(new team("blue"));
    
    newGame();
}

window.onresize = function(){
    arrangeElements();
}

function arrangeElements(){
    windowWidth = window.innerWidth * .8;
    windowHeight = window.innerHeight * .8;
    
    canvasSize = windowHeight;
    if (windowWidth < windowHeight){
        canvasSize = windowWidth;
    }
    html_canvas.width = canvasSize;
    html_canvas.height = canvasSize;
    gameScale = canvasSize/gameSize;
}

function newGame(){
    for (t of teams){
        t.population = 0;
    }
    entities = [];
    for (let i=0; i<nEntities; i++){
        let r = 1;
        let x = Math.random() * (gameSize - 2*r) + r;
        let y = Math.random() * (gameSize - 2*r) + r;
        let team = Math.floor(Math.random() * 3);
        team = i % 3;
        teams[team].population++;
        entities.push(new entity(x, y, r, team));
    }
    setScore(100);
    placeBet(0);
}

function getRelation(a, b){
    // returns
    // 0 if a==b
    // 1 if a kills b
    // -1 if b kills a
    if (a == b){
        return 0;
    }
    return (((a - b + 5 ) % 5) % 2) * 2 - 1;
}

function alertEntity(ent, relation, nx, ny) {
    if (relation == 1){
        // found a target
        ent.move_x += nx;
        ent.move_y += ny;
    }
    else if (relation == 0){
        // found a team mate
        ent.move_x -= nx * .1;
        ent.move_y -= ny * .1;
    }
    else if (relation == -1){
        // found a threat
        ent.move_x -= nx;
        ent.move_y -= ny;
    }
}

function clamp(x, min, max){
    if (x < min){
        return min;
    }
    if (x > max){
        return max;
    }
    return x;
}

function updateEntities(dt) {
    // loop over all entities
    for (let aID = 0; aID < entities.length; aID++){
        let a = entities[aID];
        // loop over all entities after a
        for (let bID=aID+1; bID < entities.length; bID++){
            let b = entities[bID];

            let relation = getRelation(a.team, b.team);
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            
            let sqr_dist = dx * dx + dy * dy;
            
            if (sqr_dist < (a.r + b.r) ** 2) {
                if (sqr_dist == 0) {
                    dx = 1;
                    dy = 0;
                    sqr_dist = 1;
                }
                if (relation == 1) {
                    // capture b
                    teams[a.team].population++;
                    teams[b.team].population--;
                    b.team = a.team;
                }
                else if (relation == -1) {
                    // capture a
                    teams[a.team].population--;
                    teams[b.team].population++;
                    a.team = b.team;
                }
            }
            let fourth_dist = Math.sqrt(sqr_dist) * sqr_dist;
            let nx = dx / fourth_dist;
            let ny = dy / fourth_dist;

            alertEntity(a, relation, nx, ny);
            alertEntity(b, -relation, -nx, -ny);
        }

        //* avoid walls
        let wall_weight = 10;
        a.move_x += wall_weight/Math.pow(a.x, 3);
        a.move_x -= wall_weight/Math.pow(gameSize-a.x, 3);
        a.move_y += wall_weight/Math.pow(a.y, 3);
        a.move_y -= wall_weight/Math.pow(gameSize-a.y, 3);
        //*/

        let mx = a.move_x;
        let my = a.move_y;

        a.move_x = 0;
        a.move_y = 0;

        let sqr_move_mag = mx*mx + my*my
        if (sqr_move_mag == 0){
            return;
        }
        
        let move_coeff = a.speed * dt / Math.sqrt(sqr_move_mag);
        a.x += mx * move_coeff;
        a.y += my * move_coeff;
        a.x = clamp(a.x, a.r, gameSize-a.r);
        a.y = clamp(a.y, a.r, gameSize-a.r);
    }
}

function drawRect(x, y, r, color){
    context.beginPath();
    context.fillStyle = color;
    context.arc(x*gameScale, y*gameScale, r*gameScale, 0, 2 * Math.PI);
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = "black";
    context.stroke();
    //context.fillRect((x-r)*gameScale, (y-r)*gameScale, (r*2)*gameScale, (r*2)*gameScale);
}

function drawEntities(){
    for (ent of entities){
        //drawRect(ent.x, ent.y, ent.r, "black");
        drawRect(ent.x, ent.y, ent.r, teams[ent.team].color);
    }
}

function update(){
    requestAnimationFrame(update);
    var now = Date.now();
    var dt = Math.max(now - lastFrameTime, 20);
    lastFrameTime = now;

    for (t of teams){
        t.last_population = t.population;
    }

    updateEntities(dt);

    if (teams[teamBet].last_population){
        setScore(score * teams[teamBet].population / teams[teamBet].last_population);
    }

    context.clearRect(0, 0, canvasSize, canvasSize);
    drawEntities();
}

function setScore(inScore){
    score = Math.floor(inScore);
    html_score.textContent = score;
}

function placeBet(inBet){
    teamBet = inBet;
    html_curBet.textContent = "current bet: " + teams[teamBet].color;
}

function log(msg){
    let html_msg = document.createElement("Label");
    html_msg.textContent = msg;
    html_debug.appendChild(html_msg);
}