var Cube = function(x,y,z) {
	this.x = x;
	this.y = y;
	this.z = z;
};
Cube.add = function(a,b) {
	return new Cube(a.x + b.x,a.y + b.y,a.z + b.z);
};
Cube.scale = function(a,k) {
	return new Cube(a.x * k,a.y * k,a.z * k);
};
Cube.direction = function(direction) {
	return Cube.directions[direction];
};
Cube.neighbor = function(hex,direction) {
	return Cube.add(hex,Cube.direction(direction));
};
Cube.diagonalNeighbor = function(hex,direction) {
	return Cube.add(hex,Cube.diagonals[direction]);
};
Cube.distance = function(a,b) {
	return Std["int"]((Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2);
};
Cube.$length = function(h) {
	return Std["int"]((Math.abs(h.x) + Math.abs(h.y) + Math.abs(h.z)) / 2);
};
Cube.prototype = {
	toString: function() {
		return this.v().join(",");
	}
	,v: function() {
		return [this.x,this.y,this.z];
	}
	,rotateLeft: function() {
		return new Cube(-this.y,-this.z,-this.x);
	}
	,rotateRight: function() {
		return new Cube(-this.z,-this.x,-this.y);
	}
	,equals: function(other) {
		return this.x == other.x && this.y == other.y && this.z == other.z;
	}
};
var FractionalCube =  function(x,y,z) {
	this.x = x;
	this.y = y;
	this.z = z;
};
FractionalCube.cubeRound = function(h) {
	var rx = Math.round(h.x);
	var ry = Math.round(h.y);
	var rz = Math.round(h.z);
	var x_diff = Math.abs(rx - h.x);
	var y_diff = Math.abs(ry - h.y);
	var z_diff = Math.abs(rz - h.z);
	if(x_diff > y_diff && x_diff > z_diff) rx = -ry - rz; else if(y_diff > z_diff) ry = -rx - rz; else rz = -rx - ry;
	return new Cube(rx,ry,rz);
};
FractionalCube.cubeLerp = function(a,b,t) {
	return new FractionalCube(a.x + (b.x - a.x) * t,a.y + (b.y - a.y) * t,a.z + (b.z - a.z) * t);
};
FractionalCube.cubeLinedraw = function(a,b) {
	var N = Cube.distance(a,b);
	var results = [];
	var _g1 = 0;
	var _g = N + 1;
	while(_g1 < _g) {
		var i = _g1++;
		results.push(FractionalCube.cubeRound(FractionalCube.cubeLerp(a,b,1.0 / Math.max(1,N) * i)));
	}
	return results;
};
FractionalCube.prototype = {
	v: function() {
		return [this.x,this.y,this.z];
	}
	,toString: function() {
		return "#{" + this.v().join(",") + "}";
	}
};

var Std = function() { };
Std["int"] = function(x) {
	return x | 0;
};

function offsetCoord(col,row) {
	return {col:col, row:row};
};

function cubetoOffset(cube) {
	var col= cube.x;
	var row= cube.z+ (cube.x- (cube.x%2))/ 2;
	return offsetCoord(col,row);
};

function offsetToCube(col, row) {
	var x= col;
	var z= row- (col- (col %2))/ 2;
	var y= -x - z;
	return new Cube(x,y,z);
};