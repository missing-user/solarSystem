var scene = new THREE.Scene();
var cubetex;
//add camera and renderer
var camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / window.innerHeight,
	0.1,
	3000
);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

//add controls
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

window.addEventListener("resize", () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

//make planets selectable
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
	INTERSECTED,
	OUTLINE,
	SELECTED,
	SELECTED_OUTLINE,
	helpers = [];
var tooltip = document.getElementById("tooltip");

window.addEventListener(
	"mousemove",
	event => {
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	},
	false
);
window.addEventListener(
	"mousedown",
	event => {
		if (INTERSECTED) {
			if (INTERSECTED != SELECTED) {
				removeItem(helpers, SELECTED_OUTLINE);
				scene.remove(SELECTED_OUTLINE);

				SELECTED = INTERSECTED;
				SELECTED_OUTLINE = OUTLINE;
				OUTLINE = null;
				SELECTED_OUTLINE.material.color.set(26666);
			} else {
				//SELECTED.add(camera);
				controls.target = SELECTED.position;
				//controls.enablePan = false;
			}
		}

		console.log(SELECTED);
	},
	false
);
window.addEventListener(
	"keydown",
	event => {
		if (SELECTED) {
			planetRef = planets.filter(p => p.obj.includes(SELECTED));
			if (event.keyCode == 189) {
				console.log("decrease mass", planetRef[0]);
				planetRef[0].m /= 5;
				planetRef[0].alt_r /= 1.2;
			} else if (event.keyCode == 187) {
				planetRef[0].m *= 5;
				planetRef[0].alt_r *= 1.2;
			}
		}
	},
	false
);
//create geometry
function loadScene() {
	//add a default sphere during load as placeholder
	var mesh = new THREE.Mesh(
		new THREE.SphereGeometry(4),
		new THREE.MeshStandardMaterial({
			emissive: new THREE.Color("#FFEB65")
		})
	);
	scene.add(mesh);

	var light = new THREE.PointLight();
	light.intensity = 3;
	light.distance = 500;
	//scene.add(light);

	cubetex = new THREE.CubeTextureLoader()
		.setPath("skybox/")
		.load([
			"right.png",
			"left.png",
			"top.png",
			"bottom.png",
			"front.png",
			"back.png"
		]);
	scene.background = cubetex;

	var loader = new THREE.ObjectLoader();

	var geometry = new THREE.SphereGeometry(0.5, 32, 32);
	var textureLoader = new THREE.TextureLoader();
	//load sun, since its just a texture, more efficient than packaging it into an object
	textureLoader.load("scene_geometry/sunmap.jpg", texture => {
		var geometry = new THREE.SphereGeometry(1, 32, 16);
		var material = new THREE.MeshStandardMaterial({
			emissiveMap: texture,
			emissive: new THREE.Color(0.7, 0.7, 0.7)
		});
		var obj = new THREE.Mesh(geometry, material);
		obj.add(light);
		scene.remove(mesh);
		scene.add(obj);
		planets[0].obj.push(obj);
	});
	loader.load("scene_geometry/mercury.json", obj => {
		scene.add(obj);
		planets[1].obj.push(obj);
	});
	loader.load("scene_geometry/venus.json", obj => {
		scene.add(obj);
		planets[2].obj.push(obj);
	});
	loader.load("scene_geometry/earth.json", obj => {
		scene.add(obj);
		planets[3].obj.push(obj);
	});
	loader.load("scene_geometry/atmosphere.json", obj => {
		scene.add(obj);
		planets[3].obj.push(obj);
		let atm = obj;
		setInterval(function() {
			atm.rotation.y += 0.005;
		}, 10);
	});
	loader.load("scene_geometry/mars.json", obj => {
		scene.add(obj);
		planets[4].obj.push(obj);
	});
	loader.load("scene_geometry/jupiter.json", obj => {
		scene.add(obj);
		planets[5].obj.push(obj);
	});
	loader.load("scene_geometry/saturn.json", obj => {
		scene.add(obj);
		planets[6].obj.push(obj);
	});
	loader.load("scene_geometry/saturnRing.json", obj => {
		scene.add(obj);
		planets[6].obj.push(obj);
	});
	loader.load("scene_geometry/uranus.json", obj => {
		scene.add(obj);
		planets[7].obj.push(obj);
	});
	loader.load("scene_geometry/uranusRing.json", obj => {
		scene.add(obj);
		planets[7].obj.push(obj);
	});
	loader.load("scene_geometry/neptune.json", obj => {
		scene.add(obj);
		planets[8].obj.push(obj);
	});

	camera.position.z = 50;
	camera.position.x = 50;
	camera.position.y = 10;
	scene.add(new THREE.AmbientLight(0x4f4f4f, 1)); // soft white light
}
loadScene();

function update() {
	controls.update();
	updateSimulation();

	//update positions and sizes
	for (var p of planets) {
		if (p.obj.length > 0) {
			let raaaa = false
				? p.r * origin.planet_scale * origin.scale
				: p.alt_r * origin.planet_scale;
			for (var ob of p.obj) {
				ob.position.set(
					(p.p.x + origin.x) * origin.scale,
					p.p.z * origin.scale,
					(p.p.y + origin.y) * origin.scale
				);
				ob.scale.set(raaaa, raaaa, raaaa);
			}
		}
	}

	updateOutlines();
}

function removeItem(arr, value) {
	var index = arr.indexOf(value);
	if (index > -1) {
		arr.splice(index, 1);
	}
	return arr;
}

function updateOutlines() {
	//get hovered planets
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(scene.children);
	intersects = intersects.filter(e => !helpers.includes(e.object));
	if (intersects.length > 0) {
		//there is an intersection
		if (INTERSECTED != intersects[0].object) {
			//new object has been selected
			//remove the old outline
			if (OUTLINE) {
				removeItem(helpers, OUTLINE);
				scene.remove(OUTLINE);
			}

			//add a new outline
			INTERSECTED = intersects[0].object;

			OUTLINE = new THREE.Mesh(
				intersects[0].object.geometry.clone(),
				new THREE.MeshBasicMaterial({
					color: 0xff0000,
					side: THREE.BackSide
				})
			);
			OUTLINE.scale.copy(INTERSECTED.scale);
			OUTLINE.scale.multiplyScalar(1.1);
			OUTLINE.position.copy(INTERSECTED.position);
			OUTLINE.rotation.copy(INTERSECTED.rotation);
			scene.add(OUTLINE);
			helpers.push(OUTLINE);
		} else {
			if (OUTLINE) OUTLINE.position.copy(INTERSECTED.position);
		}
	} else {
		//unselect the object
		if (OUTLINE) {
			removeItem(helpers, OUTLINE);
			scene.remove(OUTLINE);
		}
		INTERSECTED = null;
		OUTLINE = null;
	}

	if (SELECTED) {
		SELECTED_OUTLINE.position.copy(SELECTED.position);
	}
}

function toScreenPosition(obj, camera) {
	var vector = new THREE.Vector3();

	// TODO: need to update this when resize window
	var widthHalf = 0.5 * renderer.getContext().canvas.width;
	var heightHalf = 0.5 * renderer.getContext().canvas.height;

	vector.setFromMatrixPosition(obj.matrixWorld);
	vector.project(camera);

	vector.x = vector.x * widthHalf + widthHalf;
	vector.y = -(vector.y * heightHalf) + heightHalf;

	return {
		x: vector.x,
		y: vector.y
	};
}

function render() {
	//render tooltip
	if (SELECTED) {
		var proj = toScreenPosition(SELECTED, camera);

		planetRef = planets.filter(p => p.obj.includes(SELECTED));

		tooltip.style.left = proj.x + "px";
		tooltip.style.top = proj.y + "px";
		tooltip.innerHTML =
			planetRef[0].name +
			"<br>mass: " +
			planetRef[0].m +
			" kg<br>distance from sun: " +
			~~(sun.p.subtract(planetRef[0].p).length / 1000) +
			" km<br>velocity: " +
			~~(planetRef[0].v.length / 1000) +
			" km/s";
	}

	renderer.render(scene, camera);
}

function GameLoop() {
	requestAnimationFrame(GameLoop);
	update();
	render();
}
GameLoop();
