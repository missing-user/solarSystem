var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d");

// Set initial step size.
var dt = 1e-1,
	adjusted_dt = [];

// Set minimal step size.
var dx_min = 2e-2;
var dx_max = 5e-1;

// Set relative change tolerances.
var x_tol = 5e-2;

//constants
//const G = -6.67408e-11;
const G = -6.67408e-3;
var planets = [];

function rk4(y, x, dx, f) {
	var k1 = dx * f(x, y),
		k2 = dx * f(x + dx / 2.0, y + k1 / 2.0),
		k3 = dx * f(x + dx / 2.0, y + k2 / 2.0),
		k4 = dx * f(x + dx, y + k3);
	return y + (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;
}
function adaptive_rk4(y, x, dx, f) {
	//regular runge kutta step
	var step = rk4(y, x, dx, f);
	//half runge kutta step
	var half_step = (double_step = rk4(y, x, dx * 0.5, f)) * 2;
	//double runge kutta step
	var double_step = rk4(y, x, dx * 2, f) * 0.5;

	if (Math.abs(half_step - step) > x_tol) {
		dt = dx_h;
		console.log(
			"step halved",
			dt,
			"cause the dif was",
			(half_step - step).toExponential()
		);
	}
	if (Math.abs(double_step - step) < x_tol) {
		dt = dx_d;
		console.log(
			"step doubled",
			dt,
			"cause the dif was",
			(double_step - step).toExponential()
		);
	}
	return step;
}

function getGravAcc(pos, p1) {
	// NOTE: P1 is the planet being accelerated, ignores itself
	resultVector = new Vector();
	for (var p2 of planets)
		if (p2 != p1) {
			r = pos.subtract(p2.p);
			resultVector = resultVector.add(
				r.unit().multiply((G * p2.m) / r.length2)
			);
		}
	return resultVector;
}

//rk4 second order and with vectors
function rk4_v2(p1, dx) {
	k1_p = p1.v;
	k1_v = getGravAcc(p1.p, p1);
	//k2
	k2_p = p1.v.add(k1_v.multiply(dx / 2));
	k2_v = getGravAcc(p1.p.add(k1_p.multiply(dx / 2)), p1);
	//k3
	k3_p = p1.v.add(k2_v.multiply(dx / 2));
	k3_v = getGravAcc(p1.p.add(k2_p.multiply(dx / 2)), p1);
	//k4
	k4_p = p1.v.add(k3_v.multiply(dx));
	k4_v = getGravAcc(p1.p.add(k3_p.multiply(dx)), p1);

	// y + (k1 + 2*k2 + 2*k3 + k4) / 6          with vector objects
	return {
		new_p: k1_p
			.add(k2_p.multiply(2))
			.add(k3_p.multiply(2))
			.add(k4_p)
			.divide(6),
		new_v: k1_v
			.add(k2_v.multiply(2))
			.add(k3_v.multiply(2))
			.add(k4_v)
			.divide(6)
	};
}

function adaptive_rk4_v2(p1, dx) {
	//regular runge kutta step
	var step = rk4_v2(p1, dx);
	//half runge kutta step
	var half_step = rk4_v2(p1, dx * 0.5);
	half_step.new_v = half_step.new_v.multiply(2);
	//double runge kutta step
	var double_step = rk4_v2(p1, dx * 2);
	double_step.new_v = double_step.new_v.multiply(0.5);

	if (half_step.new_v.subtract(step.new_v).length2 > x_tol)
		adjusted_dt.push(dx * 0.5);
	else if (double_step.new_v.subtract(step.new_v).length2 < x_tol)
		adjusted_dt.push(dx * 2);
	else adjusted_dt.push(dx);

	//set the planets position and velocity
	p1.p = p1.p.add(step.new_p.multiply(dx));
	p1.v = p1.v.add(step.new_v.multiply(dx));
}

function adjustTimestep() {
	//find the minimal time in the array
	dt = adjusted_dt[0];
	for (var new_dt of adjusted_dt) {
		if (new_dt < dt) dt = new_dt;
	}
	adjusted_dt = []; //clear the array

	//check that the new timestep is within allowed bounds
	if (dt > dx_max) dt = dx_max;
	if (dt < dx_min) dt = dx_min;
}

var sun = new Planet(new Vector(300, 300, 0));
//sun.m = 1.989e30;
sun.m = 1.989e5;
var earth = new Planet(
	new Vector(-1.192693180463659e8, -9.196938727630605e7, 4.536886832430959e3),
	new Vector(1.771605681005595e1, -2.370187334742887e1, -3.939447511491778e-5),
	5.97219e24
);
earth = new Planet(new Vector(200, 200, 1), new Vector(3, 0, 0), 1e3);
var mars = new Planet(
	new Vector(2.240677809234498e7, -2.146888173319176e8, -5.048212889226571e6),
	new Vector(2.501421553891083e1, 4.59861352288849, -5.173266156648491e-1),
	6.4171e23
);
mars = new Planet(new Vector(350, 300, 2), new Vector(4, 5, 0), 2e2);
var venus = new Planet(new Vector(200, 400, 0), new Vector(0, -3.5, 0), 2e1);
planets.push(mars);
planets.push(venus);
planets.push(sun);
planets.push(earth);

setInterval(function() {
	//ctx.fillStyle = "rgba(0,0,0,0.05)";
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < 20; i++) {
		// NOTE: the step size has to stay the same for the entire calculation
		for (var p of planets) adaptive_rk4_v2(p, dt);

		drawPlanet(sun, 150, "yellow");
		drawPlanet(mars, 70, "red");
		drawPlanet(earth, 50, "blue");
		drawPlanet(venus, 30, "green");
		adjustTimestep();
	}
}, 16);

function drawPlanet(p, radius, color) {
	ctx.beginPath();
	ctx.arc(
		p.p.x,
		p.p.y,
		radius * (10 / Math.max(0.01, p.p.z + 100)),
		0,
		Math.PI * 2,
		false
	);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.stroke();
}
