var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d");
// Set initial step size.
var dt = 1e4,
	adjusted_dt = [];
// Set minimal step size.
var dx_min = 1e3;
var dx_max = 5e4;
// Set relative change tolerances.
var x_tol = 3e-3;
//constants
const G = -6.67408e-11;
//const G = -6.67408e-14; //when using km and kg as units
//const G = -6.67408e-3;
var planets = [];
//rendering
var origin = {
	scale: 1.3889477023997076e-10,
	x: 0,
	y: 0,
	planet_scale: 500
};
var selected = {},
	maincolor = "#333";
//set the colorscheme
if (window.matchMedia) {
	window.matchMedia("(prefers-color-scheme: dark)").addListener(e => {
		maincolor = e.matches ? "#d3d7cf" : "#333";
		console.log("theme change detected, setting color to", maincolor);
	});
	if (window.matchMedia("(prefers-color-scheme: dark)").matches)
		maincolor = "#d3d7cf";
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
var sun = new Planet();
sun.m = 1.989e30;
sun.r = 696340000;
sun.alt_r = 25;
sun.color = "yellow";
sun.name = "sun";
planets.push(sun);

planets.push(
	new Planet(
		new Vector(5.177209740472153e7, 4.939923994023345e6, -4.345603855520848e6),
		new Vector(-1.40374285392326e1, 5.067180631659721e1, 5.428341406032729),
		3.302e23,
		2439700,
		"mercury ",
		"gray",
		4
	)
);
planets.push(
	new Planet(
		new Vector(-1.044788797746455e8, -2.622227268798453e7, 5.669321489319219e6),
		new Vector(8.296647812076673, -3.412412961250397e1, -9.470189522389862e-1),
		48.685e23,
		6051800,
		"venus",
		"violet",
		7
	)
);
planets.push(
	new Planet(
		new Vector(-1.192693180463659e8, -9.196938727630605e7, 4.536886832430959e3),
		new Vector(
			1.771605681005595e1,
			-2.370187334742887e1,
			-3.939447511491778e-5
		),
		5.97219e24,
		6371000,
		"earth",
		"blue",
		11
	)
);
planets.push(
	new Planet(
		new Vector(2.240677809234498e7, -2.146888173319176e8, -5.048212889226571e6),
		new Vector(2.501421553891083e1, 4.59861352288849, -5.173266156648491e-1),
		6.4171e23,
		3389000,
		"mars",
		"red",
		9
	)
);
planets.push(
	new Planet(
		new Vector(2.076997311919959e8, -7.472455127748314e8, -1.543338631093383e6),
		new Vector(1.244399043430969e1, 4.119522235328096, -2.955443711777739e-1),
		1898.13e24,
		69911000,
		"jupiter",
		"orange",
		18
	)
);
planets.push(
	new Planet(
		new Vector(6.524934181679767e8, -1.349738177009573e9, -2.504609028350174e6),
		new Vector(8.173959744337409, 4.180988805185464, -3.975131633740239e-1),
		5.6834e26,
		58232000,
		"saturn",
		"brown",
		15
	)
);
planets.push(
	new Planet(
		new Vector(2.386502033754993e9, 1.755339311618655e9, -2.43923685453279e7),
		new Vector(-4.07345723288944, 5.172320436045517, 7.190645630817283e-2),
		86.813e24,
		25362000,
		"uranus",
		"lightblue",
		11
	)
);
for (var p of planets) {
	//convert from kilometers to meters
	p.v = p.v.multiply(1000);
	p.p = p.p.multiply(1000);
}

setInterval(function() {
	//ctx.fillStyle = "rgba(0,0,0,0.05)";
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	let max_x = -Infinity,
		max_y = -Infinity,
		min_x = Infinity,
		min_y = Infinity;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < 20; i++) {
		// NOTE: the step size has to stay the same for the entire calculation
		for (var p of planets) {
			adaptive_rk4_v2(p, dt);
		}
		if (document.getElementById("box-0").checked) adjustTimestep();
		else dt = dx_min * 5;
	}
	//scale the viewport to fit all planets
	/*origin.scale = Math.min(
		4e2 /
			Math.max(
				Math.abs(max_x),
				Math.abs(min_y),
				Math.abs(min_x),
				Math.abs(max_y)
			),
		origin.scale
	);*/
	origin.x = 500 / origin.scale;
	origin.y = 500 / origin.scale;
	//draw all the planets
	for (var p of planets) {
		if (p.p.x > max_x) max_x = p.p.x;
		if (p.p.y > max_y) max_y = p.p.y;
		if (p.p.x < min_x) min_x = p.p.x;
		if (p.p.y < min_y) min_y = p.p.y;
		drawPlanet(p, p.r, p.color);
	}

	ctx.fillStyle = maincolor;
	ctx.font = "16px sans-serif";
	if (selected.name) {
		ctx.fillText(selected.name + "", 10, 20);
		ctx.fillText(selected.m + " kg", 10, 40);
		ctx.fillText(
			Math.round(selected.p.length / 1000) + " km (distance from sun)",
			10,
			60
		);
		ctx.fillText(~~selected.v.length + " m/s", 10, 80);
	}
}, 7);

function drawPlanet(p, radius, color) {
	ctx.beginPath();
	let raaaa = document.getElementById("box-1").checked
		? radius * origin.planet_scale * origin.scale
		: p.alt_r;
	ctx.arc(
		(p.p.x + origin.x) * origin.scale,
		(p.p.y + origin.y) * origin.scale,
		raaaa,
		0,
		Math.PI * 2,
		false
	);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.stroke();
}

canvas.addEventListener(
	"mousedown",
	function(event) {
		let rect = canvas.getBoundingClientRect();
		console.log(rect);
		let x = event.clientX - rect.left;
		x *= canvas.width / rect.width;
		let y = event.clientY - rect.top;
		y *= canvas.height / rect.height;
		console.log(event);

		let minDist = Infinity;
		for (var p of planets) {
			let distFromClick =
				(x - (p.p.x + origin.x) * origin.scale) *
					(x - (p.p.x + origin.x) * origin.scale) +
				(y - (p.p.y + origin.y) * origin.scale) *
					(y - (p.p.y + origin.y) * origin.scale);
			if (distFromClick < minDist) {
				minDist = distFromClick;
				selected = p;
			}
		}
	},
	false
);
