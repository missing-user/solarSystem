function Planet(pos, vel, mass, rad, name, color) {
	this.p = pos || new Vector(0, 0, 0);
	this.v = vel || new Vector(0, 0, 0);
	this.r = rad || 1;
	this.m = mass || 1;
	this.name = name;
	this.color = color;
}
