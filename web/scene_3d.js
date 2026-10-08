/**
 * Carlo's Bacolod Chicken House Express (CHE) Makati - 3D Digital Twin Visualizer
 * Reconstructed based on Savana Market floor plan schematic and interior photo:
 * - Left Dining Area: Enclosed room with 6 square dining tables (2x3 grid)
 * - Waiting Area: Line of 4 waiting chairs between left room and kitchen/queue
 * - Central Enclosed Kitchen: Charcoal Inasal grill pit, exhaust hood, assembly prep,
 *   and pass-through order/pickup window
 * - Cashier Counter: Registers POS 1 (Shared/Dine-In) and POS 2 (Express/Decoupled)
 * - Right Dining Area: Open dining hall with 6 table groups (mix of rectangular wood & metal)
 * - Front Entrance & Arcade: Yellow capiz screen partition, Savana Market corridor, balking threshold
 * - Realistic Seat Occupancy & Waypoint Navigation:
 *   Patrons sit directly on one of the available chairs at their assigned table,
 *   face the table in a sitting posture, and walk along circulation paths & doorways when leaving.
 */

class Restaurant3DScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Entity Meshes tracking
    this.customerMeshes = new Map(); // id -> THREE.Group
    this.tableMeshes = [];           // array of 12 table groups
    this.waitingChairMeshes = [];    // array of 4 waiting chair groups
    this.waitingSeats = [];          // list of waiting chair world slots
    this.smokeParticles = null;
    this.ceilingPendants = [];

    // Camera preset targets
    this.cameraPresets = {
      floor_plan: { pos: [0, 46, 0.01], target: [0, 0, 0] },
      isometric: { pos: [22, 26, 26], target: [0, 0, 0] },
      counter: { pos: [0, 8, 14], target: [0, 2, 2] },
      kitchen: { pos: [0, 7, -3], target: [0, 2, -7] },
      dining_left: { pos: [-11, 9, 12], target: [-11, 1, 0] },
      dining_right: { pos: [11, 10, 12], target: [10, 1, 0] },
    };

    this.activePreset = 'isometric';
    this.targetCamPos = new THREE.Vector3(22, 26, 26);
    this.targetCamLookAt = new THREE.Vector3(0, 0, 0);

    // Scenario visual flags
    this.decoupledMode = false;
    this.expediterActive = false;
    this.dynamicStaffActive = false;
    this.counter2Sign = null;
    this.expediterMesh = null;
    this.cashier1 = null;
    this.cashier2 = null;
    this.assemblyStaff = null;
    this.grillMaster = null;
    this.currentSimTime = 0.0;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x181a1d); // Warm charcoal studio background
    this.scene.fog = new THREE.FogExp2(0x181a1d, 0.012);

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 200);
    this.camera.position.set(22, 26, 26);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.05; // Prevent beneath floor
    this.controls.minDistance = 6;
    this.controls.maxDistance = 75;
    this.controls.target.set(0, 0, 0);

    // 5. Lighting matching practical interior photo
    this.setupLighting();

    // 6. Build Architectural Environment matching floor plan
    this.buildFloorAndCeiling();
    this.buildArchitecturalWalls();
    this.buildCentralKitchen();
    this.buildCashierCounters();
    this.buildLeftDiningRoom();
    this.buildWaitingArea();
    this.buildRightDiningHall();
    this.buildSavanaArcadeEntrance();
    this.buildSmokeParticleSystem();

    // 7. Event listeners
    window.addEventListener('resize', () => this.onWindowResize());

    // 8. Animation loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    // Ambient with warm incandescent bounce
    const ambient = new THREE.AmbientLight(0xfff1e0, 0.9);
    this.scene.add(ambient);

    // Main directional sunlight / Savana street light
    const dirLight = new THREE.DirectionalLight(0xfffaed, 0.85);
    dirLight.position.set(15, 25, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 70;
    dirLight.shadow.camera.left = -22;
    dirLight.shadow.camera.right = 22;
    dirLight.shadow.camera.top = 22;
    dirLight.shadow.camera.bottom = -22;
    this.scene.add(dirLight);

    // Inasal Charcoal Grill Ember light
    this.grillLight = new THREE.PointLight(0xff4500, 2.8, 14, 1.8);
    this.grillLight.position.set(0, 2.5, -7.5);
    this.scene.add(this.grillLight);

    // Warm pendant spots over dining tables & counters
    const pendantSpots = [
      { x: -11, y: 7.5, z: 0, color: 0xffddaa, int: 1.3 }, // Left dining room
      { x: 0, y: 7.5, z: 3.5, color: 0xffedd5, int: 1.6 },  // Cashier counters
      { x: 10, y: 7.5, z: -4, color: 0xffddaa, int: 1.4 },  // Right dining north
      { x: 10, y: 7.5, z: 4, color: 0xffddaa, int: 1.4 },   // Right dining south
    ];

    pendantSpots.forEach(p => {
      const light = new THREE.PointLight(p.color, p.int, 16);
      light.position.set(p.x, p.y, p.z);
      this.scene.add(light);
    });
  }

  buildFloorAndCeiling() {
    // 1. Restaurant Main Tile Floor (Light mottled warm gray ceramic tile)
    const floorGeo = new THREE.PlaneGeometry(32, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xbbb7ae, // Real CHE light concrete tile gray
      roughness: 0.65,
      metalness: 0.08,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Tile grid lines overlay for realistic architectural texture
    const grid = new THREE.GridHelper(32, 32, 0x9e998e, 0xa8a398);
    grid.position.set(0, 0.01, 0);
    this.scene.add(grid);

    // 2. Savana Commercial Center Sidewalk Corridor (Outside front entrance)
    const corridorGeo = new THREE.PlaneGeometry(36, 12);
    const corridorMat = new THREE.MeshStandardMaterial({
      color: 0x8a857b,
      roughness: 0.85,
      metalness: 0.05,
    });
    const corridor = new THREE.Mesh(corridorGeo, corridorMat);
    corridor.rotation.x = -Math.PI / 2;
    corridor.position.set(0, -0.01, 18);
    corridor.receiveShadow = true;
    this.scene.add(corridor);

    // 3. Black Open Industrial Ceiling Structure (Exposed ducts and steel beams)
    const beamGeo = new THREE.BoxGeometry(32, 0.4, 0.4);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.7 });
    for (let z = -12; z <= 12; z += 6) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 7.8, z);
      this.scene.add(beam);
    }
  }

  buildArchitecturalWalls() {
    const wallGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe4c91b, // CHE signature marigold yellow
      roughness: 0.7,
      metalness: 0.02,
    });
    const wallHeight = 5.2;

    const addWall = (w, h, d, x, y, z) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      wallGroup.add(mesh);
      return mesh;
    };

    // 1. Back Exterior Wall (North wall, Z = -13.9)
    addWall(32, wallHeight, 0.3, 0, wallHeight / 2, -13.9);

    // 2. West Exterior Wall (Left dining outer wall, X = -15.9)
    addWall(0.3, wallHeight, 28, -15.9, wallHeight / 2, 0);

    // 3. East Exterior Wall (Right dining outer wall, X = 15.9)
    addWall(0.3, wallHeight, 28, 15.9, wallHeight / 2, 0);

    // 4. Partition separating Left Dining Room from Central Circulation Corridor (X = -6.5)
    // Has a doorway opening at Z = 1 to 4 for dining patrons to enter
    addWall(0.3, wallHeight, 11, -6.5, wallHeight / 2, -8.5); // North half
    addWall(0.3, wallHeight, 8, -6.5, wallHeight / 2, 8.5);   // South half
    addWall(0.3, 1.4, 4.5, -6.5, wallHeight - 0.7, 2.5);     // Doorway header

    // 5. Enclosing Walls for Central Kitchen (X = -4.5 to +4.5, Z = -13.8 to +1.0)
    addWall(0.25, wallHeight, 13.8, -4.5, wallHeight / 2, -6.9);
    addWall(0.25, wallHeight, 13.8, 4.5, wallHeight / 2, -6.9);

    // 6. Signature Yellow Column
    const colGeo = new THREE.BoxGeometry(1.2, wallHeight, 1.2);
    const col = new THREE.Mesh(colGeo, wallMat);
    col.position.set(5.0, wallHeight / 2, 4.0);
    col.castShadow = true;
    wallGroup.add(col);

    // 7. Chicken House Inasal Wall Graphic / Mascot Decal on back wall
    this.createMascotMural(wallGroup);

    this.scene.add(wallGroup);
  }

  createMascotMural(parentGroup) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#E4C91B';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#B22225';
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(256, 256, 185, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#B22225';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("CARLO'S BACOLOD", 256, 160);
    ctx.fillText("CHICKEN HOUSE", 256, 210);

    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText("EXPRESS MAKATI", 256, 260);

    ctx.fillStyle = '#1B1B1D';
    ctx.font = '20px sans-serif';
    ctx.fillText("Savana Commercial Center", 256, 320);
    ctx.fillText("Authentic Bacolod Inasal", 256, 350);

    const texture = new THREE.CanvasTexture(canvas);
    const muralGeo = new THREE.PlaneGeometry(5.0, 5.0);
    const muralMat = new THREE.MeshBasicMaterial({ map: texture });
    const mural = new THREE.Mesh(muralGeo, muralMat);
    mural.position.set(0, 3.2, -13.7);
    parentGroup.add(mural);
  }

  buildCentralKitchen() {
    const kitchenGroup = new THREE.Group();

    // 1. Charcoal Inasal Grill Pit (North center of kitchen: Z = -7.5, X = 0)
    const hearthGeo = new THREE.BoxGeometry(5.2, 1.3, 3.2);
    const hearthMat = new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.95 });
    const hearth = new THREE.Mesh(hearthGeo, hearthMat);
    hearth.position.set(0, 0.65, -7.5);
    hearth.castShadow = true;
    hearth.receiveShadow = true;
    kitchenGroup.add(hearth);

    // Glowing orange ember bed
    const emberGeo = new THREE.BoxGeometry(4.8, 0.15, 2.8);
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      emissive: 0xf97316,
      emissiveIntensity: 0.95,
      roughness: 0.9,
    });
    const embers = new THREE.Mesh(emberGeo, emberMat);
    embers.position.set(0, 1.25, -7.5);
    kitchenGroup.add(embers);

    // Steel grill grate with skewers of chicken inasal
    const grateGeo = new THREE.BoxGeometry(4.9, 0.04, 2.9);
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, wireframe: true });
    const grate = new THREE.Mesh(grateGeo, grateMat);
    grate.position.set(0, 1.35, -7.5);
    kitchenGroup.add(grate);

    // Chicken inasal skewers
    const skewerMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.5 });
    const chickenGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.8, 8);
    for (let i = -1.8; i <= 1.8; i += 0.7) {
      for (let j = -0.8; j <= 0.8; j += 0.8) {
        const chickenPiece = new THREE.Mesh(chickenGeo, skewerMat);
        chickenPiece.rotation.z = Math.PI / 2;
        chickenPiece.position.set(i, 1.45, -7.5 + j);
        chickenPiece.castShadow = true;
        kitchenGroup.add(chickenPiece);
      }
    }

    // Heavy Commercial Exhaust Hood & Chimney Duct
    const hoodGeo = new THREE.CylinderGeometry(1.2, 2.8, 1.6, 4);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 3.8, -7.5);
    hood.rotation.y = Math.PI / 4;
    kitchenGroup.add(hood);

    const ductGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.0, 16);
    const duct = new THREE.Mesh(ductGeo, hoodMat);
    duct.position.set(0, 5.8, -7.5);
    kitchenGroup.add(duct);

    // Grill Master Cook (White apron & chef hat)
    this.grillMaster = this.createStaffModel(0xffffff, true);
    this.grillMaster.position.set(0, 0, -5.5);
    this.grillMaster.rotation.y = Math.PI;
    kitchenGroup.add(this.grillMaster);

    // 2. Kitchen Assembly & Prep Counter (Z = -2.0)
    const prepTableGeo = new THREE.BoxGeometry(7.0, 1.3, 1.6);
    const prepTableMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const prepTable = new THREE.Mesh(prepTableGeo, prepTableMat);
    prepTable.position.set(0, 0.65, -2.0);
    kitchenGroup.add(prepTable);

    // Staging bags for takeout / Grab / Foodpanda
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 });
    const bagGeo = new THREE.BoxGeometry(0.45, 0.6, 0.3);
    for (let b = -2.2; b <= 2.2; b += 0.9) {
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(b, 1.6, -2.0);
      kitchenGroup.add(bag);
    }

    // Assembly Staff Worker (flex staff active in Scenario C)
    this.assemblyStaff = this.createStaffModel(0x38bdf8, false);
    this.assemblyStaff.position.set(1.5, 0, -1.0);
    this.assemblyStaff.rotation.y = Math.PI;
    kitchenGroup.add(this.assemblyStaff);

    this.scene.add(kitchenGroup);
  }

  buildCashierCounters() {
    const counterGroup = new THREE.Group();

    // Pass-through Service Window / Cashier Front Counter (Z = 1.6)
    const counterGeo = new THREE.BoxGeometry(8.0, 1.4, 1.4);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.7 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.7, 1.6);
    counter.castShadow = true;
    counter.receiveShadow = true;
    counterGroup.add(counter);

    // Stainless ledge countertop
    const topGeo = new THREE.BoxGeometry(8.2, 0.08, 1.6);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 1.44, 1.6);
    counterGroup.add(top);

    // Register POS 1 (Shared / Dine-In: Left side of counter at X = -2.0)
    const pos1 = this.createPOSStation("POS 1");
    pos1.position.set(-2.0, 1.48, 1.7);
    counterGroup.add(pos1);

    // Register POS 2 (Express / Decoupled counter at X = 2.0)
    const pos2 = this.createPOSStation("POS 2");
    pos2.position.set(2.0, 1.48, 1.7);
    counterGroup.add(pos2);

    // Decoupled Express Signage
    const signGeo = new THREE.BoxGeometry(2.2, 0.45, 0.08);
    const signMat2 = new THREE.MeshBasicMaterial({ color: 0x00b14f });
    this.counter2Sign = new THREE.Mesh(signGeo, signMat2);
    this.counter2Sign.position.set(2.0, 2.7, 1.6);
    this.counter2Sign.visible = false;
    counterGroup.add(this.counter2Sign);

    // Cashier 1 Staff (CHE Red Apron)
    this.cashier1 = this.createStaffModel(0xb22225, false);
    this.cashier1.position.set(-2.0, 0, 0.6);
    counterGroup.add(this.cashier1);

    // Cashier 2 Staff (Express - active in Scenario A)
    this.cashier2 = this.createStaffModel(0x00b14f, false);
    this.cashier2.position.set(2.0, 0, 0.6);
    this.cashier2.visible = false;
    counterGroup.add(this.cashier2);

    // Floating Expediter (Scenario B - roving with clipboard)
    this.expediterMesh = this.createStaffModel(0xf59e0b, false);
    this.expediterMesh.position.set(-1.0, 0, 8.0);
    this.expediterMesh.visible = false;
    this.scene.add(this.expediterMesh);

    this.scene.add(counterGroup);
  }

  buildLeftDiningRoom() {
    // 6 Small Square Dining Tables in 2x3 Grid (Tables 1 - 6)
    const leftTableCoords = [
      { id: 1, x: -12.5, z: -6.5 },
      { id: 2, x: -12.5, z: 0.0 },
      { id: 3, x: -12.5, z: 6.5 },
      { id: 4, x: -9.5, z: -6.5 },
      { id: 5, x: -9.5, z: 0.0 },
      { id: 6, x: -9.5, z: 6.5 },
    ];

    leftTableCoords.forEach(t => {
      const tblGroup = this.createSquareTable(t.id, 2);
      tblGroup.position.set(t.x, 0, t.z);
      this.tableMeshes.push(tblGroup);
      this.scene.add(tblGroup);
    });

    const pendant = this.createIndustrialPendant();
    pendant.position.set(-11.0, 5.0, 0.0);
    this.scene.add(pendant);
  }

  buildWaitingArea() {
    // Row of 4 Waiting Chairs along the central hallway (X = -5.5, Z = 4.0 to 9.5)
    for (let i = 0; i < 4; i++) {
      const zPos = 4.0 + i * 1.6;
      const chair = this.createMetalChair('black', Math.PI / 2); // Facing east towards corridor
      chair.position.set(-5.5, 0, zPos);
      this.waitingChairMeshes.push(chair);
      this.waitingSeats.push({
        index: i,
        pos: new THREE.Vector3(-5.5, 0, zPos),
        rotY: Math.PI / 2,
        occupantId: null
      });
      this.scene.add(chair);
    }
  }

  buildRightDiningHall() {
    // 6 Table Groups (Tables 7 - 12): Mix of rectangular 4-seat wood tables & square 2-seat tables
    const rightTableCoords = [
      { id: 7, x: 8.5, z: -6.5, type: 'rect4' },
      { id: 8, x: 13.0, z: -6.5, type: 'rect4' },
      { id: 9, x: 8.5, z: 0.0, type: 'square2' },
      { id: 10, x: 13.0, z: 0.0, type: 'rect4' },
      { id: 11, x: 8.5, z: 6.5, type: 'square2' },
      { id: 12, x: 13.0, z: 6.5, type: 'rect4' },
    ];

    rightTableCoords.forEach(t => {
      const tblGroup = t.type === 'rect4'
        ? this.createRectangularTable(t.id)
        : this.createSquareTable(t.id, 2);
      tblGroup.position.set(t.x, 0, t.z);
      this.tableMeshes.push(tblGroup);
      this.scene.add(tblGroup);
    });

    [ { x: 10.0, z: -5.0 }, { x: 10.0, z: 4.0 } ].forEach(p => {
      const lamp = this.createIndustrialPendant();
      lamp.position.set(p.x, 5.0, p.z);
      this.scene.add(lamp);
    });
  }

  buildSavanaArcadeEntrance() {
    const facadeGroup = new THREE.Group();

    const screenGeo = new THREE.BoxGeometry(9.0, 3.8, 0.2);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0xe4c91b, roughness: 0.8 });

    const leftScreen = new THREE.Mesh(screenGeo, screenMat);
    leftScreen.position.set(-10.5, 1.9, 13.0);
    facadeGroup.add(leftScreen);

    const rightScreen = new THREE.Mesh(screenGeo, screenMat);
    rightScreen.position.set(10.5, 1.9, 13.0);
    facadeGroup.add(rightScreen);

    const signGeo = new THREE.BoxGeometry(10.0, 1.1, 0.25);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.5 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 4.4, 13.0);
    facadeGroup.add(sign);

    // Realistic architectural entrance doorway threshold
    const lineGeo = new THREE.PlaneGeometry(10.0, 0.15);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const thresholdTrim = new THREE.Mesh(lineGeo, lineMat);
    thresholdTrim.rotation.x = -Math.PI / 2;
    thresholdTrim.position.set(0, 0.02, 14.0);
    facadeGroup.add(thresholdTrim);

    this.scene.add(facadeGroup);
  }

  // ==========================================================================
  // Furniture Builders with Explicit Seat Slots
  // ==========================================================================

  createRectangularTable(tableId) {
    const group = new THREE.Group();
    group.userData = {
      tableId,
      isOccupied: false,
      // 4 distinct chairs around this table
      seats: [
        { slotId: 0, localPos: new THREE.Vector3(-0.7, 0, -1.1), rotY: 0, occupantId: null },
        { slotId: 1, localPos: new THREE.Vector3(0.7, 0, -1.1), rotY: 0, occupantId: null },
        { slotId: 2, localPos: new THREE.Vector3(-0.7, 0, 1.1), rotY: Math.PI, occupantId: null },
        { slotId: 3, localPos: new THREE.Vector3(0.7, 0, 1.1), rotY: Math.PI, occupantId: null },
      ]
    };

    // Solid Acacia Wood Tabletop (muted natural wood #B38B65)
    const topGeo = new THREE.BoxGeometry(2.8, 0.1, 1.6);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xb38b65, roughness: 0.7 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 1.35, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Thin dark metal tubular legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, metalness: 0.7 });
    [[-1.2, -0.65], [1.2, -0.65], [-1.2, 0.65], [1.2, 0.65]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.65, lz);
      group.add(leg);
    });

    // 4 Metal Chairs: 2 Red, 2 Black
    const chairConfigs = [
      { color: 'red', x: -0.7, z: -1.1, rot: 0 },
      { color: 'black', x: 0.7, z: -1.1, rot: 0 },
      { color: 'black', x: -0.7, z: 1.1, rot: Math.PI },
      { color: 'red', x: 0.7, z: 1.1, rot: Math.PI },
    ];
    chairConfigs.forEach(c => {
      const chair = this.createMetalChair(c.color, c.rot);
      chair.position.set(c.x, 0, c.z);
      group.add(chair);
    });

    const caddy = this.createCondimentCaddy();
    caddy.position.set(0, 1.4, 0);
    group.add(caddy);

    return group;
  }

  createSquareTable(tableId, seats = 2) {
    const group = new THREE.Group();
    group.userData = {
      tableId,
      isOccupied: false,
      // 2 distinct chairs facing North / South
      seats: [
        { slotId: 0, localPos: new THREE.Vector3(0, 0, -1.05), rotY: 0, occupantId: null },
        { slotId: 1, localPos: new THREE.Vector3(0, 0, 1.05), rotY: Math.PI, occupantId: null },
      ]
    };

    // Light laminate square tabletop (#D6D3CC)
    const topGeo = new THREE.BoxGeometry(1.6, 0.08, 1.6);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xd6d3cc, roughness: 0.6 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 1.35, 0);
    top.castShadow = true;
    group.add(top);

    // Center pedestal base
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.3, 10);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, metalness: 0.8 });
    const post = new THREE.Mesh(postGeo, baseMat);
    post.position.set(0, 0.65, 0);
    group.add(post);

    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.06, 12);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.03, 0);
    group.add(base);

    // 2 Chairs facing each other
    const chair1 = this.createMetalChair('red', 0);
    chair1.position.set(0, 0, -1.05);
    group.add(chair1);

    const chair2 = this.createMetalChair('black', Math.PI);
    chair2.position.set(0, 0, 1.05);
    group.add(chair2);

    const caddy = this.createCondimentCaddy();
    caddy.position.set(0, 1.39, 0);
    group.add(caddy);

    return group;
  }

  createMetalChair(backColor = 'red', rotY = 0) {
    const chair = new THREE.Group();

    // Thin chrome steel tubular legs & frame
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x90969b, metalness: 0.85, roughness: 0.25 });
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6);
    [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, chromeMat);
      leg.position.set(lx, 0.4, lz);
      chair.add(leg);
    });

    // Padded tan/cushioned seat pad
    const seatGeo = new THREE.BoxGeometry(0.55, 0.06, 0.55);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xd2c0a5, roughness: 0.8 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.8, 0);
    chair.add(seat);

    // Slatted metal backrest (Vermilion red #B22225 or Matte black #1B1B1D)
    const colorHex = backColor === 'red' ? 0xb22225 : 0x1b1b1d;
    const backGeo = new THREE.BoxGeometry(0.55, 0.55, 0.04);
    const backMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, 1.25, -0.25);
    chair.add(back);

    // Chrome upright supports for backrest
    const postGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6);
    [-0.22, 0.22].forEach(px => {
      const p = new THREE.Mesh(postGeo, chromeMat);
      p.position.set(px, 1.1, -0.24);
      chair.add(p);
    });

    chair.rotation.y = rotY;
    return chair;
  }

  createCondimentCaddy() {
    const caddy = new THREE.Group();
    const trayGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.04, 10);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    caddy.add(tray);

    const oilGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8);
    const oilMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.9 });
    const oil = new THREE.Mesh(oilGeo, oilMat);
    oil.position.set(-0.07, 0.17, 0);
    caddy.add(oil);

    const vinGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.32, 8);
    const vinMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.75 });
    const vin = new THREE.Mesh(vinGeo, vinMat);
    vin.position.set(0.07, 0.18, 0);
    caddy.add(vin);

    return caddy;
  }

  createIndustrialPendant() {
    const pendant = new THREE.Group();
    const cordGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.5, 6);
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x111 });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.set(0, 1.25, 0);
    pendant.add(cord);

    const shadeGeo = new THREE.ConeGeometry(0.45, 0.35, 16, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.6 });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    pendant.add(shade);

    const bulbGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0, -0.08, 0);
    pendant.add(bulb);

    return pendant;
  }

  createPOSStation(label) {
    const pos = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(0.6, 0.1, 0.5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    pos.add(base);

    const screenGeo = new THREE.BoxGeometry(0.65, 0.45, 0.06);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x0284c7, emissiveIntensity: 0.4 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.35, 0.05);
    screen.rotation.x = -Math.PI / 8;
    pos.add(screen);

    return pos;
  }

  createStaffModel(apronColor, hasHat = false) {
    const staff = new THREE.Group();
    staff.userData = {
      walkPhase: Math.random() * Math.PI * 2,
      workPhase: Math.random() * Math.PI * 2,
      targetPos: new THREE.Vector3(),
    };

    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.3, 1.1, 10);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.5, 0);
    staff.add(body);
    staff.userData.torso = body;

    const apronGeo = new THREE.BoxGeometry(0.46, 0.95, 0.08);
    const apronMat = new THREE.MeshStandardMaterial({ color: apronColor });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(0, 1.45, 0.3);
    staff.add(apron);

    const headGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 2.3, 0);
    staff.add(head);

    const hatGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.2, 12);
    const hatMat = new THREE.MeshStandardMaterial({ color: hasHat ? 0xffffff : apronColor });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.set(0, 2.5, 0);
    staff.add(hat);

    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.95, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.14, 0.48, 0);
    staff.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.14, 0.48, 0);
    staff.add(rightLeg);

    staff.userData.leftLeg = leftLeg;
    staff.userData.rightLeg = rightLeg;

    // Articulated arms for working and packaging motions
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.36, 1.45, 0.1);
    staff.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.36, 1.45, 0.1);
    staff.add(rightArm);

    staff.userData.leftArm = leftArm;
    staff.userData.rightArm = rightArm;

    staff.castShadow = true;
    return staff;
  }

  buildSmokeParticleSystem() {
    const particleCount = 140;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      positions[p * 3] = (Math.random() - 0.5) * 3.6;
      positions[p * 3 + 1] = 1.4 + Math.random() * 3.2;
      positions[p * 3 + 2] = -7.5 + (Math.random() - 0.5) * 2.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xd4d4d8,
      size: 0.35,
      transparent: true,
      opacity: 0.3,
    });

    this.smokeParticles = new THREE.Points(geom, pMat);
    this.scene.add(this.smokeParticles);
  }

  // ==========================================================================
  // Customer & Courier Entities & Waypoint Navigation
  // ==========================================================================

  createCustomerEntity(cust) {
    const group = new THREE.Group();
    group.userData = {
      id: cust.id,
      channel: cust.channel,
      courierBrand: cust.courier_brand,
      status: cust.status,
      assignedTableId: null,
      assignedSeatSlot: null,
      assignedWaitingSeatIdx: null,
      isSeated: false,
      waypoints: [], // Queue of Vector3 waypoints to follow
      targetPos: new THREE.Vector3(),
      targetRotY: 0,
      walkPhase: Math.random() * Math.PI * 2,
    };

    let shirtColor = 0x3b82f6; // Dine-in blue
    let hasBackpack = false;
    let backpackColor = 0x000000;
    let hasHelmet = false;

    if (cust.channel === 'delivery_courier') {
      hasBackpack = true;
      hasHelmet = true;
      if (cust.courier_brand === 'GrabFood') {
        shirtColor = 0x00b14f;
        backpackColor = 0x00b14f;
      } else {
        shirtColor = 0xd60665;
        backpackColor = 0xd60665;
      }
    } else if (cust.channel === 'takeout') {
      shirtColor = 0xf97316; // Takeout orange
    }

    // Torso
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.26, 1.05, 10);
    const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.45, 0);
    body.castShadow = true;
    group.add(body);
    group.userData.torso = body;

    // Head / Helmet
    const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
    if (hasHelmet) {
      const helmetMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
      const helmet = new THREE.Mesh(headGeo, helmetMat);
      helmet.position.set(0, 2.25, 0);
      group.add(helmet);
    } else {
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0 });
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.set(0, 2.25, 0);
      group.add(head);
    }

    // Courier insulated backpack box
    if (hasBackpack) {
      const boxGeo = new THREE.BoxGeometry(0.65, 0.75, 0.55);
      const boxMat = new THREE.MeshStandardMaterial({ color: backpackColor });
      const backpack = new THREE.Mesh(boxGeo, boxMat);
      backpack.position.set(0, 1.5, -0.4);
      group.add(backpack);
    }

    // Articulated Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.13, 0.45, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.13, 0.45, 0);
    group.add(rightLeg);

    group.userData.leftLeg = leftLeg;
    group.userData.rightLeg = rightLeg;

    // Overhead channel indicator dot
    const dotGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: shirtColor });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(0, 2.7, 0);
    group.add(dot);

    // Initial spawn point outside on Savana Market corridor
    group.position.set(0, 0, 22.0);
    this.scene.add(group);
    this.customerMeshes.set(cust.id, group);

    return group;
  }

  // Find and reserve an unoccupied chair slot at a dining table
  assignChairAtTable(tableId, custId) {
    const tblMesh = this.tableMeshes[tableId - 1];
    if (!tblMesh || !tblMesh.userData.seats) return null;

    const availableSeat = tblMesh.userData.seats.find(s => s.occupantId === null);
    if (availableSeat) {
      availableSeat.occupantId = custId;
      const worldPos = new THREE.Vector3()
        .copy(tblMesh.position)
        .add(availableSeat.localPos);
      return {
        slotId: availableSeat.slotId,
        pos: worldPos,
        rotY: availableSeat.rotY,
      };
    }
    // Fallback if all chairs occupied
    return {
      slotId: 0,
      pos: new THREE.Vector3().copy(tblMesh.position).add(new THREE.Vector3(0, 0, 0.8)),
      rotY: Math.PI,
    };
  }

  releaseChairAtTable(tableId, custId) {
    const tblMesh = this.tableMeshes[tableId - 1];
    if (!tblMesh || !tblMesh.userData.seats) return;

    const seat = tblMesh.userData.seats.find(s => s.occupantId === custId);
    if (seat) {
      seat.occupantId = null;
    }
  }

  // Reserve a waiting chair in the hallway
  assignWaitingSeat(custId) {
    const seat = this.waitingSeats.find(s => s.occupantId === null);
    if (seat) {
      seat.occupantId = custId;
      return seat;
    }
    return null;
  }

  releaseWaitingSeat(custId) {
    const seat = this.waitingSeats.find(s => s.occupantId === custId);
    if (seat) {
      seat.occupantId = null;
    }
  }

  syncQueuePositions(sim) {
    if (!sim) return;

    if (sim.config.decoupled) {
      sim.queueDineIn.forEach((c, idx) => {
        if (c.status === 'QUEUING_ORDER') {
          this.updateCustomerPosition(c, idx);
        }
      });
      sim.queueExpress.forEach((c, idx) => {
        if (c.status === 'QUEUING_ORDER') {
          this.updateCustomerPosition(c, idx);
        }
      });
    } else {
      sim.queueShared.forEach((c, idx) => {
        if (c.status === 'QUEUING_ORDER') {
          this.updateCustomerPosition(c, idx);
        }
      });
    }
  }

  updateCustomerPosition(cust, queueSlotIndex = 0) {
    let mesh = this.customerMeshes.get(cust.id);
    if (!mesh) {
      mesh = this.createCustomerEntity(cust);
    }

    const u = mesh.userData;
    u.status = cust.status;

    if (cust.status === 'BALKED') {
      // Release any chair
      this.releaseWaitingSeat(cust.id);
      u.isSeated = false;
      // Waypoint: Turn around and walk south through the Savana sidewalk
      u.waypoints = [
        new THREE.Vector3(mesh.position.x || 0, 0, 14.5),
        new THREE.Vector3(2.5, 0, 24.0)
      ];
    } else if (cust.status === 'QUEUING_ORDER') {
      this.releaseWaitingSeat(cust.id);
      u.isSeated = false;

      const laneX = (this.decoupledMode && cust.channel !== 'dine_in') ? 2.0 : -2.0;
      // Tight realistic human queue spacing (1.0m per person)
      // Slot 0 is placed at Z = 3.8, right behind ordering person at Z = 2.7
      const targetZ = 3.8 + queueSlotIndex * 1.0;
      const queueTarget = new THREE.Vector3(laneX, 0, targetZ);

      // If just entering the restaurant from street
      if (mesh.position.z > 16.0) {
        u.waypoints = [
          new THREE.Vector3(0, 0, 14.0),
          new THREE.Vector3(queueTarget.x, 0, Math.max(5.0, queueTarget.z + 1.2)),
          queueTarget
        ];
      } else {
        u.waypoints = [queueTarget];
      }
      u.targetRotY = Math.PI; // Face north towards cashier counter
    } else if (cust.status === 'ORDERING') {
      u.isSeated = false;
      let orderTarget;
      if (this.decoupledMode && cust.channel !== 'dine_in') {
        orderTarget = new THREE.Vector3(2.0, 0, 2.7);
      } else {
        orderTarget = new THREE.Vector3(-2.0, 0, 2.7);
      }
      u.waypoints = [orderTarget];
      u.targetRotY = Math.PI; // Facing Cashier POS
    } else if (cust.status === 'WAITING_FOOD') {
      // Customer has placed order, now waits for food
      u.isSeated = false;

      if (cust.channel === 'delivery_courier' || cust.channel === 'takeout') {
        // Try to occupy a waiting chair if free
        const wSeat = this.assignWaitingSeat(cust.id);
        if (wSeat) {
          u.assignedWaitingSeatIdx = wSeat.index;
          u.waypoints = [
            new THREE.Vector3(-4.0, 0, 3.5),
            new THREE.Vector3(wSeat.pos.x, 0, wSeat.pos.z)
          ];
          u.targetRotY = wSeat.rotY; // Face hallway
          u.isSeated = true;
        } else {
          // Wait standing near the order staging window
          const offset = (parseInt(cust.id.replace('C', ''), 10) % 3) * 0.8;
          u.waypoints = [new THREE.Vector3(-3.5 - offset, 0, 3.2)];
          u.targetRotY = Math.PI;
        }
      } else {
        // Dine-In waiting for tray before seating
        u.waypoints = [new THREE.Vector3(-3.5, 0, 2.6)];
        u.targetRotY = Math.PI;
      }
    } else if (cust.status === 'SEATED_EATING') {
      // Patrons seated at their assigned dining room table
      this.releaseWaitingSeat(cust.id);

      const tblId = cust.assigned_table_id || 1;
      u.assignedTableId = tblId;

      // Assign a specific physical chair at that table
      const seatInfo = this.assignChairAtTable(tblId, cust.id);
      if (seatInfo) {
        u.assignedSeatSlot = seatInfo.slotId;
        const chairTarget = seatInfo.pos;

        // Path navigation avoiding walls
        if (tblId <= 6) {
          // Left Dining Room: Walk through doorway at X = -6.5, Z = 2.5
          u.waypoints = [
            new THREE.Vector3(-3.0, 0, 3.0),
            new THREE.Vector3(-6.5, 0, 2.5),             // Pass through Left Room doorway
            new THREE.Vector3(chairTarget.x, 0, 2.5),    // Enter Left Room aisle
            chairTarget                                  // Reach chair
          ];
        } else {
          // Right Dining Hall: Walk into east circulation aisle at X = 6.0
          u.waypoints = [
            new THREE.Vector3(3.0, 0, 3.0),
            new THREE.Vector3(6.0, 0, 3.0),              // Enter Right Hall aisle
            new THREE.Vector3(6.0, 0, chairTarget.z),    // Walk to table row
            chairTarget                                  // Reach chair
          ];
        }
        u.targetRotY = seatInfo.rotY; // Face table center
        u.isSeated = true;
      }
    } else if (cust.status === 'COMPLETED') {
      // Finished meal / picked up food -> Stand up and leave via aisles through front exit
      if (u.assignedTableId) {
        this.releaseChairAtTable(u.assignedTableId, cust.id);
      }
      this.releaseWaitingSeat(cust.id);
      u.isSeated = false;

      // Waypoints routing out through the appropriate door/aisle
      if (u.assignedTableId && u.assignedTableId <= 6) {
        // Leaving from Left Dining Room
        const tblMesh = this.tableMeshes[u.assignedTableId - 1];
        const tx = tblMesh ? tblMesh.position.x : -11.0;
        u.waypoints = [
          new THREE.Vector3(tx, 0, 2.5),
          new THREE.Vector3(-6.5, 0, 2.5), // Exit Left Room doorway
          new THREE.Vector3(0, 0, 3.5),    // Central hallway
          new THREE.Vector3(0, 0, 14.0),   // Front entrance
          new THREE.Vector3(0, 0, 24.0)    // Sidewalk outside
        ];
      } else if (u.assignedTableId && u.assignedTableId > 6) {
        // Leaving from Right Dining Hall
        const tblMesh = this.tableMeshes[u.assignedTableId - 1];
        const tz = tblMesh ? tblMesh.position.z : 0.0;
        u.waypoints = [
          new THREE.Vector3(6.0, 0, tz),  // Into Right Hall aisle
          new THREE.Vector3(6.0, 0, 3.5), // Aisle south
          new THREE.Vector3(0, 0, 3.5),   // Central hallway
          new THREE.Vector3(0, 0, 14.0),  // Front entrance
          new THREE.Vector3(0, 0, 24.0)   // Sidewalk outside
        ];
      } else {
        // Leaving from counter / pickup area
        u.waypoints = [
          new THREE.Vector3(0, 0, 3.5),
          new THREE.Vector3(0, 0, 14.0),
          new THREE.Vector3(0, 0, 24.0)
        ];
      }
    }
  }

  removeCustomer(custId) {
    const mesh = this.customerMeshes.get(custId);
    if (mesh) {
      if (mesh.userData.assignedTableId) {
        this.releaseChairAtTable(mesh.userData.assignedTableId, custId);
      }
      this.releaseWaitingSeat(custId);
      this.scene.remove(mesh);
      this.customerMeshes.delete(custId);
    }
  }

  clearAllCustomers() {
    this.tableMeshes.forEach(tbl => {
      if (tbl.userData.seats) {
        tbl.userData.seats.forEach(s => s.occupantId = null);
      }
      tbl.userData.isOccupied = false;
    });
    this.waitingSeats.forEach(ws => ws.occupantId = null);

    this.customerMeshes.forEach(mesh => this.scene.remove(mesh));
    this.customerMeshes.clear();
  }

  setScenarioVisuals(scenarioKey) {
    this.activeScenario = scenarioKey;
    if (scenarioKey === 'scenario_a' || scenarioKey === 'combined') {
      this.decoupledMode = true;
      if (this.counter2Sign) this.counter2Sign.visible = true;
      if (this.cashier2) this.cashier2.visible = true;
    } else {
      this.decoupledMode = false;
      if (this.counter2Sign) this.counter2Sign.visible = false;
      if (this.cashier2) this.cashier2.visible = false;
    }

    if (scenarioKey === 'scenario_b' || scenarioKey === 'combined') {
      this.expediterActive = true;
      if (this.expediterMesh) this.expediterMesh.visible = true;
    } else {
      this.expediterActive = false;
      if (this.expediterMesh) this.expediterMesh.visible = false;
    }

    if (scenarioKey === 'scenario_c' || scenarioKey === 'combined') {
      this.dynamicStaffActive = true;
      if (this.assemblyStaff) this.assemblyStaff.visible = true;
    } else {
      this.dynamicStaffActive = false;
      if (this.assemblyStaff) this.assemblyStaff.visible = false;
    }
  }

  setSimTime(timeMin) {
    this.currentSimTime = timeMin;
  }

  setCameraView(presetName) {
    const preset = this.cameraPresets[presetName];
    if (preset) {
      this.activePreset = presetName;
      this.targetCamPos.set(...preset.pos);
      this.targetCamLookAt.set(...preset.target);
    }
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smooth Camera Movement
    this.camera.position.lerp(this.targetCamPos, 0.06);
    this.controls.target.lerp(this.targetCamLookAt, 0.06);
    this.controls.update();

    // 2. Dynamic Staffing Worker Animation (Scenario C / Combined)
    if (this.assemblyStaff && this.assemblyStaff.visible) {
      const u = this.assemblyStaff.userData;
      u.workPhase = (u.workPhase || 0) + delta * 3.5;

      const isPeakRush = this.currentSimTime >= 30.0 && this.currentSimTime <= 90.0;
      if (isPeakRush) {
        // Staff dynamically moves between 3 kitchen stations:
        // Station 0: Grill pick-up station [0.0, 0, -5.2]
        // Station 1: Assembly prep table [1.5, 0, -1.2]
        // Station 2: Front staging window [-1.5, 0, 0.5]
        const cycle = (elapsedTime * 0.35) % 3.0;
        let targetStation, faceRot;
        if (cycle < 1.0) {
          targetStation = new THREE.Vector3(0.0, 0, -5.2);
          faceRot = Math.PI; // Face north towards grill
        } else if (cycle < 2.0) {
          targetStation = new THREE.Vector3(1.5, 0, -1.2);
          faceRot = Math.PI; // Face north towards prep table
        } else {
          targetStation = new THREE.Vector3(-1.5, 0, 0.5);
          faceRot = 0; // Face south towards front window
        }

        const dist = this.assemblyStaff.position.distanceTo(targetStation);
        if (dist > 0.15) {
          // Walking to next station
          const moveSpeed = 3.5 * delta;
          const dir = new THREE.Vector3().subVectors(targetStation, this.assemblyStaff.position).normalize();
          this.assemblyStaff.position.addScaledVector(dir, Math.min(moveSpeed, dist));
          this.assemblyStaff.rotation.y = Math.atan2(dir.x, dir.z);

          // Leg & arm walking swing
          u.walkPhase = (u.walkPhase || 0) + delta * 12.0;
          if (u.leftLeg && u.rightLeg) {
            u.leftLeg.rotation.x = Math.sin(u.walkPhase) * 0.45;
            u.rightLeg.rotation.x = -Math.sin(u.walkPhase) * 0.45;
          }
          if (u.leftArm && u.rightArm) {
            u.leftArm.rotation.x = -Math.sin(u.walkPhase) * 0.4;
            u.rightArm.rotation.x = Math.sin(u.walkPhase) * 0.4;
          }
        } else {
          // Stationary at station doing work
          this.assemblyStaff.rotation.y = faceRot;
          if (u.leftLeg && u.rightLeg) {
            u.leftLeg.rotation.x = 0;
            u.rightLeg.rotation.x = 0;
          }
          if (u.leftArm && u.rightArm) {
            u.leftArm.rotation.x = Math.sin(u.workPhase) * 0.45 - 0.4;
            u.rightArm.rotation.x = Math.cos(u.workPhase) * 0.45 - 0.4;
          }
        }
      } else {
        // Off-peak: In back prep area prepping marinade & skewers
        const restStation = new THREE.Vector3(2.5, 0, -5.5);
        this.assemblyStaff.position.lerp(restStation, 0.05);
        this.assemblyStaff.rotation.y = Math.PI;
        if (u.leftLeg && u.rightLeg) {
          u.leftLeg.rotation.x = 0;
          u.rightLeg.rotation.x = 0;
        }
        if (u.leftArm && u.rightArm) {
          u.leftArm.rotation.x = Math.sin(u.workPhase * 0.5) * 0.2 - 0.2;
          u.rightArm.rotation.x = Math.cos(u.workPhase * 0.5) * 0.2 - 0.2;
        }
      }
    }

    // 3. Floating Expediter Animation (Scenario B / Combined)
    if (this.expediterMesh && this.expediterMesh.visible) {
      const u = this.expediterMesh.userData;
      u.workPhase = (u.workPhase || 0) + delta * 2.5;

      // Rove along the customer queue from Z = 4.0 to Z = 10.0
      const targetZ = 4.0 + (Math.sin(elapsedTime * 0.35) * 0.5 + 0.5) * 6.0;
      const targetPos = new THREE.Vector3(-0.9, 0, targetZ);
      const dist = this.expediterMesh.position.distanceTo(targetPos);

      if (dist > 0.1) {
        const moveSpeed = 2.0 * delta;
        const dir = new THREE.Vector3().subVectors(targetPos, this.expediterMesh.position).normalize();
        this.expediterMesh.position.addScaledVector(dir, Math.min(moveSpeed, dist));
        this.expediterMesh.rotation.y = Math.atan2(dir.x, dir.z);

        u.walkPhase = (u.walkPhase || 0) + delta * 10.0;
        if (u.leftLeg && u.rightLeg) {
          u.leftLeg.rotation.x = Math.sin(u.walkPhase) * 0.35;
          u.rightLeg.rotation.x = -Math.sin(u.walkPhase) * 0.35;
        }
      } else {
        this.expediterMesh.rotation.y = -Math.PI / 2; // Face queue
        if (u.leftLeg && u.rightLeg) {
          u.leftLeg.rotation.x = 0;
          u.rightLeg.rotation.x = 0;
        }
      }
      // Clipboard writing arm motion
      if (u.leftArm && u.rightArm) {
        u.leftArm.rotation.x = -0.6 + Math.sin(u.workPhase) * 0.1;
        u.rightArm.rotation.x = -0.8 + Math.cos(u.workPhase * 2.0) * 0.15;
      }
    }

    // 4. Grill Master Animation (Continuous Charcoal Grilling)
    if (this.grillMaster) {
      const u = this.grillMaster.userData;
      u.workPhase = (u.workPhase || 0) + delta * 2.0;
      // Periodic turn between charcoal grill (north) and skewers rack (east)
      this.grillMaster.rotation.y = Math.PI + Math.sin(elapsedTime * 0.5) * 0.35;
      if (u.leftArm && u.rightArm) {
        u.leftArm.rotation.x = -0.5 + Math.sin(u.workPhase * 1.5) * 0.3;
        u.rightArm.rotation.x = -0.6 + Math.cos(u.workPhase * 1.5) * 0.35;
      }
    }

    // 5. Cashier 1 & Cashier 2 POS Typing motions
    if (this.cashier1 && this.cashier1.userData.leftArm) {
      this.cashier1.userData.leftArm.rotation.x = -0.5 + Math.sin(elapsedTime * 4.0) * 0.1;
      this.cashier1.userData.rightArm.rotation.x = -0.5 + Math.cos(elapsedTime * 4.0) * 0.1;
    }
    if (this.cashier2 && this.cashier2.visible && this.cashier2.userData.leftArm) {
      this.cashier2.userData.leftArm.rotation.x = -0.5 + Math.sin(elapsedTime * 3.5 + 1) * 0.1;
      this.cashier2.userData.rightArm.rotation.x = -0.5 + Math.cos(elapsedTime * 3.5 + 1) * 0.1;
    }

    // 6. Customer Waypoint Movement, Posture, and Leg Walking Animation
    this.customerMeshes.forEach((mesh, custId) => {
      const u = mesh.userData;
      if (!u) return;

      if (u.waypoints && u.waypoints.length > 0) {
        const nextWaypoint = u.waypoints[0];
        const dist = mesh.position.distanceTo(nextWaypoint);

        // Move towards waypoint
        if (dist > 0.15) {
          const moveSpeed = 4.5 * delta;
          const dir = new THREE.Vector3().subVectors(nextWaypoint, mesh.position).normalize();
          mesh.position.addScaledVector(dir, Math.min(moveSpeed, dist));

          // Rotate facing movement direction
          const angle = Math.atan2(dir.x, dir.z);
          mesh.rotation.y = angle;

          // Leg swing animation while walking
          u.walkPhase += delta * 12.0;
          if (u.leftLeg && u.rightLeg) {
            u.leftLeg.rotation.x = Math.sin(u.walkPhase) * 0.45;
            u.rightLeg.rotation.x = -Math.sin(u.walkPhase) * 0.45;
          }
          mesh.position.y = 0.0; // Standing height
        } else {
          // Reached current waypoint
          u.waypoints.shift();

          if (u.waypoints.length === 0) {
            // Reached final target
            if (u.isSeated) {
              // Sit down posture: lower Y by 0.25 to rest on chair cushion
              mesh.position.y = -0.25;
              mesh.rotation.y = u.targetRotY;
              if (u.leftLeg && u.rightLeg) {
                u.leftLeg.rotation.x = -Math.PI / 3.5; // Legs forward in chair
                u.rightLeg.rotation.x = -Math.PI / 3.5;
              }
            } else {
              mesh.position.y = 0.0;
              mesh.rotation.y = u.targetRotY;
              if (u.leftLeg && u.rightLeg) {
                u.leftLeg.rotation.x = 0;
                u.rightLeg.rotation.x = 0;
              }
            }

            // If completed departure walk to sidewalk, remove entity
            if (u.status === 'COMPLETED' || u.status === 'BALKED') {
              if (mesh.position.z >= 21.0) {
                this.removeCustomer(custId);
              }
            }
          }
        }
      }
    });

    // 7. Smoke particles rise and recycle
    if (this.smokeParticles) {
      const positions = this.smokeParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * 0.85;
        if (positions[i] > 4.8) {
          positions[i] = 1.4;
        }
      }
      this.smokeParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Restaurant3DScene = Restaurant3DScene;
