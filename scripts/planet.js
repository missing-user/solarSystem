function Planet(pos, vel, mass, rad, name) {
	this.p = pos || new Vector(0, 0, 0);
	this.v = vel || new Vector(0, 0, 0);
	this.a = new Vector(0, 0, 0);
	this.r = rad || 1;
	this.m = mass || 1;
	this.name = name;
}
