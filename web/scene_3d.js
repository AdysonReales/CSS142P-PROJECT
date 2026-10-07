/**
 * Carlo's Bacolod Chicken House Express (CHE) Makati - 3D Digital Twin Visualizer
 * Procedural Three.js 3D environment: Inasal Charcoal Grill Pit, Smoke Particles,
 * Order Counters, Savana Dining Hall, and Multi-Channel Customer Entities.
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
    this.tableMeshes = [];           // array of table groups
    this.smokeParticles = null;
    this.ceilingFans = [];

    // Camera preset targets
    this.cameraPresets = {
      isometric: { pos: [22, 28, 28], target: [0, 0, 0] },
      counter: { pos: [-2, 10, 16], target: [-4, 2, 2] },
      grill: { pos: [-16, 8, -6], target: [-10, 2, -10] },
      dining: { pos: [14, 12, 14], target: [8, 1, 0] },
      street: { pos: [-6, 6, 26], target: [-6, 1, 10] },
    };

    this.activePreset = 'isometric';
    this.targetCamPos = new THREE.Vector3(22, 28, 28);
    this.targetCamLookAt = new THREE.Vector3(0, 0, 0);

    // Scenario visual flags
    this.decoupledMode = false;
    this.expediterActive = false;
    this.counter2Sign = null;
    this.expediterMesh = null;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0e12);
    this.scene.fog = new THREE.FogExp2(0x0c0e12, 0.015);

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 200);
    this.camera.position.set(22, 28, 28);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.1; // Prevent going beneath floor
    this.controls.minDistance = 5;
    this.controls.maxDistance = 65;
    this.controls.target.set(0, 0, 0);

    // 5. Lighting
    this.setupLighting();

    // 6. Build Architectural Environment
    this.buildSavanaMarketFloor();
    this.buildInasalGrillStation();
    this.buildOrderCounters();
    this.buildDiningHall();
    this.buildCorridorAndStanchions();
    this.buildSmokeParticleSystem();

    // 7. Event listeners
    window.addEventListener('resize', () => this.onWindowResize());

    // 8. Animation loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    // Ambient light with warm undertone
    const ambient = new THREE.AmbientLight(0x282c35, 1.2);
    this.scene.add(ambient);

    // Primary warm spotlight over counters
    const counterSpot = new THREE.SpotLight(0xffecd2, 1.8, 30, Math.PI / 4, 0.3, 1);
    counterSpot.position.set(-4, 14, 4);
    counterSpot.target.position.set(-4, 0, 2);
    counterSpot.castShadow = true;
    counterSpot.shadow.mapSize.width = 1024;
    counterSpot.shadow.mapSize.height = 1024;
    this.scene.add(counterSpot);
    this.scene.add(counterSpot.target);

    // Glowing ember light at the Inasal Grill Pit
    this.grillLight = new THREE.PointLight(0xff5500, 2.5, 12, 1.5);
    this.grillLight.position.set(-10, 2.8, -10);
    this.scene.add(this.grillLight);

    // Soft dining area pendant lights
    const diningLight1 = new THREE.PointLight(0xffddaa, 1.4, 20);
    diningLight1.position.set(6, 8, 4);
    this.scene.add(diningLight1);

    const diningLight2 = new THREE.PointLight(0xffddaa, 1.4, 20);
    diningLight2.position.set(12, 8, -4);
    this.scene.add(diningLight2);

    // Directional moon/street light from corridor
    const streetDir = new THREE.DirectionalLight(0x88aacc, 0.8);
    streetDir.position.set(-15, 15, 25);
    streetDir.target.position.set(-5, 0, 10);
    this.scene.add(streetDir);
  }

  buildSavanaMarketFloor() {
    // Main Restaurant Tile Floor (Dark terracotta slate)
    const floorGeo = new THREE.PlaneGeometry(36, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Savana Corridor / Walkway section (Lighter stone tiles)
    const corridorGeo = new THREE.PlaneGeometry(12, 32);
    const corridorMat = new THREE.MeshStandardMaterial({
      color: 0x242831,
      roughness: 0.7,
      metalness: 0.05,
    });
    const corridor = new THREE.Mesh(corridorGeo, corridorMat);
    corridor.rotation.x = -Math.PI / 2;
    corridor.position.set(-12, 0.01, 0);
    corridor.receiveShadow = true;
    this.scene.add(corridor);

    // Congestion Balking Threshold Line across corridor
    const lineGeo = new THREE.PlaneGeometry(10, 0.25);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const balkLine = new THREE.Mesh(lineGeo, lineMat);
    balkLine.rotation.x = -Math.PI / 2;
    balkLine.position.set(-10, 0.02, 16);
    this.scene.add(balkLine);

    // Low perimeter wall / curb
    const curbGeo = new THREE.BoxGeometry(0.3, 0.4, 32);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x333a46 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(-18, 0.2, 0);
    this.scene.add(curb);

    // Overhead Banner Signage: Carlo's Bacolod Chicken House Express
    this.buildOverheadSign();
  }

  buildOverheadSign() {
    const signGroup = new THREE.Group();
    // Metal truss
    const frameGeo = new THREE.BoxGeometry(14, 1.2, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(-4, 7.5, 3);
    signGroup.add(frame);

    // Sign Face
    const faceGeo = new THREE.BoxGeometry(13.6, 1.0, 0.22);
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0x92400e,
      emissiveIntensity: 0.35,
      roughness: 0.4
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(-4, 7.5, 3.02);
    signGroup.add(face);

    this.scene.add(signGroup);
  }

  buildInasalGrillStation() {
    const grillGroup = new THREE.Group();
    grillGroup.position.set(-10, 0, -10);

    // 1. Dark Firebrick Hearth
    const hearthGeo = new THREE.BoxGeometry(6, 1.4, 3.5);
    const hearthMat = new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.95 });
    const hearth = new THREE.Mesh(hearthGeo, hearthMat);
    hearth.position.set(0, 0.7, 0);
    hearth.castShadow = true;
    hearth.receiveShadow = true;
    grillGroup.add(hearth);

    // 2. Charcoal Pit Bed (Glowing Orange Embers)
    const emberGeo = new THREE.BoxGeometry(5.4, 0.2, 2.9);
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      emissive: 0xf97316,
      emissiveIntensity: 0.9,
      roughness: 0.9,
    });
    this.emberMesh = new THREE.Mesh(emberGeo, emberMat);
    this.emberMesh.position.set(0, 1.35, 0);
    grillGroup.add(this.emberMesh);

    // 3. Stainless Steel Wire Grill Grate
    const grateGeo = new THREE.BoxGeometry(5.5, 0.05, 3.0);
    const grateMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.3,
      wireframe: true,
    });
    const grate = new THREE.Mesh(grateGeo, grateMat);
    grate.position.set(0, 1.5, 0);
    grillGroup.add(grate);

    // 4. Skewers of Chicken Inasal (Pecho & Paa)
    const skewerGroup = new THREE.Group();
    const chickenGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.9, 8);
    const chickenMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Rich annatto chicken oil glaze
      roughness: 0.5,
    });
    const bambooGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6);
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8 });

    for (let i = -2; i <= 2; i += 0.8) {
      for (let j = -0.8; j <= 0.8; j += 0.8) {
        const chickenPiece = new THREE.Mesh(chickenGeo, chickenMat);
        chickenPiece.rotation.z = Math.PI / 2;
        chickenPiece.position.set(i, 1.62, j);
        chickenPiece.castShadow = true;
        skewerGroup.add(chickenPiece);

        const stick = new THREE.Mesh(bambooGeo, bambooMat);
        stick.rotation.z = Math.PI / 2;
        stick.position.set(i, 1.62, j);
        skewerGroup.add(stick);
      }
    }
    grillGroup.add(skewerGroup);

    // 5. Commercial Exhaust Hood & Chimney
    const hoodGeo = new THREE.CylinderGeometry(1.2, 3.2, 2.0, 4);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.7,
      roughness: 0.4,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 4.2, 0);
    hood.rotation.y = Math.PI / 4;
    grillGroup.add(hood);

    // Duct pipe to ceiling
    const ductGeo = new THREE.CylinderGeometry(0.6, 0.6, 3.5, 16);
    const duct = new THREE.Mesh(ductGeo, hoodMat);
    duct.position.set(0, 6.5, 0);
    grillGroup.add(duct);

    // 6. Grill Master Staff Entity
    const grillMaster = this.createStaffModel(0xffffff, true); // White apron
    grillMaster.position.set(0, 0, 2.2);
    grillMaster.rotation.y = Math.PI;
    grillGroup.add(grillMaster);

    this.scene.add(grillGroup);
  }

  buildOrderCounters() {
    const counterGroup = new THREE.Group();

    // Main Wooden Bar Counter
    const barGeo = new THREE.BoxGeometry(10, 1.8, 1.6);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.6 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(-4, 0.9, 2);
    bar.castShadow = true;
    bar.receiveShadow = true;
    counterGroup.add(bar);

    // Stainless Counter Top Surface
    const topGeo = new THREE.BoxGeometry(10.2, 0.1, 1.8);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(-4, 1.85, 2);
    counterGroup.add(top);

    // Acrylic Sneeze Guard Partition
    const guardGeo = new THREE.BoxGeometry(9.6, 1.0, 0.05);
    const guardMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.9,
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.set(-4, 2.4, 2.5);
    counterGroup.add(guard);

    // Register POS 1 (Dine-in / Shared)
    const pos1 = this.createPOSStation("POS 1");
    pos1.position.set(-6.5, 1.9, 2.1);
    counterGroup.add(pos1);

    // Register POS 2 (Express / Decoupled Counter)
    const pos2 = this.createPOSStation("POS 2");
    pos2.position.set(-1.5, 1.9, 2.1);
    counterGroup.add(pos2);

    // Counter Signage for Decoupling
    const signGeo = new THREE.BoxGeometry(2.5, 0.5, 0.1);
    const signMat1 = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const sign1 = new THREE.Mesh(signGeo, signMat1);
    sign1.position.set(-6.5, 3.2, 2.1);
    counterGroup.add(sign1);

    const signMat2 = new THREE.MeshBasicMaterial({ color: 0x00b14f });
    this.counter2Sign = new THREE.Mesh(signGeo, signMat2);
    this.counter2Sign.position.set(-1.5, 3.2, 2.1);
    this.counter2Sign.visible = false; // Enabled in Scenario A
    counterGroup.add(this.counter2Sign);

    // Cashier 1 Staff
    const cashier1 = this.createStaffModel(0xe11d48, false); // CHE Red apron
    cashier1.position.set(-6.5, 0, 0.8);
    counterGroup.add(cashier1);

    // Cashier 2 Staff (Express / Decoupled)
    this.cashier2 = this.createStaffModel(0x00b14f, false);
    this.cashier2.position.set(-1.5, 0, 0.8);
    this.cashier2.visible = false;
    counterGroup.add(this.cashier2);

    // Order Staging Shelf (Fulfillment & Takeout bags)
    const shelfGeo = new THREE.BoxGeometry(3.5, 1.6, 1.2);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(-9.5, 0.8, -1.5);
    counterGroup.add(shelf);

    // Takeout Paper Bags on shelf
    const bagGeo = new THREE.BoxGeometry(0.5, 0.65, 0.35);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 });
    for (let k = -1.2; k <= 1.2; k += 0.6) {
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(-9.5 + k, 1.95, -1.5);
      counterGroup.add(bag);
    }

    // Assembly Staff Member (Scenario C dynamic peak flex)
    this.assemblyStaff = this.createStaffModel(0x38bdf8, false);
    this.assemblyStaff.position.set(-9.5, 0, -2.6);
    counterGroup.add(this.assemblyStaff);

    // Floating Expediter (Scenario B)
    this.expediterMesh = this.createStaffModel(0xeab308, false);
    this.expediterMesh.position.set(-5, 0, 8);
    this.expediterMesh.visible = false;
    this.scene.add(this.expediterMesh);

    this.scene.add(counterGroup);
  }

  createPOSStation(label) {
    const posGroup = new THREE.Group();
    // Screen base
    const baseGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 12);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.15, 0);
    posGroup.add(base);

    // Monitor screen tilted
    const screenGeo = new THREE.BoxGeometry(0.7, 0.5, 0.08);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.45, 0.05);
    screen.rotation.x = -Math.PI / 8;
    posGroup.add(screen);

    // Cash drawer underneath
    const drawerGeo = new THREE.BoxGeometry(0.9, 0.18, 0.8);
    const drawer = new THREE.Mesh(drawerGeo, baseMat);
    drawer.position.set(0, 0.05, 0);
    posGroup.add(drawer);

    return posGroup;
  }

  createStaffModel(apronColor, hasHat = false) {
    const staff = new THREE.Group();

    // Body / Polo Shirt (Dark slate)
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.32, 1.2, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.6, 0);
    staff.add(body);

    // Apron (Front plate)
    const apronGeo = new THREE.BoxGeometry(0.48, 1.0, 0.1);
    const apronMat = new THREE.MeshStandardMaterial({ color: apronColor });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(0, 1.5, 0.32);
    staff.add(apron);

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 2.4, 0);
    staff.add(head);

    // Visor or Chef Cap
    if (hasHat) {
      const hatGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.3, 16);
      const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.set(0, 2.7, 0);
      staff.add(hat);
    } else {
      const visorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16);
      const visorMat = new THREE.MeshStandardMaterial({ color: apronColor });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 2.6, 0);
      staff.add(visor);
    }

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.16, 0.5, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.16, 0.5, 0);
    staff.add(leftLeg);
    staff.add(rightLeg);

    staff.castShadow = true;
    return staff;
  }

  buildDiningHall() {
    // 14 Dining Tables arranged in 4 rows in Savana Market dining zone
    const tablePositions = [
      // Row 1
      { x: 4, z: 8 }, { x: 9, z: 8 }, { x: 14, z: 8 },
      // Row 2
      { x: 4, z: 3 }, { x: 9, z: 3 }, { x: 14, z: 3 },
      // Row 3
      { x: 4, z: -2 }, { x: 9, z: -2 }, { x: 14, z: -2 },
      // Row 4
      { x: 4, z: -7 }, { x: 9, z: -7 }, { x: 14, z: -7 },
      // Side tables
      { x: 4, z: -12 }, { x: 9, z: -12 }
    ];

    tablePositions.forEach((pos, idx) => {
      const tableGroup = this.createDiningTable(idx + 1);
      tableGroup.position.set(pos.x, 0, pos.z);
      this.tableMeshes.push(tableGroup);
      this.scene.add(tableGroup);
    });

    // Ceiling fans above dining tables
    [ { x: 6, z: 5 }, { x: 12, z: 0 }, { x: 6, z: -6 } ].forEach(fanPos => {
      const fan = this.createCeilingFan();
      fan.position.set(fanPos.x, 6.2, fanPos.z);
      this.ceilingFans.push(fan);
      this.scene.add(fan);
    });
  }

  createDiningTable(tableNum) {
    const group = new THREE.Group();
    group.userData = { tableId: tableNum, isOccupied: false };

    // Wooden tabletop (Solid Acacia style)
    const topGeo = new THREE.BoxGeometry(2.6, 0.12, 1.8);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 1.4, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // 4 Sturdy Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
    [[-1.1, -0.7], [1.1, -0.7], [-1.1, 0.7], [1.1, 0.7]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.7, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    // 4 Wooden Chairs / Stools around table
    [[-1.5, 0, Math.PI / 2], [1.5, 0, -Math.PI / 2], [0, -1.2, 0], [0, 1.2, Math.PI]].forEach(([cx, cz, rotY]) => {
      const chair = this.createChair();
      chair.position.set(cx, 0, cz);
      chair.rotation.y = rotY;
      group.add(chair);
    });

    // Tabletop Bacolod Condiment Caddy: Chicken Oil (Amber) + Sinamak Vinegar (White/clear)
    const caddy = this.createCondimentCaddy();
    caddy.position.set(0, 1.46, 0);
    group.add(caddy);

    return group;
  }

  createChair() {
    const chair = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(0.7, 0.08, 0.7);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x58240c, roughness: 0.7 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.8, 0);
    chair.add(seat);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, 0.4, z);
      chair.add(leg);
    });

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.7, 0.7, 0.06);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(0, 1.2, -0.32);
    chair.add(back);

    return chair;
  }

  createCondimentCaddy() {
    const caddy = new THREE.Group();
    // Tray
    const trayGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.05, 12);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    caddy.add(tray);

    // Chicken Oil Cruet (Golden amber)
    const oilGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 8);
    const oilMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2
    });
    const oilBottle = new THREE.Mesh(oilGeo, oilMat);
    oilBottle.position.set(-0.1, 0.2, 0);
    caddy.add(oilBottle);

    // Sinamak Spiced Vinegar bottle (Light tinted glass)
    const vinegarGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.38, 8);
    const vinMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1
    });
    const vinegarBottle = new THREE.Mesh(vinegarGeo, vinMat);
    vinegarBottle.position.set(0.1, 0.22, 0);
    caddy.add(vinegarBottle);

    return caddy;
  }

  createCeilingFan() {
    const fan = new THREE.Group();
    const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x111 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(0, 0.75, 0);
    fan.add(rod);

    const motorGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12);
    const motor = new THREE.Mesh(motorGeo, rodMat);
    fan.add(motor);

    const bladesGroup = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(1.6, 0.02, 0.25);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.y = (b * Math.PI) / 2;
      blade.position.set(Math.cos(blade.rotation.y) * 0.9, 0, Math.sin(blade.rotation.y) * 0.9);
      bladesGroup.add(blade);
    }
    fan.add(bladesGroup);
    fan.userData = { blades: bladesGroup };
    return fan;
  }

  buildCorridorAndStanchions() {
    // Retractable belt stanchions directing the single shared queue or split queue
    const stanchionPositions = [
      { x: -5.5, z: 4.5 },
      { x: -5.5, z: 8.5 },
      { x: -5.5, z: 12.5 },
      { x: -7.5, z: 4.5 },
      { x: -7.5, z: 8.5 },
      { x: -7.5, z: 12.5 },
    ];

    stanchionPositions.forEach(pos => {
      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pos.x, 0.8, pos.z);

      const baseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);
      const base = new THREE.Mesh(baseGeo, postMat);
      base.position.set(pos.x, 0.04, pos.z);

      this.scene.add(post);
      this.scene.add(base);
    });

    // Connecting belt ribbon
    const beltGeo = new THREE.BoxGeometry(0.02, 0.08, 8.0);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(-5.5, 1.4, 8.5);
    this.scene.add(belt);
  }

  buildSmokeParticleSystem() {
    // Rising BBQ Smoke particles above charcoal pit
    const particleCount = 180;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let p = 0; p < particleCount; p++) {
      positions[p * 3] = -10 + (Math.random() - 0.5) * 4.0;
      positions[p * 3 + 1] = 1.6 + Math.random() * 3.5;
      positions[p * 3 + 2] = -10 + (Math.random() - 0.5) * 2.2;
      scales[p] = Math.random() * 0.4 + 0.1;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const pMat = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.4,
      transparent: true,
      opacity: 0.25,
      blending: THREE.NormalBlending,
    });

    this.smokeParticles = new THREE.Points(geom, pMat);
    this.scene.add(this.smokeParticles);
  }

  // ==========================================================================
  // Dynamic 3D Human Entity Creation (Customers & Couriers)
  // ==========================================================================

  createCustomerEntity(cust) {
    const group = new THREE.Group();
    group.userData = {
      id: cust.id,
      channel: cust.channel,
      courierBrand: cust.courier_brand,
      status: cust.status,
      targetPos: new THREE.Vector3(),
      isMoving: false,
    };

    let shirtColor = 0x3b82f6; // Dine-in default (Blue)
    let hasBackpack = false;
    let backpackColor = 0x000000;
    let hasHelmet = false;

    if (cust.channel === 'delivery_courier') {
      hasBackpack = true;
      hasHelmet = true;
      if (cust.courier_brand === 'GrabFood') {
        shirtColor = 0x00b14f;    // Grab emerald
        backpackColor = 0x00b14f;
      } else {
        shirtColor = 0xd60665;    // Foodpanda magenta
        backpackColor = 0xd60665;
      }
    } else if (cust.channel === 'takeout') {
      shirtColor = 0xf97316; // Takeout orange
    }

    // 1. Torso
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.28, 1.1, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.5, 0);
    body.castShadow = true;
    group.add(body);

    // 2. Head or Helmet
    const headGeo = new THREE.SphereGeometry(0.26, 16, 16);
    if (hasHelmet) {
      const helmetMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.6, roughness: 0.2 });
      const helmet = new THREE.Mesh(headGeo, helmetMat);
      helmet.position.set(0, 2.3, 0);

      // Visor
      const visorGeo = new THREE.BoxGeometry(0.35, 0.14, 0.2);
      const visorMat = new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.9, roughness: 0.1 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 2.3, 0.18);
      helmet.add(visor);
      group.add(helmet);
    } else {
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.8 });
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.set(0, 2.3, 0);
      group.add(head);
    }

    // 3. Courier Thermal Backpack Box (GrabFood / Foodpanda)
    if (hasBackpack) {
      const boxGeo = new THREE.BoxGeometry(0.7, 0.8, 0.6);
      const boxMat = new THREE.MeshStandardMaterial({ color: backpackColor, roughness: 0.5 });
      const backpack = new THREE.Mesh(boxGeo, boxMat);
      backpack.position.set(0, 1.6, -0.45);
      backpack.castShadow = true;
      group.add(backpack);
    }

    // 4. Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.95, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.14, 0.48, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.14, 0.48, 0);
    group.add(leftLeg);
    group.add(rightLeg);
    group.userData.leftLeg = leftLeg;
    group.userData.rightLeg = rightLeg;

    // 5. Overhead Channel Badge Pin
    const pinGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const pinMat = new THREE.MeshBasicMaterial({ color: shirtColor });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(0, 2.8, 0);
    group.add(pin);

    // Initial position at Savana Market entrance
    group.position.set(-12, 0, 24);
    this.scene.add(group);
    this.customerMeshes.set(cust.id, group);

    return group;
  }

  updateCustomerPosition(cust, queueSlotIndex = 0) {
    let mesh = this.customerMeshes.get(cust.id);
    if (!mesh) {
      mesh = this.createCustomerEntity(cust);
    }

    const target = new THREE.Vector3();

    if (cust.status === 'BALKED') {
      // Turned around and exiting Savana corridor
      target.set(-14, 0, 26);
    } else if (cust.status === 'QUEUING_ORDER') {
      // Line up in queue lane
      if (this.decoupledMode && cust.channel !== 'dine_in') {
        // Express queue at Counter 2 (Right lane)
        target.set(-1.5, 0, 4.0 + queueSlotIndex * 1.4);
      } else {
        // Shared or Dine-in queue at Counter 1 (Left lane)
        target.set(-6.5, 0, 4.0 + queueSlotIndex * 1.4);
      }
    } else if (cust.status === 'ORDERING') {
      // At the counter
      if (this.decoupledMode && cust.channel !== 'dine_in') {
        target.set(-1.5, 0, 3.2);
      } else {
        target.set(-6.5, 0, 3.2);
      }
    } else if (cust.status === 'WAITING_FOOD') {
      // Waiting by the staging pickup area
      target.set(-9.5, 0, 1.5 + (parseInt(cust.id.replace('C','')) % 5) * 0.9);
    } else if (cust.status === 'SEATED_EATING') {
      // Seated at assigned dining table
      const tblId = cust.assigned_table_id || 1;
      const tblMesh = this.tableMeshes[tblId - 1];
      if (tblMesh) {
        target.copy(tblMesh.position);
        target.y = 0.2; // Sit lower
      } else {
        target.set(6, 0, 4);
      }
    } else if (cust.status === 'COMPLETED') {
      // Exiting through Savana corridor
      target.set(-12, 0, 26);
    }

    mesh.userData.targetPos.copy(target);
  }

  removeCustomer(custId) {
    const mesh = this.customerMeshes.get(custId);
    if (mesh) {
      this.scene.remove(mesh);
      this.customerMeshes.delete(custId);
    }
  }

  clearAllCustomers() {
    this.customerMeshes.forEach(mesh => this.scene.remove(mesh));
    this.customerMeshes.clear();
  }

  // ==========================================================================
  // Scenario Layout Transitions
  // ==========================================================================

  setScenarioVisuals(scenarioKey) {
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
      if (this.assemblyStaff) this.assemblyStaff.visible = true;
    }
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

    // 1. Smooth Camera Interpolation
    this.camera.position.lerp(this.targetCamPos, 0.05);
    this.controls.target.lerp(this.targetCamLookAt, 0.05);
    this.controls.update();

    // 2. BBQ Smoke particle animation
    if (this.smokeParticles) {
      const positions = this.smokeParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * 1.8; // Drift up
        if (positions[i] > 5.5) {
          positions[i] = 1.6; // Reset at grill grate
        }
      }
      this.smokeParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Pulse Charcoal Embers
    if (this.emberMesh) {
      const pulse = 0.75 + 0.25 * Math.sin(elapsedTime * 4.0);
      this.emberMesh.material.emissiveIntensity = pulse;
      if (this.grillLight) this.grillLight.intensity = 2.0 + 0.8 * pulse;
    }

    // 4. Rotate Ceiling Fans
    this.ceilingFans.forEach(fan => {
      if (fan.userData.blades) {
        fan.userData.blades.rotation.y += delta * 3.5;
      }
    });

    // 5. Customer Entity Movement Interpolation
    this.customerMeshes.forEach((mesh, id) => {
      const target = mesh.userData.targetPos;
      const dist = mesh.position.distanceTo(target);

      if (dist > 0.1) {
        mesh.position.lerp(target, 0.08);

        // Turn towards travel direction
        const dir = new THREE.Vector3().subVectors(target, mesh.position).normalize();
        if (dir.lengthSq() > 0.001) {
          const angle = Math.atan2(dir.x, dir.z);
          mesh.rotation.y = angle;
        }

        // Bobbing leg walk animation
        if (mesh.userData.leftLeg && mesh.userData.rightLeg) {
          mesh.userData.leftLeg.rotation.x = Math.sin(elapsedTime * 12) * 0.4;
          mesh.userData.rightLeg.rotation.x = -Math.sin(elapsedTime * 12) * 0.4;
        }
      } else {
        if (mesh.userData.leftLeg && mesh.userData.rightLeg) {
          mesh.userData.leftLeg.rotation.x = 0;
          mesh.userData.rightLeg.rotation.x = 0;
        }
      }
    });

    // 6. Floating Expediter roaming patrol animation
    if (this.expediterMesh && this.expediterActive) {
      const patrolZ = 7.0 + Math.sin(elapsedTime * 1.5) * 3.0;
      this.expediterMesh.position.z = patrolZ;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Restaurant3DScene = Restaurant3DScene;
