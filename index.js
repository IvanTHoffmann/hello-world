var BUTTON_LEFT = 0;
var BUTTON_MIDDLE = 1;
var BUTTON_RIGHT = 2;
var BUTTON_THUMB_1 = 3;
var BUTTON_THUMB_2 = 4;


function Vector(x, y){
	var self = this;
	
    this._x = x;
    this._y = y;
  
    this.x = function(){
        return self._x;
    }
    
    this.y = function(){
        return self._y;
    }
  
    this.setx = function(newX){
        self._x = newX;
    }
    
    this.sety = function(newY){
        self._y = newY;
    }
	
	this.set = function(v){
		self._x = v.x();
		self._y = v.y();
	}

	// in-place operators
	this.add = function(v){
		self._x += v.x;
		self._y += v.y;
		return self;
	}

	this.sub = function(v){
		self._x -= v.x;
		self._y -= v.y;
		return self;
	}

	this.mul = function(s){
		self._x *= s;
		self._y *= s;
	}

	this.div = function(s){
		self._x /= s;
		self._y /= s;
	}

	this.normalize = function(){
		return self.div(this.length);
	}

	// preservative operators 
	this.sum = function(v){
		return new Vector(self._x + v.x(), self._y + v.y());
	}

	this.diff = function(v){
		return new Vector(self._x - v.x(), self._y - v.y());
	}

	this.prod = function(s){
		return new Vector(self._x * s, self._y * s);
	}

	this.quot = function(s){
		return new Vector(self._x / s, self._y / s);
	}

	this.dot = function(v){
		return self._x * v.x() + self._y * v.y();
	}

	this.wedge = function(v){
		return self._x * v.y() - self._y * v.x();
	}

	this.copy = function(v){
		return new Vector(self._x, self._y);
	}

	this.len = function(){
		return Math.sqrt(self.sqrLen());
	}
	
	this.sqrLen = function(){
		return self.dot(self);
	}

	this.normalized = function(){
		return self.quot(self.length);
	}
}


function Renderer() {
	var self = this;
	
	this.ns = 'http://www.w3.org/2000/svg'
	this.svg = document.createElementNS(this.ns, 'svg')
	this.svg.setAttributeNS(null, 'width', '100%')
	this.svg.setAttributeNS(null, 'height', '100%')
	this.div = document.getElementById('drawing')
	this.div.appendChild(this.svg)

	this.drawLine = function(x1, y1, x2, y2, w=2, r=0, g=0, b=0){
		var line = document.createElementNS(self.ns, 'line')
		line.setAttributeNS(null, 'x1', x1)
		line.setAttributeNS(null, 'y1', y1)
		line.setAttributeNS(null, 'x2', x2)
		line.setAttributeNS(null, 'y2', y2)
		line.setAttributeNS(null, 'style', 'stroke:rgb('+r+','+g+','+b+');stroke-width:'+w)
		self.svg.appendChild(line)
		return line;
	}

	this.drawPolyLine = function(points, w=2, r=0, g=0, b=0){
		var line = document.createElementNS(self.ns, 'polyline')
		line.setAttributeNS(null, 'points', points.toString())
		line.setAttributeNS(null, 'style', 'fill:None;stroke:rgb('+r+','+g+','+b+');stroke-width:'+w)
		self.svg.appendChild(line)
		return line;
	}
	
	this.drawCircle = function(center, radius, w=0, r=0, g=0, b=0){
		var circle = document.createElementNS(self.ns, 'circle')
		circle.setAttributeNS(null, 'cx', center.x());
		circle.setAttributeNS(null, 'cy', center.y());
		circle.setAttributeNS(null, 'r', radius);
		circle.setAttributeNS(null, 'style', 'fill:red;stroke:rgb('+r+','+g+','+b+');stroke-width:'+w)
		self.svg.appendChild(circle)
		return circle;
	}
}


function Node(pos){
	var self = this;
	
	this.graphics = rend.drawCircle(pos, 5);
	
    this._pos = pos.copy();
    this._vel = new Vector(1, 0);
    this._ctrl = this._pos.sum(this._vel.prod(100));
    
    // calculated
    this.angle = 0;
    this.p_a = 0;
    this.p_b = 0;
    this.l_a = 0;
    this.l_b = 0;
    
    this.getPoint = function(p, t) {
        return pos;
    }
	
	this.pos = function(){
		return self._pos;
	}
	
	this.setPos = function(v){
		self._pos.set(v);
		this.graphics.setAttributeNS(null, 'cx', self._pos.x());
		this.graphics.setAttributeNS(null, 'cy', self._pos.y());
	}

	this.destroy = function(){
		rend.svg.removeChild(self.graphics);
	}
}

function Curve(){
	var self = this;
	
    this._nodes = [
      new Node(new Vector(100, 100))
    ];
    this._selected = -1;
    
    this.selected = function(){
        return self._selected;
    }
    
    this.setSelected = function(s){
        self._selected = s;
    }
	
	this.nodes = function(){
		return self._nodes;
	}
	
	this.nodeCount = function(){
		return self._nodes.length;
	}
	
	this.addNode = function(pos){
		self._nodes.push(new Node(pos));
	}
	
	this.getNode = function(index){
		return self._nodes[index];
	}
	
	this.popNode = function(index){
		self._nodes[index].destroy();
		self._nodes.splice(index, 1);
	}
	
	this.draw = function(){
		
		//this._nodes.forEach((node) => {
		//	rend.drawCircle(node.pos(), 5);
		//});
	}
}


function Application() {
	this.curve = new Curve()
	this.mousePos = new Vector(0, 0);
	
	var self = this;
	
	
	this.draw = function(){
		self.curve.draw(rend);
		
	}
	
	this.onResize = function() {
		self.draw();
	}
	
	this.onMouseDown = function(event) {
		var maxSqrDist = 100*100;
		var diff, dist, i;
		
		self.curve.setSelected(-1);
		switch (event.button) {
		case BUTTON_LEFT:
			for (i=0; i < self.curve.nodeCount(); i++) {
				
				node = self.curve.getNode(i);
				diff = node.pos().diff(self.mousePos);
				dist = diff.sqrLen();
				if (dist < maxSqrDist){
					self.curve.setSelected(i);
					maxSqrDist = dist;
				}
			}
			if (self.curve.selected() === -1){
				self.curve.addNode(self.mousePos);
				self.curve.setSelected(self.curve.nodeCount() - 1);
			}
			break;
			
		case BUTTON_RIGHT:
			for (i=0; i < self.curve.nodeCount(); i++) {
			
				node = self.curve.getNode(i);
				diff = node.pos().diff(self.mousePos);
				dist = diff.sqrLen();
				if (dist < maxSqrDist){
					self.curve.setSelected(i);
					maxSqrDist = dist;
				}
			}
			if (self.curve.selected() !== -1){
				self.curve.popNode(self.curve.selected());
				self.curve.setSelected(-1);
			}
			break;	
		default:
			break;
		
		}
		
		self.draw();
	}
	
	this.onMouseUp = function(event) {
		self.curve.setSelected(-1);
		self.draw();
	}
	
	this.onMouseMove = function(event) {
		var rect = rend.div.getBoundingClientRect();
		self.mousePos.setx(event.clientX - rect.left);
		self.mousePos.sety(event.clientY - rect.top);
		if (self.curve.selected() !== -1){
			self.curve.getNode(self.curve.selected()).setPos(self.mousePos);
		}
		self.draw();
	}

	window.addEventListener("resize", this.onResize, false);
	rend.svg.addEventListener('contextmenu', event => event.preventDefault());
	rend.svg.addEventListener("mousedown", this.onMouseDown);
	rend.svg.addEventListener("mouseup", this.onMouseUp);
	rend.svg.addEventListener("mousemove", this.onMouseMove);
	self.onResize();
	
}


var rend = new Renderer();
var app = new Application();
