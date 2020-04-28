var canvas = document.getElementById("canvas");

// Set initial conditions.
var t = 0;
var x = 0.02;

// Set initial step size.
var dt = 1e-1;

// Set minimal step size.
var dx_min = 1e-3;

// Set relative change tolerances.
var dx_max = 0.01; // Enables faster speed.
var dx_min = 0.008; // Controls accuracy.
var x_tol = 1e-2;

//constants
const G = 6.67408e-11;

function rk4(y, x, dx, f) {
	//regular runge kutta step
	var k1 = dx * f(x, y),
		k2 = dx * f(x + dx / 2.0, y + k1 / 2.0),
		k3 = dx * f(x + dx / 2.0, y + k2 / 2.0),
		k4 = dx * f(x + dx, y + k3);
	var step = y + (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;

	//half runge kutta step
	var dx_h = dx * 0.5;
	k1 = dx_h * f(x, y);
	k2 = dx_h * f(x + dx_h / 2.0, y + k1 / 2.0);
	k3 = dx_h * f(x + dx_h / 2.0, y + k2 / 2.0);
	k4 = dx_h * f(x + dx_h, y + k3);
	var half_step = y + (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 3.0;

	//double runge kutta step
	var dx_d = dx * 2;
	k1 = dx_d * f(x, y);
	k2 = dx_d * f(x + dx_d / 2.0, y + k1 / 2.0);
	k3 = dx_d * f(x + dx_d / 2.0, y + k2 / 2.0);
	k4 = dx_d * f(x + dx_d, y + k3);
	var double_step = y + (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 12.0;

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

function getGravForce(p1, p2) {
	r = p1.p.subtract(p2.p);
	return r.unit().multiply((G * p1.m * p2.m) / r.length2);
}

function f(x, y) {
	return x * Math.sin(x);
	//return 2 * x;
}

var y = 0,
	x = 0,
	steps = 0,
	maxSteps = 1001,
	sampleEveryN = 10;

while (steps < maxSteps) {
	if (steps % sampleEveryN === 0) {
		console.log("y(" + x + ") =  \t" + y);
	}

	y = rk4(y, x, dt, f);
	x += dt;
	steps += 1;
}
