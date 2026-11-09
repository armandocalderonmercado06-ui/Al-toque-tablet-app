(() => {
  'use strict';

  const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let threeLoad;

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeLoad) return threeLoad;

    threeLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = THREE_CDN;
      script.async = true;
      script.onload = () => window.THREE
        ? resolve(window.THREE)
        : reject(new Error('Three.js se cargó sin crear su objeto global.'));
      script.onerror = () => reject(new Error('No se pudo cargar Three.js.'));
      document.head.append(script);
    });
    return threeLoad;
  }

  function createWoodTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    let seed = 814729;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    context.fillStyle = '#ed791f';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 8; row += 1) {
      const top = row * 64;
      context.fillStyle = row % 2 ? '#f28b29' : '#ed8422';
      context.fillRect(0, top, canvas.width, 64);
      for (let grain = 0; grain < 19; grain += 1) {
        const y = top + 3 + random() * 58;
        const bend = (random() - 0.5) * 5;
        const tone = random();
        context.strokeStyle = tone < 0.55 ? '#ffd06b' : tone < 0.82 ? '#d96920' : '#f6a23c';
        context.globalAlpha = 0.12 + random() * 0.2;
        context.lineWidth = 0.45 + random() * 1.1;
        context.beginPath();
        context.moveTo(-2, y + (random() - 0.5) * 2);
        context.bezierCurveTo(250, y + bend, 700, y - bend, canvas.width + 2, y + (random() - 0.5) * 2);
        context.stroke();
      }
      const joints = [420, 140, 820, 770, 525, 700, 410, 245];
      const x = joints[row];
      context.globalAlpha = 0.72;
      context.strokeStyle = '#a64e27';
      context.lineWidth = 2.8;
      context.beginPath();
      context.moveTo(x + (random() - 0.5), top + 1);
      context.lineTo(x + (random() - 0.5), top + 63);
      context.stroke();
      context.globalAlpha = 0.38;
      context.strokeStyle = '#ffd06b';
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(x + 2, top + 1);
      context.lineTo(x + 2, top + 63);
      context.stroke();
      context.globalAlpha = 0.52;
      context.fillStyle = '#a9552a';
      context.fillRect(0, top + 62, canvas.width, 1.5);
      context.globalAlpha = 0.38;
      context.fillStyle = '#ffd06b';
      context.fillRect(0, top + 61, canvas.width, 0.8);
    }
    context.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.anisotropy = 8;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function createWoodBumpTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    let seed = 814733;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    context.fillStyle = '#808080';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 8; row += 1) {
      const top = row * 64;
      for (let grain = 0; grain < 24; grain += 1) {
        const y = top + 2 + random() * 60;
        const bend = (random() - 0.5) * 4;
        const shade = Math.round(112 + random() * 48);
        context.strokeStyle = `rgb(${shade},${shade},${shade})`;
        context.globalAlpha = 0.25 + random() * 0.4;
        context.lineWidth = 0.45 + random() * 1.1;
        context.beginPath();
        context.moveTo(-2, y + (random() - 0.5) * 2);
        context.bezierCurveTo(250, y + bend, 700, y - bend, canvas.width + 2, y + (random() - 0.5) * 2);
        context.stroke();
      }
      const x = [420, 140, 820, 770, 525, 700, 410, 245][row];
      context.globalAlpha = 0.8;
      context.strokeStyle = '#666666';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x, top + 1);
      context.lineTo(x, top + 63);
      context.stroke();
    }
    context.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  function createFloorWoodTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    let seed = 629417;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const plankHeight = canvas.height / 8;
    const plankColors = ['#fff1d2', '#fdf0d0', '#faedcc', '#fff3d8'];
    for (let row = 0; row < 8; row += 1) {
      const top = row * plankHeight;
      context.fillStyle = plankColors[row % plankColors.length];
      context.fillRect(0, top, canvas.width, plankHeight);

      for (let grain = 0; grain < 24; grain += 1) {
        const y = top + 5 + random() * (plankHeight - 10);
        const bend = (random() - 0.5) * 5;
        context.globalAlpha = 0.035 + random() * 0.035;
        context.strokeStyle = random() < 0.6 ? '#b99561' : '#ffffff';
        context.lineWidth = 0.6 + random() * 1.2;
        context.beginPath();
        context.moveTo(0, y);
        context.bezierCurveTo(300, y + bend, 700, y - bend, canvas.width, y + (random() - 0.5) * 3);
        context.stroke();
      }

      const jointX = (row % 2 ? 0.68 : 0.32) * canvas.width;
      context.globalAlpha = 0.14;
      context.strokeStyle = '#c9ad7e';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(jointX, top + 2);
      context.lineTo(jointX + (random() - 0.5) * 4, top + plankHeight - 2);
      context.stroke();

      context.globalAlpha = 0.13;
      context.fillStyle = '#c9ad7e';
      context.fillRect(0, top + plankHeight - 1.5, canvas.width, 1.5);
      context.globalAlpha = 0.12;
      context.fillStyle = '#ffffff';
      context.fillRect(0, top + plankHeight - 2.5, canvas.width, 1);
    }
    context.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.anisotropy = 8;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function createPlasticBump(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#808080';
    context.fillRect(0, 0, canvas.width, canvas.height);
    let seed = 924731;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 9000; i += 1) {
      const value = Math.round(100 + random() * 60);
      context.fillStyle = `rgb(${value},${value},${value})`;
      context.fillRect(random() * 256, random() * 256, 1 + random() * 1.5, 1 + random() * 1.5);
    }
    context.strokeStyle = 'rgba(220,220,220,0.42)';
    context.lineWidth = 0.7;
    for (let i = 0; i < 64; i += 1) {
      const x = random() * 256;
      const y = random() * 256;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + (random() - 0.5) * 48, y + (random() - 0.5) * 8);
      context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
  }

  function createPlasticTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#111113';
    context.fillRect(0, 0, 256, 256);
    let seed = 217381;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 11000; i += 1) {
      const shade = Math.round(18 + random() * 18);
      context.fillStyle = `rgb(${shade},${shade},${shade + 1})`;
      context.fillRect(random() * 256, random() * 256, 1 + random() * 1.3, 1 + random() * 1.3);
    }
    context.strokeStyle = 'rgba(86,86,88,0.24)';
    context.lineWidth = 0.8;
    for (let i = 0; i < 86; i += 1) {
      const x = random() * 256;
      const y = random() * 256;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 12 + random() * 36, y + (random() - 0.5) * 2);
      context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1.5);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function createRackBackTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#171819';
    context.fillRect(0, 0, canvas.width, canvas.height);
    let seed = 583921;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 36000; i += 1) {
      const shade = Math.round(20 + random() * 12);
      context.fillStyle = `rgb(${shade},${shade},${shade})`;
      context.fillRect(random() * 1024, random() * 256, 1, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function createRackBackBumpTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#808080';
    context.fillRect(0, 0, canvas.width, canvas.height);
    let seed = 583927;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let row = 0; row < 256; row += 1) {
      const shade = Math.round(112 + random() * 32);
      context.strokeStyle = `rgb(${shade},${shade},${shade})`;
      context.lineWidth = 0.6 + random() * 0.8;
      context.beginPath();
      context.moveTo(0, row + random() * 0.6);
      context.bezierCurveTo(320, row - 0.6 + random() * 1.2, 700, row - 0.6 + random() * 1.2, canvas.width, row + random() * 0.6);
      context.stroke();
    }
    for (let i = 0; i < 18000; i += 1) {
      const shade = Math.round(104 + random() * 48);
      context.fillStyle = `rgb(${shade},${shade},${shade})`;
      context.fillRect(random() * 1024, random() * 256, 1 + random(), 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  function makeTileTexture(THREE, tile, cache) {
    const key = tile.joker ? 'joker' : `${tile.color}:${tile.value}`;
    if (cache.has(key)) return cache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 352;
    const context = canvas.getContext('2d');
    const colors = {
      red: '#d52e32',
      blue: '#1e63b4',
      yellow: '#d08a08',
      black: '#292b30'
    };
    context.fillStyle = '#fffdf5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#e5dcc9';
    context.lineWidth = 7;
    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    context.fillStyle = tile.joker ? '#8b45b2' : (colors[tile.color] || '#292b30');
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '900 178px system-ui, sans-serif';
    context.fillText(tile.joker ? '★' : String(tile.value), 128, 173);
    if (tile.joker) {
      context.font = '700 32px system-ui, sans-serif';
      context.fillText('JOKER', 128, 286);
    } else {
      context.fillStyle = '#292b30';
      context.beginPath();
      context.arc(128, 294, 7, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    cache.set(key, texture);
    return texture;
  }

  function disposeTree(root) {
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.dispose();
      });
    });
  }

  function createRack({ element }) {
    return loadThree().then((THREE) => {
      const scene = new THREE.Scene();
      scene.background = null;
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
      camera.position.set(0, 8, 3.5);
      camera.lookAt(0, 0.16, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputEncoding = THREE.sRGBEncoding;
      element.prepend(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x8795a8, 1.45));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
      keyLight.position.set(-4, 8, 6);
      scene.add(keyLight);

      const rackWidth = 11.7;
      const rack = new THREE.Group();
      rack.position.x = -1.3;
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(rackWidth, 0.2, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x292a2d, roughness: 0.62 })
      );
      base.position.set(0, 0.1, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      rack.add(base);

      const surface = new THREE.Mesh(
        new THREE.BoxGeometry(rackWidth - 0.28, 0.04, 1.22),
        new THREE.MeshStandardMaterial({ color: 0x4a4b4f, roughness: 0.8 })
      );
      surface.position.set(0, 0.22, -0.02);
      rack.add(surface);

      const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.55 });
      const edges = [
        [rackWidth - 0.28, 0.18, 0.12, 0, 0.31, 0.69],
        [rackWidth - 0.28, 0.08, 0.1, 0, 0.28, -0.69],
        [0.1, 0.08, 1.26, -(rackWidth - 0.28) / 2, 0.28, -0.02],
        [0.1, 0.08, 1.26, (rackWidth - 0.28) / 2, 0.28, -0.02]
      ];
      edges.forEach(([width, height, depth, x, y, z]) => {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), edgeMaterial);
        edge.position.set(x, y, z);
        edge.castShadow = true;
        rack.add(edge);
      });
      scene.add(rack);

      function resize() {
        const width = Math.max(1, element.clientWidth);
        const height = Math.max(1, element.clientHeight);
        const aspect = width / height;
        const viewHeight = 1.6;
        camera.left = -viewHeight * aspect / 2;
        camera.right = viewHeight * aspect / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
      }

      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
      if (observer) observer.observe(element);
      else window.addEventListener('resize', resize);
      element.classList.add('has-3d-support');
      resize();

      return {
        dispose() {
          if (observer) observer.disconnect();
          else window.removeEventListener('resize', resize);
          disposeTree(rack);
          scene.remove(rack);
          renderer.dispose();
          renderer.domElement.remove();
          element.classList.remove('has-3d-support');
        }
      };
    });
  }

  function createTable({ element, onSelect, onDrop, onReturn, controls }) {
    return loadThree().then((THREE) => {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xe8d8c3);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      element.replaceChildren(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1a0e, 0.75));
      const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.1);
      keyLight.position.set(5, 20, 8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -14;
      keyLight.shadow.camera.right = 14;
      keyLight.shadow.camera.top = 14;
      keyLight.shadow.camera.bottom = -14;
      keyLight.shadow.camera.far = 60;
      keyLight.shadow.bias = -0.0003;
      scene.add(keyLight);
      const warmLight = new THREE.PointLight(0xffc477, 0.6, 30);
      warmLight.position.set(0, 7, 0);
      scene.add(warmLight);

      const room = new THREE.Group();
      const wallPaper = new THREE.MeshStandardMaterial({ color: 0xf2e5d2, roughness: 0.96, side: THREE.DoubleSide });
      const woodFrame = new THREE.MeshStandardMaterial({ color: 0x8c5838, roughness: 0.78 });
      const woodTrim = new THREE.MeshStandardMaterial({ color: 0xb07c54, roughness: 0.74 });
      const windowPaper = new THREE.MeshStandardMaterial({ color: 0xfff0d7, roughness: 0.98, side: THREE.DoubleSide });
      const roomFloorY = -4.6;
      const roomHalfExtent = 45;
      const roomEdge = roomHalfExtent - 0.2;
      const roomSize = roomHalfExtent * 2;
      const wallTopY = 16;
      const wallHeight = wallTopY - roomFloorY;
      const addRoomPart = (geometry, material, x, y, z) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        room.add(mesh);
        return mesh;
      };
      const addBackBeam = (x, y, width, height, depth = 0.34, material = woodFrame) =>
        addRoomPart(new THREE.BoxGeometry(width, height, depth), material, x, y, -roomEdge);
      const addFrontBeam = (x, y, width, height, depth = 0.34, material = woodFrame) =>
        addRoomPart(new THREE.BoxGeometry(width, height, depth), material, x, y, roomEdge);
      const addSideBeam = (side, z, y, width, height, depth = 0.34, material = woodFrame) =>
        addRoomPart(new THREE.BoxGeometry(depth, height, width), material, side * roomEdge, y, z);

      addRoomPart(
        new THREE.BoxGeometry(roomSize, wallHeight, 0.4),
        wallPaper,
        0,
        roomFloorY + wallHeight / 2,
        -roomHalfExtent
      );
      addRoomPart(
        new THREE.BoxGeometry(0.4, wallHeight, roomSize),
        wallPaper,
        -roomHalfExtent,
        roomFloorY + wallHeight / 2,
        0
      );
      addRoomPart(
        new THREE.BoxGeometry(0.4, wallHeight, roomSize),
        wallPaper,
        roomHalfExtent,
        roomFloorY + wallHeight / 2,
        0
      );

      for (const x of [-roomEdge, -40, -30, -20, -10, 0, 10, 20, 30, 40, roomEdge]) {
        addBackBeam(x, roomFloorY + wallHeight / 2, 0.28, wallHeight, 0.5);
      }
      for (const y of [roomFloorY + 0.18, 0.1, 7.6, wallTopY - 0.18]) {
        addBackBeam(0, y, roomSize, y === 0.1 ? 0.38 : 0.24, 0.5, woodTrim);
      }

      addRoomPart(
        new THREE.BoxGeometry(roomSize, wallHeight, 0.4),
        wallPaper,
        0,
        roomFloorY + wallHeight / 2,
        roomHalfExtent
      );
      for (const x of [-roomEdge, -40, -30, -20, -10, 0, 10, 20, 30, 40, roomEdge]) {
        addFrontBeam(x, roomFloorY + wallHeight / 2, 0.28, wallHeight, 0.5);
      }
      for (const y of [roomFloorY + 0.18, 0.1, 7.6, wallTopY - 0.18]) {
        addFrontBeam(0, y, roomSize, y === 0.1 ? 0.38 : 0.24, 0.5, woodTrim);
      }

      for (const side of [-1, 1]) {
        for (const z of [-roomEdge, -40, -30, -20, -10, 0, 10, 20, 30, 40, roomEdge]) {
          addSideBeam(side, z, roomFloorY + wallHeight / 2, 0.28, wallHeight, 0.5);
        }
        for (const y of [roomFloorY + 0.18, 0.1, 7.6, wallTopY - 0.18]) {
          addSideBeam(side, 0, y, roomSize, y === 0.1 ? 0.38 : 0.24, 0.5, woodTrim);
        }

        const windowCenterZ = -2;
        const windowWidth = 19;
        const windowBottom = -1.2;
        const windowTop = 11;
        const windowHeight = windowTop - windowBottom;
        addRoomPart(
          new THREE.BoxGeometry(0.12, windowHeight, windowWidth),
          windowPaper,
          side * (roomHalfExtent - 0.35),
          windowBottom + windowHeight / 2,
          windowCenterZ
        );
        for (const z of [windowCenterZ - windowWidth / 2, windowCenterZ + windowWidth / 2]) {
          addSideBeam(side, z, (windowBottom + windowTop) / 2, 0.2, windowHeight, 0.72, woodFrame);
        }
        for (let index = 1; index < 8; index += 1) {
          addSideBeam(side, windowCenterZ - windowWidth / 2 + index * windowWidth / 8,
            (windowBottom + windowTop) / 2, 0.1, windowHeight, 0.74, woodTrim);
        }
        for (let index = 1; index < 7; index += 1) {
          const y = windowBottom + index * windowHeight / 7;
          addSideBeam(side, windowCenterZ, y, windowWidth, 0.1, 0.74, woodTrim);
        }
        for (const y of [windowBottom, windowTop]) {
          addSideBeam(side, windowCenterZ, y, windowWidth + 0.3, 0.22, 0.76, woodFrame);
        }
      }
      scene.add(room);

      const woodTexture = createWoodTexture(THREE);
      const woodBumpTexture = createWoodBumpTexture(THREE);
      const woodTop = new THREE.MeshStandardMaterial({
        map: woodTexture,
        bumpMap: woodBumpTexture,
        bumpScale: 0.018,
        roughness: 0.38,
        metalness: 0.05
      });
      const woodSide = new THREE.MeshStandardMaterial({ color: 0x5b3010, roughness: 0.6 });
      const table = new THREE.Group();
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(19, 0.5, 15),
        [woodSide, woodSide, woodTop, woodSide, woodSide, woodSide]
      );
      top.position.y = -0.25;
      top.receiveShadow = true;
      table.add(top);

      const apronMaterial = new THREE.MeshStandardMaterial({ color: 0x4a260c, roughness: 0.55 });
      for (const z of [-6.75, 6.75]) {
        const apron = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.5, 0.3), apronMaterial);
        apron.position.set(0, -0.75, z);
        apron.castShadow = true;
        table.add(apron);
      }
      for (const x of [-8.75, 8.75]) {
        const apron = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 12.8), apronMaterial);
        apron.position.set(x, -0.75, 0);
        apron.castShadow = true;
        table.add(apron);
      }

      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4a260c, roughness: 0.55 });
      for (const x of [-8.4, 8.4]) {
        for (const z of [-6.5, 6.5]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.34, 4.1, 28), legMaterial);
          leg.position.set(x, -2.55, z);
          leg.castShadow = true;
          leg.receiveShadow = true;
          table.add(leg);
          const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.28, 28), legMaterial);
          collar.position.set(x, -0.64, z);
          collar.castShadow = true;
          collar.receiveShadow = true;
          table.add(collar);
          const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 28), legMaterial);
          foot.position.set(x, -4.53, z);
          foot.castShadow = true;
          foot.receiveShadow = true;
          table.add(foot);
        }
      }

      function createRoundedTileGeometry(width, height, depth) {
        const radius = 0.045;
        const bevelSize = 0.008;
        const bevelThickness = 0.012;
        const shape = new THREE.Shape();
        const left = -width / 2 + bevelSize;
        const right = width / 2 - bevelSize;
        const bottom = -height / 2 + bevelSize;
        const top = height / 2 - bevelSize;
        const corner = radius - bevelSize;
        shape.moveTo(left + corner, bottom);
        shape.lineTo(right - corner, bottom);
        shape.quadraticCurveTo(right, bottom, right, bottom + corner);
        shape.lineTo(right, top - corner);
        shape.quadraticCurveTo(right, top, right - corner, top);
        shape.lineTo(left + corner, top);
        shape.quadraticCurveTo(left, top, left, top - corner);
        shape.lineTo(left, bottom + corner);
        shape.quadraticCurveTo(left, bottom, left + corner, bottom);
        return new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness,
          bevelSize,
          bevelSegments: 3,
          curveSegments: 8
        });
      }

      const drawPilePositions = {
        0: new THREE.Vector3(7.4, 0.12, 5.3),
        1: new THREE.Vector3(-7.4, 0.12, -5.3),
        2: new THREE.Vector3(-7.4, 0.12, 5.3),
        3: new THREE.Vector3(7.4, 0.12, -5.3)
      };
      const drawPileSide = new THREE.MeshStandardMaterial({ color: 0xe7dfca, roughness: 0.5 });
      const drawPileFace = new THREE.MeshStandardMaterial({ color: 0xfffdf5, roughness: 0.5 });
      for (const pilePosition of Object.values(drawPilePositions)) {
        for (let index = 0; index < 5; index += 1) {
          const pileTile = new THREE.Mesh(createRoundedTileGeometry(0.48, 0.66, 0.1), drawPileSide);
          pileTile.geometry.rotateX(-Math.PI / 2);
          pileTile.position.set(pilePosition.x, 0.01 + index * 0.08, pilePosition.z);
          pileTile.rotation.y = index % 2 ? 0.035 : -0.035;
          pileTile.castShadow = true;
          table.add(pileTile);
          const face = new THREE.Mesh(new THREE.PlaneGeometry(0.39, 0.54), drawPileFace);
          face.rotation.x = -Math.PI / 2;
          face.position.set(pilePosition.x, 0.111 + index * 0.08, pilePosition.z);
          face.rotation.y = pileTile.rotation.y;
          table.add(face);
        }
      }

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomEdge * 2, roomEdge * 2),
        new THREE.MeshStandardMaterial({
          map: createFloorWoodTexture(THREE),
          color: 0xfff5df,
          roughness: 0.92
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -4.6;
      floor.receiveShadow = false;
      table.add(floor);
      scene.add(table);

      const dynamicPieces = new THREE.Group();
      scene.add(dynamicPieces);
      const tileTextures = new Map();
      const plasticBump = createPlasticBump(THREE);
      const plasticTexture = createPlasticTexture(THREE);
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const target = new THREE.Vector3(0, 1.5, -0.8);
      let theta = 0;
      let phi = 1.04;
      let radius = 23.8;
      let viewScale = 1;
      let userZoomed = false;
      let dragging = null;
      let handDragging = null;
      let disposed = false;
      let currentView = 'player';
      const clickableTiles = [];
      const rackHandTiles = [];
      let playerRackDropTarget = null;
      const botRackAnchors = new Map();
      let previousBotRackAnchors = new Map();
      const boardTileMeshes = new Map();
      const botActors = [];
      let activeBotSeat = null;
      let botAnimationFrame = 0;
      let cancelActiveBotFlight = null;
      let pointerCanHandleTiles = false;
      let cursorHandMode = 'open';
      let cursorHandBaseY = 0.27;
      let cursorFingerAnchor = null;
      let heldHandTile = null;
      let cursorHandAnimationFrame = 0;

      const cursorHand = new THREE.Group();
      const cursorSkin = new THREE.MeshStandardMaterial({ color: 0x985139, roughness: 0.72 });
      const cursorSkinLight = new THREE.MeshStandardMaterial({ color: 0xc77a50, roughness: 0.72 });
      const cursorDigits = [];
      const cursorThumb = new THREE.Group();
      const cursorHandPalm = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), cursorSkin);
      cursorHandPalm.scale.set(0.36, 0.115, 0.43);
      cursorHandPalm.position.set(0, 0, 0.02);
      cursorHand.add(cursorHandPalm);

      const addCursorSegment = (parent, length, radius, depth, material, z) => {
        const segment = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), material);
        segment.scale.set(radius, depth, length / 2);
        segment.position.z = z - length / 2;
        parent.add(segment);
        return segment;
      };

      [-0.25, -0.09, 0.09, 0.25].forEach((x, index) => {
        const digit = new THREE.Group();
        digit.position.set(x, 0.015, -0.34);
        const lengths = [0.44, 0.56, 0.62, 0.52];
        const length = lengths[index];
        const width = index === 2 ? 0.066 : 0.06;
        addCursorSegment(digit, length * 0.5, width, 0.068, cursorSkinLight, 0);
        addCursorSegment(digit, length * 0.33, width * 0.88, 0.061, cursorSkin, -length * 0.43);
        addCursorSegment(digit, length * 0.31, width * 0.82, 0.058, cursorSkinLight, -length * 0.72);
        digit.userData.index = index;
        cursorDigits.push(digit);
        cursorHand.add(digit);
      });

      cursorThumb.position.set(0.29, 0.005, 0.09);
      addCursorSegment(cursorThumb, 0.25, 0.085, 0.078, cursorSkinLight, -0.05);
      addCursorSegment(cursorThumb, 0.2, 0.072, 0.067, cursorSkin, -0.23);
      cursorHand.add(cursorThumb);
      const wrist = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), cursorSkin);
      wrist.scale.set(0.25, 0.095, 0.29);
      wrist.position.set(0, -0.005, 0.38);
      cursorHand.add(wrist);
      cursorHand.scale.setScalar(1.9);
      cursorHand.visible = false;
      cursorHand.traverse((part) => {
        if (part.isMesh) {
          part.castShadow = true;
          part.receiveShadow = true;
          part.renderOrder = 20;
          const materials = Array.isArray(part.material) ? part.material : [part.material];
          materials.forEach((material) => {
            material.depthTest = false;
            material.depthWrite = false;
            material.needsUpdate = true;
          });
        }
      });
      scene.add(cursorHand);

      function animateCursorHand() {
        cursorHandAnimationFrame = 0;
        if (disposed || !cursorHand.visible) return;
        const gripping = cursorHandMode === 'grabbing';
        const pointing = cursorHandMode === 'pointing';
        const time = performance.now() * 0.001;
        cursorDigits.forEach((digit) => {
          const index = digit.userData.index;
          const curled = gripping || (pointing && index !== 2);
          const flex = curled ? -0.62 - index * 0.025 : 0;
          const spread = pointing
            ? (index === 2 ? 0.04 : (index - 1.5) * 0.12)
            : (index - 1.5) * 0.075;
          digit.rotation.x += (flex - digit.rotation.x) * 0.2;
          digit.rotation.z += (spread - digit.rotation.z) * 0.2;
        });
        const thumbPose = gripping ? -0.95 : pointing ? -0.35 : -0.2 + Math.sin(time * 2.4) * 0.025;
        cursorThumb.rotation.y += (thumbPose - cursorThumb.rotation.y) * 0.22;
        cursorThumb.rotation.z += ((gripping ? -0.4 : pointing ? -0.25 : -0.55) - cursorThumb.rotation.z) * 0.2;
        const bob = gripping ? 0 : Math.sin(time * 3) * 0.012;
        if (cursorFingerAnchor && !gripping) {
          positionCursorHandAtFinger(cursorFingerAnchor);
        } else {
          cursorHand.position.y = cursorHandBaseY + bob;
        }
        positionHeldTile();
        draw();
        cursorHandAnimationFrame = requestAnimationFrame(animateCursorHand);
      }

      function setCursorHandMode(mode) {
        cursorHandMode = mode;
        if (cursorHand.visible && !cursorHandAnimationFrame) {
          cursorHandAnimationFrame = requestAnimationFrame(animateCursorHand);
        }
      }

      function draw() {
        if (!disposed) renderer.render(scene, camera);
      }

      function updateCamera() {
        camera.position.set(
          target.x + radius * Math.sin(phi) * Math.sin(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(target);
        draw();
      }

      function fitRadius() {
        const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const horizontal = 27 / (2 * Math.tan(halfFov) * Math.max(camera.aspect, 0.65));
        const vertical = 21 / (2 * Math.tan(halfFov));
        return Math.max(horizontal, vertical, 22);
      }

      function resize() {
        if (disposed) return;
        const width = Math.max(1, element.clientWidth);
        const height = Math.max(1, element.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        if (!userZoomed) {
          if (currentView === 'player') {
            radius = fitRadius() * 1.08;
            phi = 1.05;
          } else {
            radius = fitRadius() * viewScale;
          }
        }
        updateCamera();
      }

      function view(name) {
        currentView = name;
        const boardPanel = element.closest('.board-panel');
        if (boardPanel) boardPanel.dataset.boardView = name;
        userZoomed = false;
        viewScale = 1;
        if (name === 'top') {
          target.set(0, 0, 0);
          theta = 0;
          phi = 0.07;
          viewScale = 1;
        } else if (name === 'side') {
          target.set(0, 0.5, -3);
          theta = -1.25;
          phi = Math.PI / 2 - 0.45;
          viewScale = 0.78;
        } else if (name === 'rival') {
          target.set(0, 3.6, -8.7);
          theta = 0.34;
          phi = 1.17;
          viewScale = 0.48;
        } else {
          target.set(0, 0.5, 1.3);
          theta = 0;
          radius = fitRadius() * 1.08;
          phi = 1.05;
          viewScale = 1;
        }
        if (name !== 'player') radius = fitRadius() * viewScale;
        rackHandTiles.forEach((tile) => { tile.visible = name !== 'top'; });
        updateCamera();
      }

      function clearPieces() {
        if (botAnimationFrame) cancelAnimationFrame(botAnimationFrame);
        botAnimationFrame = 0;
        botActors.forEach((actor) => {
          actor.faceTexture.dispose();
          actor.moodIconTexture.dispose();
          actor.toonGradient.dispose();
          actor.crestTexture.dispose();
        });
        while (dynamicPieces.children.length) {
          const child = dynamicPieces.children[0];
          dynamicPieces.remove(child);
          disposeTree(child);
        }
        clickableTiles.length = 0;
        rackHandTiles.length = 0;
        playerRackDropTarget = null;
        botRackAnchors.clear();
        boardTileMeshes.clear();
        botActors.length = 0;
      }

      function paintBotGirlFace(context, mood, blink, look) {
        const width = 1024;
        const height = 512;
        const skin = context.createLinearGradient(0, 0, 0, height);
        skin.addColorStop(0, '#f8d6b2');
        skin.addColorStop(0.55, '#f3c9a0');
        skin.addColorStop(1, '#e8b68a');
        context.fillStyle = skin;
        context.fillRect(0, 0, width, height);

        context.save();
        context.translate(256, 0);
        const centerX = 256;
        const eyeY = 262;
        for (const side of [-1, 1]) {
          const x = centerX + side * 215;
          const glow = context.createRadialGradient(x, eyeY + 40, 10, x, eyeY + 40, 130);
          glow.addColorStop(0, 'rgba(214,140,100,.35)');
          glow.addColorStop(1, 'rgba(214,140,100,0)');
          context.fillStyle = glow;
          context.fillRect(x - 130, eyeY - 100, 260, 260);
        }

        const blush = mood === 'happy' ? 0.55 : mood === 'thinking' ? 0.45 : 0.32;
        for (const side of [-1, 1]) {
          const x = centerX + side * 122;
          const y = eyeY + 84;
          context.fillStyle = `rgba(255,125,125,${blush})`;
          context.beginPath();
          context.ellipse(x, y, 40, 21, 0, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = `rgba(235,110,110,${blush + 0.15})`;
          context.lineWidth = 3;
          context.lineCap = 'round';
          for (let index = -1; index <= 1; index += 1) {
            context.beginPath();
            context.moveTo(x + index * 14 - 6, y + 9);
            context.lineTo(x + index * 14 + 6, y - 9);
            context.stroke();
          }
        }

        const drawEye = (x, side) => {
          const eyeWidth = 50;
          const eyeHeight = 42;
          context.lineCap = 'round';
          context.lineJoin = 'round';
          if (blink || mood === 'happy') {
            context.strokeStyle = '#24130d';
            context.lineWidth = 10;
            context.beginPath();
            if (mood === 'happy') {
              context.arc(x, eyeY + 18, eyeWidth * 0.8, Math.PI * 1.12, Math.PI * 1.88);
            } else {
              context.moveTo(x - eyeWidth, eyeY + 2);
              context.quadraticCurveTo(x, eyeY + 20, x + eyeWidth, eyeY + 2);
            }
            context.stroke();
            context.lineWidth = 8;
            context.beginPath();
            context.moveTo(x + side * eyeWidth, eyeY + (mood === 'happy' ? -4 : 2));
            context.lineTo(x + side * (eyeWidth + 18), eyeY - 12);
            context.stroke();
            return;
          }

          context.fillStyle = '#fffaf3';
          context.beginPath();
          context.ellipse(x, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
          context.fill();
          context.save();
          context.beginPath();
          context.ellipse(x, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
          context.clip();
          const irisX = x + look * 17;
          const irisY = eyeY + 3 + (mood === 'play' ? 6 : mood === 'thinking' ? -5 : mood === 'sad' ? 5 : 0);
          const iris = context.createRadialGradient(irisX, irisY + 6, 5, irisX, irisY, 36);
          iris.addColorStop(0, '#2a150b');
          iris.addColorStop(0.55, '#5c321b');
          iris.addColorStop(1, '#8e5a34');
          context.fillStyle = iris;
          context.beginPath();
          context.ellipse(irisX, irisY, 30, 37, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#0c0504';
          context.beginPath();
          context.ellipse(irisX, irisY, 14, 18, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#ffffff';
          context.beginPath();
          context.ellipse(irisX - 11, irisY - 14, 9, 10, 0, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.ellipse(irisX + 11, irisY + 14, 4.5, 4.5, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = 'rgba(40,16,10,.28)';
          context.fillRect(x - eyeWidth, eyeY - eyeHeight, eyeWidth * 2, eyeHeight * 0.55);
          if (mood === 'sad') {
            context.fillStyle = 'rgba(190,230,255,.55)';
            context.beginPath();
            context.ellipse(x, eyeY + eyeHeight - 6, eyeWidth - 6, 9, 0, 0, Math.PI * 2);
            context.fill();
          }
          context.restore();

          context.strokeStyle = '#24130d';
          context.lineWidth = 12;
          context.beginPath();
          context.ellipse(x, eyeY, eyeWidth, eyeHeight, 0, Math.PI * 1.02, Math.PI * 1.98);
          context.stroke();
          context.lineWidth = 9;
          context.beginPath();
          context.moveTo(x + side * eyeWidth, eyeY - 5);
          context.lineTo(x + side * (eyeWidth + 22), eyeY - 20);
          context.stroke();
          context.lineWidth = 6;
          context.beginPath();
          context.moveTo(x + side * (eyeWidth - 12), eyeY - eyeHeight + 5);
          context.lineTo(x + side * (eyeWidth + 6), eyeY - eyeHeight - 10);
          context.stroke();
          context.lineWidth = 3;
          context.strokeStyle = 'rgba(90,45,30,.6)';
          context.beginPath();
          context.ellipse(x, eyeY, eyeWidth, eyeHeight, 0, Math.PI * 0.12, Math.PI * 0.88);
          context.stroke();
        };
        drawEye(centerX - 82, -1);
        drawEye(centerX + 82, 1);

        const brows = {
          idle: [[0.06, 0], [0.06, 0]],
          thinking: [[0.34, 4], [0.02, -12]],
          play: [[-0.1, 6], [-0.1, 6]],
          happy: [[-0.04, -14], [-0.04, -14]],
          sad: [[0.40, -2], [0.40, -2]]
        }[mood];
        for (const [index, side] of [-1, 1].entries()) {
          context.save();
          context.translate(centerX + side * 84, eyeY - 66 + brows[index][1]);
          context.scale(side, 1);
          context.rotate(brows[index][0]);
          context.strokeStyle = '#2a1812';
          context.lineCap = 'round';
          context.lineWidth = 8;
          context.beginPath();
          context.moveTo(-46, 5);
          context.quadraticCurveTo(-2, -16, 50, 2);
          context.stroke();
          context.lineWidth = 4;
          context.beginPath();
          context.moveTo(-46, 5);
          context.quadraticCurveTo(-2, -16, 50, 2);
          context.stroke();
          context.restore();
        }

        context.strokeStyle = '#c98f66';
        context.lineWidth = 4;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(centerX - 3, eyeY + 56);
        context.lineTo(centerX - 9, eyeY + 76);
        context.lineTo(centerX + 5, eyeY + 78);
        context.stroke();

        const mouthY = eyeY + 116;
        context.strokeStyle = '#b4584c';
        context.lineWidth = 6;
        context.beginPath();
        if (mood === 'happy') {
          context.fillStyle = '#8f2a28';
          context.moveTo(centerX - 34, mouthY - 8);
          context.quadraticCurveTo(centerX, mouthY + 48, centerX + 34, mouthY - 8);
          context.closePath();
          context.fill();
          context.fillStyle = '#f08a8a';
          context.beginPath();
          context.ellipse(centerX, mouthY + 20, 15, 8, 0, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.moveTo(centerX - 34, mouthY - 8);
          context.quadraticCurveTo(centerX, mouthY + 48, centerX + 34, mouthY - 8);
          context.closePath();
          context.stroke();
        } else if (mood === 'sad') {
          context.moveTo(centerX - 26, mouthY + 10);
          context.quadraticCurveTo(centerX - 12, mouthY - 6, centerX, mouthY + 2);
          context.quadraticCurveTo(centerX + 12, mouthY + 10, centerX + 26, mouthY - 2);
          context.stroke();
        } else if (mood === 'thinking') {
          context.moveTo(centerX - 17, mouthY + 4);
          context.quadraticCurveTo(centerX, mouthY - 6, centerX + 17, mouthY + 4);
          context.stroke();
        } else if (mood === 'play') {
          context.moveTo(centerX - 20, mouthY);
          context.quadraticCurveTo(centerX + 2, mouthY + 12, centerX + 22, mouthY - 6);
          context.stroke();
        } else {
          context.moveTo(centerX - 19, mouthY);
          context.quadraticCurveTo(centerX, mouthY + 8, centerX + 19, mouthY);
          context.stroke();
        }

        if (mood === 'sad') {
          context.fillStyle = 'rgba(160,220,255,.85)';
          context.strokeStyle = 'rgba(70,130,190,.9)';
          context.lineWidth = 3;
          const x = centerX - 100;
          const y = eyeY + 64;
          context.beginPath();
          context.moveTo(x, y);
          context.quadraticCurveTo(x - 14, y + 26, x, y + 34);
          context.quadraticCurveTo(x + 14, y + 26, x, y);
          context.fill();
          context.stroke();
        }
        context.restore();
      }

      function paintBotBoyFace(context, mood, blink, look) {
        const width = 1024;
        const height = 512;
        const skin = context.createLinearGradient(0, 0, 0, height);
        skin.addColorStop(0, '#f0b17b');
        skin.addColorStop(0.55, '#eba66c');
        skin.addColorStop(1, '#dd9259');
        context.fillStyle = skin;
        context.fillRect(0, 0, width, height);

        const centerX = 512;
        const eyeY = 262;
        for (const side of [-1, 1]) {
          const x = centerX + side * 215;
          const shadow = context.createRadialGradient(x, eyeY + 40, 10, x, eyeY + 40, 130);
          shadow.addColorStop(0, 'rgba(196,112,62,.45)');
          shadow.addColorStop(1, 'rgba(196,112,62,0)');
          context.fillStyle = shadow;
          context.fillRect(x - 130, eyeY - 100, 260, 260);
        }

        const drawEye = (x, side) => {
          const width = 44;
          const height = 32;
          context.lineCap = 'round';
          context.lineJoin = 'round';
          if (blink || mood === 'happy') {
            context.strokeStyle = '#1a0d0a';
            context.lineWidth = 10;
            context.beginPath();
            if (mood === 'happy') {
              context.arc(x, eyeY + 14, width * 0.78, Math.PI * 1.13, Math.PI * 1.87);
            } else {
              context.moveTo(x - width, eyeY + 2);
              context.quadraticCurveTo(x, eyeY + 16, x + width, eyeY + 2);
            }
            context.stroke();
            return;
          }

          context.fillStyle = '#fbf6ee';
          context.beginPath();
          context.ellipse(x, eyeY, width, height, 0, 0, Math.PI * 2);
          context.fill();
          context.save();
          context.beginPath();
          context.ellipse(x, eyeY, width, height, 0, 0, Math.PI * 2);
          context.clip();
          const irisX = x + look * 15;
          const irisY = eyeY + (mood === 'play' ? 8 : mood === 'thinking' ? -3 : mood === 'sad' ? 4 : 0);
          const iris = context.createRadialGradient(irisX, irisY + 4, 4, irisX, irisY, 31);
          iris.addColorStop(0, '#1d100a');
          iris.addColorStop(0.5, '#3d2213');
          iris.addColorStop(1, '#6e3e20');
          context.fillStyle = iris;
          context.beginPath();
          context.ellipse(irisX, irisY, 26, 31, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#080404';
          context.beginPath();
          context.ellipse(irisX, irisY, 12, 15, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#ffffff';
          context.beginPath();
          context.ellipse(irisX - 9, irisY - 11, 7.5, 8.5, 0, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.ellipse(irisX + 9, irisY + 11, 3.8, 3.8, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = 'rgba(40,16,10,.30)';
          context.fillRect(x - width, eyeY - height, width * 2, height * 0.6);
          context.restore();
          context.strokeStyle = '#1a0d0a';
          context.lineWidth = 10;
          context.beginPath();
          context.ellipse(x, eyeY, width, height, 0, Math.PI * 1.03, Math.PI * 1.97);
          context.stroke();
          context.lineWidth = 8;
          context.beginPath();
          context.moveTo(x + side * width, eyeY - 4);
          context.lineTo(x + side * (width + 16), eyeY - 14);
          context.stroke();
          context.lineWidth = 3;
          context.strokeStyle = 'rgba(120,60,35,.65)';
          context.beginPath();
          context.ellipse(x, eyeY, width, height, 0, Math.PI * 0.1, Math.PI * 0.9);
          context.stroke();
        };
        drawEye(centerX - 78, -1);
        drawEye(centerX + 78, 1);

        const brows = {
          idle: [[-0.12, 0], [-0.12, 0]],
          thinking: [[-0.34, 6], [-0.1, -10]],
          play: [[-0.22, 5], [-0.22, 5]],
          happy: [[0.1, -12], [0.1, -12]],
          sad: [[0.3, -2], [0.3, -2]]
        }[mood];
        for (const [index, side] of [-1, 1].entries()) {
          context.save();
          context.translate(centerX + side * 82, eyeY - 56 + brows[index][1]);
          context.scale(side, 1);
          context.rotate(brows[index][0]);
          context.fillStyle = '#17100d';
          context.beginPath();
          context.moveTo(-50, 5);
          context.quadraticCurveTo(-4, -18, 54, -3);
          context.lineTo(54, 6);
          context.quadraticCurveTo(-2, 0, -50, 17);
          context.closePath();
          context.fill();
          context.restore();
        }

        context.strokeStyle = '#c47a48';
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(centerX - 2, eyeY + 22);
        context.lineTo(centerX - 9, eyeY + 58);
        context.lineTo(centerX + 9, eyeY + 61);
        context.stroke();

        const mouthY = eyeY + 108;
        context.strokeStyle = '#8a3d25';
        context.lineWidth = 7;
        context.beginPath();
        if (mood === 'happy') {
          context.fillStyle = '#7a1f18';
          context.moveTo(centerX - 46, mouthY - 10);
          context.quadraticCurveTo(centerX, mouthY + 56, centerX + 46, mouthY - 10);
          context.closePath();
          context.fill();
          context.fillStyle = '#fbf6ee';
          context.beginPath();
          context.moveTo(centerX - 38, mouthY - 8);
          context.quadraticCurveTo(centerX, mouthY + 8, centerX + 38, mouthY - 8);
          context.lineTo(centerX + 34, mouthY - 2);
          context.quadraticCurveTo(centerX, mouthY + 12, centerX - 34, mouthY - 2);
          context.closePath();
          context.fill();
          context.stroke();
        } else if (mood === 'sad') {
          context.moveTo(centerX - 32, mouthY + 12);
          context.quadraticCurveTo(centerX, mouthY - 14, centerX + 32, mouthY + 12);
          context.stroke();
        } else if (mood === 'thinking') {
          context.moveTo(centerX - 24, mouthY + 4);
          context.quadraticCurveTo(centerX + 2, mouthY + 8, centerX + 26, mouthY - 2);
          context.stroke();
        } else if (mood === 'play') {
          context.moveTo(centerX - 24, mouthY);
          context.quadraticCurveTo(centerX + 6, mouthY + 10, centerX + 28, mouthY - 8);
          context.stroke();
        } else {
          context.moveTo(centerX - 26, mouthY);
          context.quadraticCurveTo(centerX, mouthY + 7, centerX + 26, mouthY);
          context.stroke();
        }
      }

      function createBotFace(feminine = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.offset.x = 0.25;
        let currentFace = '';
        const paint = (expression, blink, look) => {
          const mood = ['thinking', 'play', 'happy', 'sad'].includes(expression) ? expression : 'idle';
          const faceKey = `${mood}|${blink}|${look}`;
          if (currentFace === faceKey) return;
          currentFace = faceKey;
          if (feminine) paintBotGirlFace(context, mood, blink, look);
          else paintBotBoyFace(context, mood, blink, look);
          texture.needsUpdate = true;
        };
        paint('idle', false, 0);
        return { texture, paint };
      }

      function createBotMoodIcon() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false
        }));
        sprite.scale.set(1.15, 1.15, 1);
        sprite.renderOrder = 20;
        sprite.visible = false;
        const paint = (mood) => {
          context.clearRect(0, 0, 128, 128);
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.lineJoin = 'round';
          if (mood === 'thinking' || mood === 'happy') {
            const symbol = mood === 'thinking' ? '?' : '!';
            context.font = '900 108px Georgia, serif';
            context.lineWidth = 16;
            context.strokeStyle = '#15151a';
            context.strokeText(symbol, 64, 70);
            context.fillStyle = mood === 'thinking' ? '#fff' : '#ffc43d';
            context.fillText(symbol, 64, 70);
          } else if (mood === 'sad') {
            context.beginPath();
            context.moveTo(64, 10);
            context.bezierCurveTo(64, 10, 28, 60, 28, 84);
            context.arc(64, 84, 36, Math.PI, 0, true);
            context.bezierCurveTo(100, 60, 64, 10, 64, 10);
            context.closePath();
            const gradient = context.createLinearGradient(30, 20, 100, 120);
            gradient.addColorStop(0, '#e8f7ff');
            gradient.addColorStop(1, '#5cb8ee');
            context.fillStyle = gradient;
            context.fill();
            context.lineWidth = 7;
            context.strokeStyle = '#1b2a3a';
            context.stroke();
            context.fillStyle = 'rgba(255,255,255,.9)';
            context.beginPath();
            context.ellipse(48, 82, 7, 13, 0.3, 0, Math.PI * 2);
            context.fill();
          }
          texture.needsUpdate = true;
          sprite.visible = mood !== 'idle' && mood !== 'play';
        };
        paint('idle');
        return { sprite, texture, paint };
      }

      function addBotAvatar(player, seat) {
        const avatar = new THREE.Group();
        const placement = {
          1: { x: 0, z: -9.25, yaw: 0 },
          2: { x: -10.25, z: 0, yaw: Math.PI / 2 },
          3: { x: 10.25, z: 0, yaw: -Math.PI / 2 }
        }[seat];
        avatar.position.set(placement.x, 0, placement.z);
        avatar.rotation.y = placement.yaw;
        dynamicPieces.add(avatar);

        const gradientCanvas = document.createElement('canvas');
        gradientCanvas.width = 4;
        gradientCanvas.height = 1;
        const gradientContext = gradientCanvas.getContext('2d');
        ['#6e6e6e', '#a9a9a9', '#d6d6d6', '#ffffff'].forEach((color, index) => {
          gradientContext.fillStyle = color;
          gradientContext.fillRect(index, 0, 1, 1);
        });
        const toonGradient = new THREE.CanvasTexture(gradientCanvas);
        toonGradient.minFilter = THREE.NearestFilter;
        toonGradient.magFilter = THREE.NearestFilter;
        toonGradient.generateMipmaps = false;
        const avatarColor = (hex) => new THREE.Color(hex).convertSRGBToLinear();
        const toon = (hex, options = {}) => new THREE.MeshToonMaterial({
          color: avatarColor(hex),
          gradientMap: toonGradient,
          ...options
        });
        const inkMaterial = new THREE.MeshBasicMaterial({ color: 0x0b0508, side: THREE.BackSide });
        const inked = (mesh, scale = 1.04) => {
          const hull = new THREE.Mesh(mesh.geometry, inkMaterial);
          hull.scale.setScalar(scale);
          mesh.add(hull);
          return mesh;
        };
        const character = {
          1: { feminine: false, skin: 0xd9935a, hair: 0x1a1112, hoodie: 0x6b1829, hoodLight: 0x7f2236, hoodDark: 0x4a0f1d, pants: 0x2b2e3b },
          2: { feminine: true, skin: 0xe9b88c, hair: 0x2a1a16, hoodie: 0xe0c15f, hoodLight: 0xf0d57a, hoodDark: 0xb6963a, pants: 0x3a3f55 },
          3: { feminine: true, skin: 0xe9b88c, hair: 0x2a1a16, hoodie: 0x6a8fcf, hoodLight: 0x86a9e2, hoodDark: 0x486aa6, pants: 0x2b2e3b }
        }[seat] || { feminine: false, skin: 0xd9935a, hair: 0x1a1112, hoodie: 0x6b1829, hoodLight: 0x7f2236, hoodDark: 0x4a0f1d, pants: 0x2b2e3b };
        const skin = toon(character.skin);
        const hair = toon(character.hair);
        const hoodie = toon(character.hoodie);
        const hoodLight = toon(character.hoodLight);
        const hoodDark = toon(character.hoodDark);
        const pants = toon(character.pants);
        const shoe = toon(0xe8e4dc);
        const chairWood = toon(0x34200f);
        const cream = toon(0xe9e2d0);
        const outline = toon(0x321720);
        const makePart = (geometry, material, parent, x = 0, y = 0, z = 0) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        const capsuleGeometry = (radius, length, segments = 24) => {
          const points = [];
          for (let index = 0; index <= 8; index += 1) {
            const angle = -Math.PI / 2 + (index / 8) * Math.PI / 2;
            points.push(new THREE.Vector2(
              Math.max(0.0001, radius * Math.cos(angle)),
              -length / 2 + radius * Math.sin(angle)
            ));
          }
          for (let index = 0; index <= 8; index += 1) {
            const angle = (index / 8) * Math.PI / 2;
            points.push(new THREE.Vector2(
              Math.max(0.0001, radius * Math.cos(angle)),
              length / 2 + radius * Math.sin(angle)
            ));
          }
          return new THREE.LatheGeometry(points, segments);
        };

        const placeLimb = (mesh, start, end) => {
          const direction = new THREE.Vector3().subVectors(end, start);
          mesh.position.copy(start).add(end).multiplyScalar(0.5);
          mesh.scale.y = direction.length();
          mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        };

        makePart(new THREE.BoxGeometry(3.55, 0.28, 3.2), chairWood, avatar, 0, -1.25, -0.05);
        makePart(new THREE.BoxGeometry(3.65, 4.3, 0.28), chairWood, avatar, 0, 0.75, -1.62);
        for (const x of [-1.52, 1.52]) {
          for (const z of [-1.38, 1.28]) {
            makePart(new THREE.CylinderGeometry(0.12, 0.16, 2.75, 12), chairWood, avatar, x, -2.72, z);
          }
          const post = makePart(new THREE.CylinderGeometry(0.14, 0.14, 4.5, 14), chairWood, avatar, x, 0.9, -1.62);
          const cap = makePart(new THREE.SphereGeometry(0.2, 16, 12), chairWood, avatar, x, 3.18, -1.62);
          post.castShadow = true;
          cap.castShadow = true;
        }

        const torso = makePart(capsuleGeometry(1.5, 1.2, 30), hoodie, avatar, 0, 1.4, 0);
        torso.scale.set(character.feminine ? 1.3 : 1.38, 1, 0.78);
        inked(torso, 1.035);
        makePart(new THREE.SphereGeometry(0.98, 24, 18), hoodDark, avatar, 0, 0.35, -0.2).scale.set(1.05, 0.7, 0.9);
        for (const side of [-1, 1]) {
          const thigh = makePart(new THREE.SphereGeometry(0.68, 24, 18), pants, avatar, side * 0.62, -0.55, 0.62);
          thigh.scale.set(0.62, 0.5, 1.25);
          inked(thigh, 1.06);
        }
        for (const side of [-1, 1]) {
          const shin = makePart(new THREE.CylinderGeometry(0.29, 0.34, 1.8, 18), pants, avatar, side * 0.7, -1.85, 1.55);
          shin.rotation.x = -0.16;
          inked(shin, 1.09);
          inked(makePart(new THREE.BoxGeometry(0.66, 0.32, 0.92), shoe, avatar, side * 0.7, -2.72, 1.88), 1.06);
          makePart(new THREE.BoxGeometry(0.12, 0.13, 0.09), outline, avatar, side * 0.7, -2.53, 2.25);
        }

        const head = new THREE.Group();
        head.position.set(0, 4.55, 0.03);
        avatar.add(head);
        if (character.feminine) {
          const neck = makePart(new THREE.CylinderGeometry(0.42, 0.46, 1, 16), skin, avatar, 0, 3.4, 0.05);
          inked(neck, 1.08);
        }
        const face = makePart(new THREE.SphereGeometry(1.25, 48, 36), skin, head, 0, 0, 0.05);
        face.scale.set(0.93, 1.03, 0.97);
        const faceExpression = createBotFace(character.feminine);
        face.material = new THREE.MeshToonMaterial({ map: faceExpression.texture, gradientMap: toonGradient });
        inked(face, 1.03);
        const moodIcon = createBotMoodIcon();
        moodIcon.sprite.position.set(2.05, 5.85, 0.8);
        avatar.add(moodIcon.sprite);
        const rand = (seed) => {
          const value = Math.sin(seed * 12.9898) * 43758.5453;
          return value - Math.floor(value);
        };
        const hairScale = [0.95, 1.04, 0.99];
        const hairRadius = character.feminine ? 1.3 : 1.28;
        const hairCover = character.feminine
          ? toon(character.hair, { side: THREE.DoubleSide })
          : hair;
        const hairTop = makePart(
          new THREE.SphereGeometry(1.33, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.47),
          hairCover,
          head
        );
        hairTop.scale.set(...hairScale);
        if (!character.feminine) inked(hairTop);
        const hairBack = makePart(
          new THREE.SphereGeometry(
            character.feminine ? 1.34 : 1.3,
            40,
            24,
            Math.PI / 2 + (character.feminine ? 0.65 : 0.75),
            Math.PI * 2 - (character.feminine ? 1.3 : 1.5),
            0,
            character.feminine ? Math.PI * 0.9 : 0.7
          ),
          hairCover,
          head
        );
        hairBack.scale.set(...hairScale);
        if (!character.feminine) inked(hairBack);
        const addHairSpike = (phi, theta, length, radius, direction) => {
          const point = new THREE.Vector3(
            -hairRadius * Math.cos(phi) * Math.sin(theta) * hairScale[0],
            hairRadius * Math.cos(theta) * hairScale[1],
            hairRadius * Math.sin(phi) * Math.sin(theta) * hairScale[2]
          );
          const spike = makePart(new THREE.ConeGeometry(radius, length, 8), hair, head);
          const unitDirection = direction.clone().normalize();
          spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unitDirection);
          spike.position.copy(point).addScaledVector(unitDirection, length * 0.3);
          if (!character.feminine) inked(spike);
        };
        if (character.feminine) {
          const hairStrandMaterial = hairCover;
          const addHairStrand = (points, startRadius, endRadius, flattening) => {
            const curve = new THREE.CatmullRomCurve3(points);
            const segments = 30;
            const radialSegments = 10;
            const frames = curve.computeFrenetFrames(segments, false);
            const positions = [];
            const indices = [];
            for (let segment = 0; segment <= segments; segment += 1) {
              const t = segment / segments;
              const point = curve.getPointAt(t);
              const radius = startRadius + (endRadius - startRadius) * Math.pow(t, 0.75);
              for (let radial = 0; radial < radialSegments; radial += 1) {
                const angle = radial / radialSegments * Math.PI * 2;
                const vertex = point.clone()
                  .addScaledVector(frames.normals[segment], Math.cos(angle) * radius * flattening)
                  .addScaledVector(frames.binormals[segment], Math.sin(angle) * radius);
                positions.push(vertex.x, vertex.y, vertex.z);
              }
            }
            for (let segment = 0; segment < segments; segment += 1) {
              for (let radial = 0; radial < radialSegments; radial += 1) {
                const a = segment * radialSegments + radial;
                const b = segment * radialSegments + (radial + 1) % radialSegments;
                const c = (segment + 1) * radialSegments + radial;
                const d = (segment + 1) * radialSegments + (radial + 1) % radialSegments;
                indices.push(a, c, b, b, c, d);
              }
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            makePart(geometry, hairStrandMaterial, head);
          };
          const wave = (start, end, amplitude, phase) => {
            const points = [];
            for (let index = 0; index <= 8; index += 1) {
              const t = index / 8;
              points.push(new THREE.Vector3(
                start.x + (end.x - start.x) * t + Math.sin(t * 6.3 + phase) * amplitude * t,
                start.y + (end.y - start.y) * t,
                start.z + (end.z - start.z) * t + Math.cos(t * 6.3 + phase) * amplitude * 0.5 * t
              ));
            }
            return points;
          };
          const backHairMass = makePart(
            new THREE.SphereGeometry(1, 32, 24),
            hairCover,
            head,
            0,
            -1.72,
            -0.68
          );
          backHairMass.scale.set(1.52, 2.62, 0.9);
          for (const side of [-1, 1]) {
            const sideHairMass = makePart(
              new THREE.SphereGeometry(1, 24, 18),
              hairCover,
              head,
              side * 1.1,
              -1.68,
              0.08
            );
            sideHairMass.scale.set(0.64, 2.18, 0.7);
          }
          for (const side of [-1, 1]) {
            addHairStrand(wave(new THREE.Vector3(side * 1.02, 0.3, 0.74), new THREE.Vector3(side * 1.5, -3.3, 1.08), 0.28 * side, side), 0.5, 0.1, 0.62);
            addHairStrand(wave(new THREE.Vector3(side * 1.15, 0.3, 0.3), new THREE.Vector3(side * 1.6, -3.7, 0.9), -0.3 * side, side + 1), 0.56, 0.12, 0.7);
            addHairStrand(wave(new THREE.Vector3(side * 1.18, 0.3, -0.3), new THREE.Vector3(side * 1.5, -4.0, 0.35), 0.3 * side, side + 2), 0.58, 0.12, 0.7);
          }
          for (let index = 0; index < 13; index += 1) {
            const phi = Math.PI / 2 + (index - 6) * 0.17;
            const side = index < 6 ? -1 : 1;
            addHairSpike(
              phi,
              Math.PI * (0.335 + rand(index) * 0.03),
              0.6 + rand(index + 3) * 0.3,
              0.21 + rand(index + 9) * 0.04,
              new THREE.Vector3(side * (0.35 + Math.abs(index - 6) * 0.07), -1, 0.4)
            );
          }
          for (let index = 0; index < 2; index += 1) {
            const phi = rand(index + 20) * Math.PI * 2;
            const theta = Math.PI * (0.08 + rand(index + 30) * 0.16);
            const direction = new THREE.Vector3(
              -Math.cos(phi) * Math.sin(theta),
              Math.cos(theta),
              Math.sin(phi) * Math.sin(theta)
            );
            direction.multiplyScalar(0.5).add(new THREE.Vector3(rand(index) - 0.5, -0.2, -0.6));
            addHairSpike(phi, theta, 0.45 + rand(index + 40) * 0.25, 0.2, direction);
          }
          const hoodBack = makePart(new THREE.SphereGeometry(1, 24, 16), hoodLight, avatar, 0, 2.85, -1);
          hoodBack.scale.set(1.55, 0.75, 0.7);
          inked(hoodBack, 1.04);
          const cowl = makePart(new THREE.TorusGeometry(1.12, 0.27, 14, 36), hoodDark, head, 0, -1.42, 0);
          cowl.rotation.x = Math.PI / 2;
          inked(cowl, 1.07);
          makePart(new THREE.SphereGeometry(0.09, 10, 8), cream, head, 1.18, -0.1, 0.12);
        } else {
          for (let index = 0; index < 11; index += 1) {
            const phi = Math.PI / 2 + (index - 5) * 0.2;
            const theta = Math.PI * (0.355 + rand(index) * 0.04);
            const direction = new THREE.Vector3(Math.sin(index * 1.7) * 0.35, -1, 0.35);
            addHairSpike(phi, theta, 0.55 + rand(index + 3) * 0.45, 0.2 + rand(index + 7) * 0.05, direction);
          }
          for (let index = 0; index < 7; index += 1) {
            const phi = rand(index + 20) * Math.PI * 2;
            const theta = Math.PI * (0.1 + rand(index + 30) * 0.18);
            const direction = new THREE.Vector3(
              -Math.cos(phi) * Math.sin(theta),
              Math.cos(theta),
              Math.sin(phi) * Math.sin(theta)
            ).multiplyScalar(0.55).add(new THREE.Vector3(rand(index) - 0.5, -0.1, -0.7));
            addHairSpike(phi, theta, 0.5 + rand(index + 40) * 0.25, 0.24, direction);
          }
          const hoodCenter = new THREE.Vector3(0, -0.02, -0.28);
          const hood = makePart(
            new THREE.SphereGeometry(1.62, 40, 28, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, 0, Math.PI * 0.8),
            new THREE.MeshToonMaterial({ color: new THREE.Color(character.hoodDark).convertSRGBToLinear(), gradientMap: toonGradient, side: THREE.DoubleSide }),
            head,
            hoodCenter.x,
            hoodCenter.y,
            hoodCenter.z
          );
          inked(hood);
          for (const side of [-1, 1]) {
            const phi = Math.PI / 2 + side * 1.05;
            const points = [];
            for (let index = 0; index <= 20; index += 1) {
              const theta = 0.34 + (Math.PI * 0.78 - 0.34) * index / 20;
              points.push(new THREE.Vector3(
                hoodCenter.x - 1.62 * Math.cos(phi) * Math.sin(theta),
                hoodCenter.y + 1.62 * Math.cos(theta),
                hoodCenter.z + 1.62 * Math.sin(phi) * Math.sin(theta)
              ));
            }
            const rim = makePart(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, 0.22, 10), hoodLight, head);
            inked(rim, 1.1);
          }
          const archPoints = [];
          for (let index = 0; index <= 24; index += 1) {
            const phi = Math.PI / 2 - 1.05 + 2.1 * index / 24;
            const theta = 0.34;
            archPoints.push(new THREE.Vector3(
              hoodCenter.x - 1.62 * Math.cos(phi) * Math.sin(theta),
              hoodCenter.y + 1.62 * Math.cos(theta),
              hoodCenter.z + 1.62 * Math.sin(phi) * Math.sin(theta)
            ));
          }
          inked(makePart(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints), 32, 0.22, 10), hoodLight, head), 1.1);
          const cowl = makePart(new THREE.TorusGeometry(1.3, 0.46, 14, 36), hoodDark, head, 0, -1.2, -0.1);
          cowl.rotation.x = Math.PI / 2;
          inked(cowl, 1.07);
        }

        const crestCanvas = document.createElement('canvas');
        crestCanvas.width = 128;
        crestCanvas.height = 160;
        const crestContext = crestCanvas.getContext('2d');
        crestContext.fillStyle = '#e7a91c';
        crestContext.beginPath();
        crestContext.moveTo(14, 10);
        crestContext.lineTo(114, 10);
        crestContext.lineTo(114, 80);
        crestContext.quadraticCurveTo(114, 130, 64, 152);
        crestContext.quadraticCurveTo(14, 130, 14, 80);
        crestContext.closePath();
        crestContext.fill();
        crestContext.strokeStyle = '#7a1f2b';
        crestContext.lineWidth = 4;
        crestContext.stroke();
        crestContext.fillStyle = '#c8321f';
        crestContext.beginPath();
        crestContext.moveTo(64, 20);
        crestContext.quadraticCurveTo(86, 44, 72, 62);
        crestContext.quadraticCurveTo(64, 50, 56, 62);
        crestContext.quadraticCurveTo(42, 44, 64, 20);
        crestContext.fill();
        crestContext.strokeStyle = '#7a1f2b';
        crestContext.lineWidth = 6;
        crestContext.beginPath();
        crestContext.moveTo(64, 60);
        crestContext.lineTo(64, 140);
        crestContext.stroke();
        crestContext.lineWidth = 5;
        crestContext.beginPath();
        crestContext.moveTo(64, 72);
        crestContext.bezierCurveTo(94, 80, 94, 94, 64, 102);
        crestContext.bezierCurveTo(34, 110, 34, 124, 64, 132);
        crestContext.stroke();
        const crestTexture = new THREE.CanvasTexture(crestCanvas);
        crestTexture.encoding = THREE.sRGBEncoding;
        const chest = makePart(
          new THREE.PlaneGeometry(0.85, 1.05),
          new THREE.MeshBasicMaterial({ map: crestTexture, transparent: true }),
          avatar,
          0.85,
          1.6,
          1.2
        );
        chest.rotation.y = 0.22;
        for (const x of [-0.28, 0.28]) {
          const cord = makePart(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), cream, avatar, x, 2.2, 1);
          cord.rotation.x = -0.08;
          inked(cord, 1.08);
        }

        const makeHand = (thumbSide) => {
          const hand = new THREE.Group();
          const palm = makePart(new THREE.SphereGeometry(1, 22, 16), skin, hand);
          palm.scale.set(0.37, 0.19, 0.4);
          palm.position.set(0, 0, 0.3);
          inked(palm, 1.07);
          const fingers = [];
          [[-0.23, 0.36], [-0.08, 0.42], [0.08, 0.4], [0.23, 0.32]].forEach(([x, length]) => {
            const base = new THREE.Group();
            base.position.set(x, 0, 0.58);
            hand.add(base);
            const first = makePart(new THREE.CylinderGeometry(0.082 * 0.92, 0.082, length * 0.55, 10), skin, base);
            first.rotation.x = Math.PI / 2;
            first.position.z = length * 0.275;
            inked(first, 1.12);
            const middle = new THREE.Group();
            middle.position.z = length * 0.55;
            base.add(middle);
            const second = makePart(new THREE.CylinderGeometry(0.075 * 0.92, 0.075, length * 0.45, 10), skin, middle);
            second.rotation.x = Math.PI / 2;
            second.position.z = length * 0.225;
            inked(second, 1.12);
            const fingertip = makePart(new THREE.SphereGeometry(0.07, 12, 10), skin, middle, 0, 0, length * 0.45);
            inked(fingertip, 1.12);
            fingers.push({ base, middle });
          });
          const thumb = new THREE.Group();
          thumb.position.set(thumbSide * 0.3, -0.03, 0.2);
          thumb.rotation.order = 'YXZ';
          hand.add(thumb);
          const thumbBase = makePart(new THREE.CylinderGeometry(0.1 * 0.92, 0.1, 0.28, 10), skin, thumb);
          thumbBase.rotation.x = Math.PI / 2;
          thumbBase.position.z = 0.14;
          inked(thumbBase, 1.12);
          const thumbMiddle = new THREE.Group();
          thumbMiddle.position.z = 0.28;
          thumb.add(thumbMiddle);
          const thumbSecond = makePart(new THREE.CylinderGeometry(0.092 * 0.92, 0.092, 0.22, 10), skin, thumbMiddle);
          thumbSecond.rotation.x = Math.PI / 2;
          thumbSecond.position.z = 0.11;
          inked(thumbSecond, 1.12);
          const thumbTip = makePart(new THREE.SphereGeometry(0.09, 12, 10), skin, thumbMiddle, 0, 0, 0.22);
          inked(thumbTip, 1.12);
          hand.userData = { fingers, thumb, thumbMiddle, thumbSide, grip: 0 };
          return hand;
        };
        const setHandGrip = (hand, grip) => {
          const { fingers, thumb, thumbMiddle, thumbSide } = hand.userData;
          hand.userData.grip = grip;
          fingers.forEach((finger, index) => {
            finger.base.rotation.x = 0.1 + grip * (1 + index * 0.03);
            finger.middle.rotation.x = 0.05 + grip * 1.2;
            finger.base.rotation.y = (index - 1.5) * 0.06 * (1 - grip);
          });
          thumb.rotation.y = thumbSide * (0.55 - grip * 0.55);
          thumb.rotation.x = 0.1 + grip * 0.55;
          thumbMiddle.rotation.x = 0.1 + grip * 0.8;
        };

        const createArm = (side) => {
          const shoulder = new THREE.Vector3(side * 2, 2.6, 0.05);
          const upper = makePart(new THREE.CylinderGeometry(0.36, 0.43, 1, 20), hoodie, avatar);
          const forearm = makePart(new THREE.CylinderGeometry(0.3, 0.37, 1, 20), hoodLight, avatar);
          const shoulderJoint = makePart(new THREE.SphereGeometry(0.46, 20, 16), hoodie, avatar, shoulder.x, shoulder.y, shoulder.z);
          const elbowJoint = makePart(new THREE.SphereGeometry(0.34, 18, 14), hoodLight, avatar);
          inked(upper, 1.09);
          inked(forearm, 1.09);
          inked(shoulderJoint, 1.05);
          inked(elbowJoint, 1.07);
          const handGroup = makeHand(-side);
          handGroup.scale.setScalar(0.92);
          avatar.add(handGroup);
          const arm = {
            side,
            shoulder,
            upper,
            forearm,
            shoulderJoint,
            elbowJoint,
            handGroup,
            phase: (side < 0 ? 0 : 1) + seat * 0.7
          };
          const pose = (time, reaching, mood, gripOverride, reachFactor, handTarget) => {
            const sway = reaching ? (Math.sin(time * 4 + arm.phase) + 1) * 0.34 : Math.sin(time * 1.4 + arm.phase) * 0.035;
            let elbow = new THREE.Vector3(side * (1.72 + sway * 0.18), 1.55 + sway * 0.22, 0.52 + sway * 0.28);
            let wrist = new THREE.Vector3(side * (1.7 + sway), 1.08 + sway * 0.18, 1.28 + sway * 0.62);
            let grip = 0.12;
            if (handTarget) {
              wrist = handTarget;
              elbow = shoulder.clone().lerp(wrist, 0.52);
              elbow.x += side * 0.3;
              elbow.y = Math.max(shoulder.y, wrist.y) + 0.5;
            } else if (reachFactor !== undefined) {
              const reach = 0.47 * reachFactor;
              elbow = new THREE.Vector3(side * (1.72 - reach * 0.55), 1.55 + reach * 0.3, 0.8 + reach * 0.25);
              wrist = new THREE.Vector3(side * (1.65 - reach * 1.3), 1.1 + reach * 0.18, 1.4 + reach * 1.2);
            } else if (mood === 'thinking' && side > 0) {
              elbow = new THREE.Vector3(1.72, 2.95, 0.38);
              wrist = new THREE.Vector3(1.42, 3.42 + Math.sin(time * 1.2) * 0.035, 0.68);
            } else if (reaching) {
              const reach = 0.25 + 0.22 * Math.sin(time * 4 + arm.phase);
              elbow = new THREE.Vector3(side * (1.72 - reach * 0.55), 1.55 + reach * 0.3, 0.8 + reach * 0.25);
              wrist = new THREE.Vector3(side * (1.65 - reach * 1.3), 1.1 + reach * 0.18, 1.4 + reach * 1.2);
              grip = 0.42 + Math.sin(time * 4 + arm.phase) * 0.12;
            } else if (mood === 'happy') {
              elbow = new THREE.Vector3(side * 1.7, 3.02, 0.32);
              wrist = new THREE.Vector3(side * 2.15, 3.78 + Math.sin(time * 7 + arm.phase) * 0.28, 0.42);
            } else if (mood === 'sad') {
              elbow = new THREE.Vector3(side * 1.55, 1.12, 0.38);
              wrist = new THREE.Vector3(side * 1.62, 0.54 + Math.sin(time * 3.2) * 0.035, 0.92);
            }
            placeLimb(upper, shoulder, elbow);
            placeLimb(forearm, elbow, wrist);
            elbowJoint.position.copy(elbow);
            handGroup.position.copy(wrist);
            const waving = gripOverride === undefined && mood === 'happy';
            const tapping = gripOverride === undefined && mood === 'thinking' && side > 0;
            const sad = gripOverride === undefined && mood === 'sad';
            if (waving) grip = 0.05;
            else if (sad) grip = 0.26;
            else if (tapping) grip = 0.12;
            if (gripOverride !== undefined) grip = gripOverride;
            handGroup.rotation.set(
              handTarget ? -0.55 : tapping ? -0.55 : sad ? 0.05 : -0.2,
              waving ? Math.sin(time * 7 + arm.phase) * 0.28 : 0,
              waving ? side * (0.25 + Math.sin(time * 7 + arm.phase) * 0.12) : side * -0.16
            );
            setHandGrip(handGroup, grip);
            if (tapping) {
              handGroup.userData.fingers.forEach((finger, index) => {
                finger.base.rotation.x += Math.max(0, Math.sin(time * 8 - index * 0.8)) * 0.4;
              });
            }
          };
          arm.pose = pose;
          pose(0, false);
          return arm;
        };
        const arms = [createArm(-1), createArm(1)];
        botActors.push({
          seat,
          avatar,
          head,
          arms,
          torso,
          player,
          expression: 'idle',
          handActionProgress: null,
          handTarget: null,
          actionHandSide: 1,
          handGrip: 0.12,
          faceTexture: faceExpression.texture,
          toonGradient,
          crestTexture,
          paintExpression: faceExpression.paint,
          moodIcon: moodIcon.sprite,
          moodIconTexture: moodIcon.texture,
          paintMoodIcon: moodIcon.paint
        });
      }

      function animateBots() {
        if (botAnimationFrame) cancelAnimationFrame(botAnimationFrame);
        botAnimationFrame = 0;
        if (disposed || !botActors.length) return;
        const animate = (time) => {
          botAnimationFrame = 0;
          if (disposed) return;
          const seconds = time / 1000;
          botActors.forEach((actor) => {
            const active = actor.seat === activeBotSeat;
            const mood = actor.expression;
            const handActionProgress = active ? actor.handActionProgress : null;
            const breath = Math.sin(seconds * 1.25 + actor.seat) * 0.025;
            const bounce = mood === 'happy' ? Math.abs(Math.sin(seconds * 5.2)) * 0.2 : 0;
            actor.torso.position.y = 1.4 + breath + bounce;
            actor.torso.rotation.x = mood === 'play' ? -0.035 : mood === 'sad' ? 0.035 : 0;
            actor.torso.rotation.z = Math.sin(seconds * 0.58 + actor.seat) * 0.008;
            const actionTarget = active ? actor.handTarget : null;
            const handReach = handActionProgress === null ? undefined : Math.sin(Math.PI * handActionProgress);
            const handClose = handActionProgress === null ? undefined : actor.handGrip;
            actor.arms.forEach((arm) => {
              const actingHand = Boolean(actionTarget) && arm.side === actor.actionHandSide;
              arm.pose(
                seconds,
                handActionProgress === null && active && mood === 'play',
                mood,
                actionTarget ? (actingHand ? actor.handGrip : undefined) : handClose,
                actionTarget ? undefined : handReach,
                actingHand ? actionTarget : null
              );
            });
            actor.head.rotation.x = mood === 'thinking'
              ? -0.18
              : mood === 'play'
                ? -0.08 + Math.sin(seconds * 2.3) * 0.035
                : mood === 'sad'
                  ? 0.2
                  : mood === 'happy'
                    ? -0.08
                    : Math.sin(seconds * 0.8 + actor.seat) * 0.012;
            actor.head.rotation.y = mood === 'thinking' ? -0.07 : mood === 'play' ? 0.12 : 0;
            actor.head.rotation.z = mood === 'thinking' ? 0.14 : mood === 'happy' ? Math.sin(seconds * 3.5) * 0.045 : 0;
            const blink = mood !== 'happy' && ((seconds + actor.seat * 0.73) % 4.3) > 4.15;
            const look = mood === 'thinking'
              ? -1
              : mood === 'idle'
                ? Math.sin(seconds * 0.5 + actor.seat) > 0.6 ? 1 : Math.sin(seconds * 0.5 + actor.seat) < -0.6 ? -1 : 0
                : 0;
            actor.paintExpression(mood, blink, look);
            actor.moodIcon.position.y = 5.85 + Math.sin(seconds * 2.1 + actor.seat) * 0.07;
          });
          draw();
          botAnimationFrame = requestAnimationFrame(animate);
        };
        botAnimationFrame = requestAnimationFrame(animate);
      }

      function addTile(tile, x, z, isSelected, canSelect, returnable) {
        const side = new THREE.MeshStandardMaterial({ color: 0xeee3cc, roughness: 0.42 });
        const faceTexture = makeTileTexture(THREE, tile, tileTextures);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.39, 0.54), new THREE.MeshStandardMaterial({
          map: faceTexture,
          roughness: 0.48,
          emissive: isSelected ? 0x62552b : 0x000000
        }));
        const mesh = new THREE.Mesh(createRoundedTileGeometry(0.48, 0.66, 0.16), side);
        mesh.geometry.rotateX(-Math.PI / 2);
        mesh.position.set(x, 0.1 + (isSelected ? 0.13 : 0), z);
        mesh.rotation.x = -0.035;
        face.rotation.x = -Math.PI / 2;
        face.position.y = 0.176;
        mesh.add(face);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.tileId = tile.id;
        mesh.userData.canSelect = canSelect;
        mesh.userData.sourceHand = returnable;
        dynamicPieces.add(mesh);
        clickableTiles.push(mesh);
        boardTileMeshes.set(tile.id, mesh);
        return mesh;
      }

      function plasticMaterial(color, roughness, bumpScale) {
        return new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness: 0.04,
          map: plasticTexture,
          bumpMap: plasticBump,
          bumpScale: Math.min(0.35, bumpScale)
        });
      }

      const rackTileGeometry = createRoundedTileGeometry(0.46, 0.64, 0.12);
      rackTileGeometry.translate(0, 0, -0.06);

      function addRackTile(group, tile, x, y, z, faceUp, isSelected, canSelect) {
        const side = new THREE.MeshStandardMaterial({ color: 0xe7dfca, roughness: 0.5 });
        const texture = faceUp ? makeTileTexture(THREE, tile, tileTextures) : null;
        const mesh = new THREE.Mesh(rackTileGeometry.clone(), side);
        mesh.position.set(x, y + (isSelected ? 0.08 : 0), z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (faceUp) {
          const faceMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.36, 0.52),
            new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.5,
              emissive: isSelected ? 0x554b28 : 0x000000
            })
          );
          faceMesh.position.set(0, 0, 0.073);
          mesh.add(faceMesh);
        }
        if (faceUp) {
          mesh.userData.tileId = tile.id;
          mesh.userData.canSelect = canSelect;
          mesh.userData.sourceHand = group.parent && group.parent.userData.seat === 0;
          mesh.userData.sourceHandRack = mesh.userData.sourceHand;
          clickableTiles.push(mesh);
        }
        group.add(mesh);
        return mesh;
      }

      function addBrace(group, start, end, material) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const brace = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, direction.length(), 20, 1),
          material
        );
        brace.position.copy(start).add(end).multiplyScalar(0.5);
        brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        brace.castShadow = true;
        brace.receiveShadow = true;
        group.add(brace);
      }

      function roundedBox(width, height, depth, radius, material) {
        const rounded = new THREE.Group();
        [
          new THREE.BoxGeometry(width - 2 * radius, height, depth),
          new THREE.BoxGeometry(width, height - 2 * radius, depth),
          new THREE.BoxGeometry(width, height, depth - 2 * radius)
        ].forEach((geometry) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          rounded.add(mesh);
        });
        for (const [xSign, zSign] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const xEdge = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, width - 2 * radius, 12),
            material
          );
          xEdge.rotation.z = Math.PI / 2;
          xEdge.position.set(0, xSign * (height / 2 - radius), zSign * (depth / 2 - radius));
          const yEdge = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, height - 2 * radius, 12),
            material
          );
          yEdge.position.set(xSign * (width / 2 - radius), 0, zSign * (depth / 2 - radius));
          const zEdge = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, depth - 2 * radius, 12),
            material
          );
          zEdge.rotation.x = Math.PI / 2;
          zEdge.position.set(xSign * (width / 2 - radius), zSign * (height / 2 - radius), 0);
          for (const edge of [xEdge, yEdge, zEdge]) {
            edge.castShadow = true;
            edge.receiveShadow = true;
            rounded.add(edge);
          }
        }
        return rounded;
      }

      function buildRackLeg(material, height) {
        const leg = new THREE.Group();
        const tip = new THREE.Vector3(0, -height, -1.6);
        const elbow = new THREE.Vector3(0, -height, -1);
        const top = new THREE.Vector3(0, 0, 0);
        const spacing = 0.085;
        const rodRadius = 0.05;
        [-spacing, 0, spacing].forEach((x, index) => {
          const offset = new THREE.Vector3(x, index === 1 ? 0.035 : 0, 0);
          const points = [tip, elbow, top].map((point) => point.clone().add(offset));
          addBrace(leg, points[0], points[1], material);
          addBrace(leg, points[1], points[2], material);
          points.forEach((point) => {
            const joint = new THREE.Mesh(new THREE.SphereGeometry(rodRadius, 20, 16), material);
            joint.position.copy(point);
            joint.castShadow = true;
            leg.add(joint);
          });
        });
        const web = new THREE.Mesh(
          new THREE.BoxGeometry(spacing * 2, 0.03, top.distanceTo(elbow)),
          material
        );
        web.position.copy(elbow).add(top).multiplyScalar(0.5);
        web.position.y += 0.005;
        web.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3().subVectors(top, elbow).normalize()
        );
        web.castShadow = true;
        leg.add(web);
        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(spacing * 2, 0.1, tip.distanceTo(elbow) + 0.6),
          material
        );
        foot.position.copy(tip).add(elbow).multiplyScalar(0.5);
        foot.position.z -= 0.3;
        foot.castShadow = true;
        leg.add(foot);
        return leg;
      }

      function addRack(player, seat, canSelect, selectedIds, placedIds) {
        const group = new THREE.Group();
        const position = {
          0: [0, 6.2, 0],
          1: [0, -6.2, Math.PI],
          2: [-8.2, 0, -Math.PI / 2],
          3: [8.2, 0, Math.PI / 2]
        }[seat];
        group.position.set(position[0], 0, position[1]);
        group.rotation.y = position[2];
        group.userData.seat = seat;
        dynamicPieces.add(group);

        const rackGroup = new THREE.Group();
        group.add(rackGroup);
        const bodyMat = plasticMaterial(0x070708, 0.7, 0.7);
        const tierMat = plasticMaterial(0x0a0a0b, 0.68, 0.7);
        const edgeMat = plasticMaterial(0x0e0e0f, 0.5, 0.5);
        const braceMat = plasticMaterial(0x060607, 0.55, 1);
        const grooveMat = new THREE.MeshStandardMaterial({ color: 0x080809, roughness: 0.9 });
        const rackWidth = 7.2;
        rackGroup.add(roundedBox(rackWidth, 2.4, 0.14, 0.03, bodyMat));
        for (const y of [0.4, -0.6]) {
          const tier = roundedBox(7, 0.95, 0.22, 0.02, tierMat);
          tier.position.set(0, y, 0.14);
          rackGroup.add(tier);
          const lip = roundedBox(7, 0.1, 0.16, 0.03, edgeMat);
          lip.position.set(0, y - 0.43, 0.3);
          rackGroup.add(lip);
          const chamfer = new THREE.Mesh(new THREE.BoxGeometry(7, 0.06, 0.1), edgeMat);
          chamfer.position.set(0, y - 0.36, 0.27);
          chamfer.rotation.x = -0.6;
          chamfer.castShadow = true;
          rackGroup.add(chamfer);
          const groove = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.025, 0.06), grooveMat);
          groove.position.set(0, y - 0.33, 0.26);
          rackGroup.add(groove);
        }

        const topEdge = roundedBox(7.3, 0.12, 0.22, 0.04, edgeMat);
        topEdge.position.set(0, 1.2, 0.04);
        rackGroup.add(topEdge);
        for (const x of [-3.55, 3.55]) {
          const rib = roundedBox(0.1, 2.4, 0.3, 0.03, edgeMat);
          rib.position.set(x, 0, 0.1);
          rackGroup.add(rib);
        }
        for (const x of [-2.8, 0, 2.8]) {
          const foot = roundedBox(1.3, 0.1, 0.34, 0.025, edgeMat);
          foot.position.set(x, -1.24, 0.18);
          rackGroup.add(foot);
        }
        for (const x of [-2.4, 2.4]) {
          const slot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.45, 0.06), grooveMat);
          slot.position.set(x, 0.5, -0.08);
          rackGroup.add(slot);
        }

        const tilt = THREE.MathUtils.degToRad(16);
        const cosine = Math.cos(tilt);
        const sine = Math.sin(tilt);
        const rackScale = 1.25;
        rackGroup.scale.setScalar(rackScale);
        rackGroup.rotation.x = -tilt;
        rackGroup.position.set(0, -rackScale * (-1.29 * cosine + 0.18 * sine), 0);
        const attachmentY = rackGroup.position.y + rackScale * (0.5 * cosine - 0.1 * sine);
        const legHeight = (attachmentY - 0.05) / rackScale;
        for (const x of [-2.4, 2.4]) {
          const leg = buildRackLeg(braceMat, legHeight);
          leg.position.set(x, 0.5, -0.1);
          leg.rotation.x = tilt;
          rackGroup.add(leg);
        }

        const playerRack = seat === 0;
        if (playerRack) {
          playerRackDropTarget = new THREE.Mesh(
            new THREE.PlaneGeometry(7.3, 2.4),
            new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0,
              depthWrite: false,
              side: THREE.DoubleSide
            })
          );
          playerRackDropTarget.position.set(0, 0.05, 0.62);
          rackGroup.add(playerRackDropTarget);
        }
        const hand = player && Array.isArray(player.hand) ? player.hand : [];
        const tilesOnRack = [];
        hand.slice(0, 28).forEach((tile, index) => {
          const row = index < 14 ? 0 : 1;
          const column = index % 14;
          const rackTile = addRackTile(
            rackGroup,
            tile,
            (column - 6.5) * 0.48,
            (row === 0 ? 0.4 : -0.6) - 0.08,
            0.37,
            playerRack,
            selectedIds.has(tile.id),
            canSelect
          );
          tilesOnRack.push({ tile, rackTile });
          if (!playerRack) {
            rackTile.material.color.set(0xe9dfc6);
            rackTile.userData.canSelect = false;
          } else {
            rackHandTiles.push(rackTile);
            if (placedIds.has(tile.id)) rackTile.visible = false;
          }
          rackTile.visible = currentView !== 'top' && !placedIds.has(tile.id);
        });
        dynamicPieces.updateMatrixWorld(true);
        tilesOnRack.forEach(({ tile, rackTile }) => {
          botRackAnchors.set(tile.id, {
            position: rackTile.getWorldPosition(new THREE.Vector3()),
            quaternion: rackTile.getWorldQuaternion(new THREE.Quaternion()),
            object: rackTile
          });
        });
        if (player && player.isBot) addBotAvatar(player, seat);
      }

      function update(data) {
        if (!Number.isInteger(data.activeBotSeat)) {
          previousBotRackAnchors = new Map(botRackAnchors);
        }
        pointerCanHandleTiles = Boolean(data.canSelect);
        element.classList.toggle('is-hand-cursor-enabled', pointerCanHandleTiles);
        if (!pointerCanHandleTiles && !dragging) {
          cursorHand.visible = false;
          if (cursorHandAnimationFrame) {
            cancelAnimationFrame(cursorHandAnimationFrame);
            cursorHandAnimationFrame = 0;
          }
        }
        clearPieces();
        activeBotSeat = Number.isInteger(data.activeBotSeat) ? data.activeBotSeat : null;
        const placedIds = data.placedTileIds || new Set();
        const handTiles = (data.players?.[0]?.hand || []).filter((tile) => placedIds.has(tile.id));
        const board = [
          ...(data.board || []),
          ...(data.pendingGroups || []).map((tiles) => ({ tiles })),
          ...(handTiles.length ? [{ tiles: handTiles }] : [])
        ];
        const maxColumns = 20;
        const tileSpacing = 0.55;
        const rowLayouts = [{ tiles: [], columns: 0 }];
        let rowLayout = rowLayouts[0];
        for (const meld of board) {
          const tiles = meld && Array.isArray(meld.tiles) ? meld.tiles : [];
          if (!tiles.length) continue;
          if (rowLayout.columns && rowLayout.columns + tiles.length > maxColumns) {
            rowLayout = { tiles: [], columns: 0 };
            rowLayouts.push(rowLayout);
          }
          for (const tile of tiles) {
            if (rowLayout.columns >= maxColumns) {
              rowLayout = { tiles: [], columns: 0 };
              rowLayouts.push(rowLayout);
            }
            rowLayout.tiles.push({ tile, column: rowLayout.columns });
            rowLayout.columns += 1;
          }
          rowLayout.columns += 1;
        }
        const occupiedRows = rowLayouts.filter((row) => row.tiles.length);
        const rowSpacing = Math.min(0.9, 5.2 / Math.max(1, occupiedRows.length - 1));
        occupiedRows.forEach((rowLayout, rowIndex) => {
          const startX = -((rowLayout.columns - 1) * tileSpacing) / 2;
          const z = ((occupiedRows.length - 1) / 2 - rowIndex) * rowSpacing;
          rowLayout.tiles.forEach(({ tile, column }) => {
            const x = startX + column * tileSpacing;
            const returnable = placedIds.has(tile.id) && Boolean(data.canSelect);
            addTile(
              tile,
              x,
              z,
              (data.selectedIds || new Set()).has(tile.id),
              Boolean(data.canSelect),
              returnable
            );
          });
        });
        const selectedIds = data.selectedIds || new Set();
        (data.players || []).forEach((player, index) => addRack(player, index, Boolean(data.canSelect), selectedIds, placedIds));
        botActors.forEach((actor) => {
          const expression = data.ended
            ? (data.winnerSeat === actor.seat ? 'happy' : 'sad')
            : (data.botExpression?.seat === actor.seat ? data.botExpression.mood : 'idle');
          if (actor.expression !== expression) {
            actor.expression = expression;
            actor.paintMoodIcon(expression);
          }
        });
        animateBots();
      }

      function animateBotTurn({ seat = activeBotSeat, playedTiles = [], drawnTile = null }) {
        const actor = botActors.find((candidate) => candidate.seat === seat);
        if (!actor) return Promise.resolve();
        let cancelled = false;
        const flights = playedTiles.map(({ tile }) => ({
          tile,
          start: previousBotRackAnchors.get(tile.id),
          target: boardTileMeshes.get(tile.id),
          destination: 'board'
        })).filter((flight) => flight.start && flight.target);
        if (drawnTile) {
          const target = botRackAnchors.get(drawnTile.id);
          if (target) {
            flights.push({
              tile: drawnTile,
              start: {
                position: drawPilePositions[seat].clone().setY(0.38),
                quaternion: new THREE.Quaternion()
              },
              target: target.object,
              destination: 'rack'
            });
          }
        }
        return flights.reduce((sequence, flight) => sequence.then(() => {
          if (cancelled || disposed) return;
          return new Promise((resolve) => {
          dynamicPieces.updateMatrixWorld(true);
          actor.avatar.updateMatrixWorld(true);
          const side = new THREE.MeshStandardMaterial({ color: 0xe7dfca, roughness: 0.5 });
          const face = new THREE.MeshStandardMaterial({
            map: makeTileTexture(THREE, flight.tile, tileTextures),
            roughness: 0.5
          });
          const piece = new THREE.Group();
          const body = new THREE.Mesh(createRoundedTileGeometry(0.48, 0.66, 0.12), side);
          body.geometry.rotateX(-Math.PI / 2);
          const top = new THREE.Mesh(new THREE.PlaneGeometry(0.39, 0.54), face);
          top.rotation.x = -Math.PI / 2;
          top.position.z = 0.061;
          piece.add(body, top);
          piece.position.copy(flight.start.position);
          piece.quaternion.copy(flight.start.quaternion);
          piece.traverse((object) => {
            if (object.isMesh) object.castShadow = true;
          });
          dynamicPieces.add(piece);
          const targetWasVisible = flight.target ? flight.target.visible : false;
          if (flight.target) flight.target.visible = false;
          const endPosition = flight.target
            ? flight.target.getWorldPosition(new THREE.Vector3())
            : flight.start.position.clone();
          const endQuaternion = flight.target
            ? flight.target.getWorldQuaternion(new THREE.Quaternion())
            : flight.start.quaternion.clone();
          const startPosition = piece.position.clone();
          const startQuaternion = piece.quaternion.clone();
          const localSource = actor.avatar.worldToLocal(startPosition.clone());
          const localDestination = actor.avatar.worldToLocal(endPosition.clone());
          actor.actionHandSide = localSource.x < -0.2 ? -1 : 1;
          const hand = actor.arms.find((arm) => arm.side === actor.actionHandSide);
          const home = actor.avatar.localToWorld(hand.handGroup.position.clone());
          const homeLocal = hand.handGroup.position.clone();
          const sourceGripLocal = localSource.clone();
          sourceGripLocal.y += 0.3;
          const destinationGripLocal = localDestination.clone();
          destinationGripLocal.y += 0.45;
          const sourceHighLocal = localSource.clone();
          sourceHighLocal.y = 3.3;
          const homeHighLocal = homeLocal.clone();
          homeHighLocal.y = 3.3;
          const destinationHighLocal = localDestination.clone();
          destinationHighLocal.y = 3.3;
          const supportLaneLocal = new THREE.Vector3(
            localSource.x * 0.4 + localDestination.x * 0.6,
            3.3,
            3.7
          );
          const localToWorld = (position) => actor.avatar.localToWorld(position.clone());
          const sourceGrip = localToWorld(sourceGripLocal);
          const sourceHigh = localToWorld(sourceHighLocal);
          const homeHigh = localToWorld(homeHighLocal);
          const destinationGrip = localToWorld(destinationGripLocal);
          const destinationHigh = localToWorld(destinationHighLocal);
          const supportLane = localToWorld(supportLaneLocal);
          const heldOffset = new THREE.Vector3(0, -0.28, 0.18);
          let settled = false;
          let animationFrame = 0;
          const settle = () => {
            if (settled) return;
            settled = true;
            if (animationFrame) cancelAnimationFrame(animationFrame);
            if (cancelActiveBotFlight === cancelFlight) cancelActiveBotFlight = null;
            if (flight.target) flight.target.visible = targetWasVisible;
            if (piece.parent) {
              dynamicPieces.remove(piece);
              disposeTree(piece);
            }
            actor.handActionProgress = null;
            actor.handTarget = null;
            actor.handGrip = 0.12;
            draw();
            resolve();
          };
          const cancelFlight = () => {
            cancelled = true;
            settle();
          };
          cancelActiveBotFlight = cancelFlight;
          const startedAt = performance.now();
          const duration = 2800;
          const smooth = (value) => {
            const clamped = Math.max(0, Math.min(1, value));
            return clamped * clamped * (3 - 2 * clamped);
          };
          const mixVector = (from, to, progress) => from.clone().lerp(to, smooth(progress));
          const waypointAt = (progress, start, end, from, to) => (
            progress < end
              ? mixVector(from, to, (progress - start) / (end - start))
              : null
          );
          actor.handActionProgress = 0;
          actor.handGrip = 0.12;
          actor.handTarget = actor.avatar.worldToLocal(home.clone());
          const animate = (time) => {
            if (disposed || cancelled) return settle();
            const progress = Math.min(1, (time - startedAt) / duration);
            actor.handActionProgress = progress;

            let wristWorld;
            wristWorld = waypointAt(progress, 0, 0.1, home, homeHigh)
              || waypointAt(progress, 0.1, 0.2, homeHigh, sourceHigh)
              || waypointAt(progress, 0.2, 0.26, sourceHigh, sourceGrip)
              || waypointAt(progress, 0.32, 0.4, sourceGrip, sourceHigh)
              || waypointAt(progress, 0.4, 0.5, sourceHigh, supportLane)
              || waypointAt(progress, 0.5, 0.68, supportLane, destinationHigh)
              || waypointAt(progress, 0.68, 0.76, destinationHigh, destinationGrip)
              || waypointAt(progress, 0.82, 0.88, destinationGrip, destinationHigh)
              || waypointAt(progress, 0.88, 0.94, destinationHigh, supportLane)
              || waypointAt(progress, 0.94, 0.97, supportLane, homeHigh)
              || waypointAt(progress, 0.97, 1, homeHigh, home)
              || (progress < 0.32 ? sourceGrip : null)
              || (progress < 0.82 ? destinationGrip : null)
              || home;

            if (progress < 0.26) {
              actor.handGrip = 0.12;
            } else if (progress < 0.32) {
              actor.handGrip = 0.12 + 0.62 * smooth((progress - 0.26) / 0.06);
            } else if (progress < 0.76) {
              actor.handGrip = 0.74;
            } else if (progress < 0.82) {
              actor.handGrip = 0.74 * (1 - smooth((progress - 0.76) / 0.06));
            } else {
              actor.handGrip = 0.12;
            }
            actor.handTarget = actor.avatar.worldToLocal(wristWorld.clone());
            hand.pose(time / 1000, false, actor.expression, actor.handGrip, undefined, actor.handTarget);
            actor.avatar.updateMatrixWorld(true);
            const handQuaternion = hand.handGroup.getWorldQuaternion(new THREE.Quaternion());
            const heldPosition = hand.handGroup.getWorldPosition(new THREE.Vector3()).add(
              heldOffset.clone().multiplyScalar(hand.handGroup.scale.x).applyQuaternion(handQuaternion)
            );

            if (progress < 0.32) {
              piece.position.copy(startPosition);
              piece.quaternion.copy(startQuaternion);
            } else if (progress < 0.76) {
              piece.position.copy(heldPosition);
              piece.quaternion.slerpQuaternions(startQuaternion, endQuaternion, smooth((progress - 0.32) / 0.44));
            } else if (progress < 0.82) {
              const placement = smooth((progress - 0.76) / 0.06);
              piece.position.lerpVectors(
                heldPosition,
                endPosition,
                placement
              );
              piece.quaternion.slerpQuaternions(startQuaternion, endQuaternion, placement);
            } else {
              piece.position.copy(endPosition);
              piece.quaternion.copy(endQuaternion);
            }
            draw();
            if (progress < 1) {
              animationFrame = requestAnimationFrame(animate);
              return;
            }
            settle();
          };
          animationFrame = requestAnimationFrame(animate);
          });
        }), Promise.resolve()).then(() => {
          draw();
        }).finally(() => {
          if (cancelActiveBotFlight) cancelActiveBotFlight = null;
        });
      }

      function pauseBotTurn() {
        if (cancelActiveBotFlight) cancelActiveBotFlight();
      }

      function pointerDown(event) {
        dragging = { x: event.clientX, y: event.clientY, moved: false };
        renderer.domElement.setPointerCapture(event.pointerId);
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(clickableTiles, false)[0];
        if (hit && hit.object.userData.sourceHand && hit.object.userData.canSelect) {
          const mesh = hit.object;
          heldHandTile = null;
          setCursorHandMode('grabbing');
          cursorFingerAnchor = null;
          updateCursorHandPosition(event, hit.point, true);
          handDragging = {
            mesh,
            parent: mesh.parent,
            position: mesh.position.clone(),
            quaternion: mesh.quaternion.clone(),
            scale: mesh.scale.clone(),
            foregroundState: null,
            startX: event.clientX,
            fromBoard: !mesh.userData.sourceHandRack,
            moved: false
          };
        }
      }

      function pointerMove(event) {
        if (!dragging) {
          if (!pointerCanHandleTiles) return;
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(clickableTiles, false)[0];
          setCursorHandMode(hit?.object.userData.canSelect ? 'pointing' : 'open');
          cursorFingerAnchor = hit?.object.userData.canSelect ? hit.point.clone() : null;
          updateCursorHandPosition(event, hit?.object.userData.canSelect ? hit.point : null);
          return;
        }
        const dx = event.clientX - dragging.x;
        const dy = event.clientY - dragging.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) {
          dragging.moved = true;
          if (handDragging && !handDragging.moved) {
            handDragging.moved = true;
            handDragging.foregroundState = setForeground(handDragging.mesh, 21);
            element.classList.add('is-grabbing-tile');
            setCursorHandMode('grabbing');
          }
        }
        if (handDragging?.moved) {
          const point = getPlanePoint(event, 0.4);
          if (point) updateCursorHandPosition(event, point, true);
          moveHandTile(event);
        } else if (dragging.moved) {
          cursorHand.visible = false;
          element.classList.remove('is-hand-cursor-enabled');
          userZoomed = true;
          theta -= dx * 0.008;
          phi = Math.max(0.16, Math.min(1.48, phi + dy * 0.006));
          updateCamera();
        }
        dragging.x = event.clientX;
        dragging.y = event.clientY;
      }

      function pointerUp(event) {
        if (!dragging) return;
        const handDrag = handDragging;
        element.classList.remove('is-grabbing-tile');
        if (handDrag?.moved) {
          const tileId = handDrag.mesh.userData.tileId;
          heldHandTile = null;
          if (handDrag.fromBoard && isOverPlayerRack(event)) {
            handDragging = null;
            if (onReturn) onReturn(tileId);
            else restoreHandTile(handDrag);
          } else if (!handDrag.fromBoard && !isOverPlayerRack(event) && getBoardDropPoint(event)) {
            handDragging = null;
            if (onDrop) onDrop(tileId);
            else onSelect(tileId);
          } else {
            restoreHandTile(handDrag);
          }
        } else if (!dragging.moved) {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(clickableTiles, false)[0];
          if (hit && hit.object.userData.canSelect) onSelect(hit.object.userData.tileId);
        }
        dragging = null;
        handDragging = null;
        heldHandTile = null;
        if (pointerCanHandleTiles) {
          setCursorHandMode('open');
          cursorFingerAnchor = null;
          updateCursorHandPosition(event);
        }
      }

      function moveHandTile(event) {
        dynamicPieces.attach(handDragging.mesh);
        heldHandTile = handDragging.mesh;
        handDragging.roll = Math.max(-0.12, Math.min(0.12, (event.clientX - handDragging.startX) * 0.0015));
        handDragging.mesh.scale.copy(handDragging.scale).multiplyScalar(1.08);
        positionHeldTile();
        draw();
      }

      function positionHeldTile() {
        if (!heldHandTile || !handDragging?.moved) return;
        cursorHand.updateMatrixWorld(true);
        const indexTip = cursorDigits[2].localToWorld(new THREE.Vector3(0, 0, -0.62));
        const thumbTip = cursorThumb.localToWorld(new THREE.Vector3(0, 0, -0.25));
        heldHandTile.position.copy(indexTip).add(thumbTip).multiplyScalar(0.5);
        heldHandTile.position.y += 0.035;
        heldHandTile.rotation.set(-0.035, theta, handDragging.roll || 0);
      }

      function updateCursorHandPosition(event, targetPoint = null, gripping = false) {
        const point = targetPoint || getPlanePoint(event, 0.12);
        if (!point || !pointerCanHandleTiles) return;
        cursorHand.rotation.set(0, theta, 0);
        if (gripping) {
          cursorFingerAnchor = null;
          const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), theta);
          const palmOffset = new THREE.Vector3(0, 0.18, 0.02).multiplyScalar(cursorHand.scale.x).applyQuaternion(yaw);
          cursorHand.position.set(point.x - palmOffset.x, point.y + palmOffset.y, point.z - palmOffset.z + 0.28);
          cursorHandBaseY = cursorHand.position.y;
        } else if (targetPoint) {
          cursorFingerAnchor = point.clone();
          positionCursorHandAtFinger(cursorFingerAnchor);
        } else {
          cursorFingerAnchor = null;
          cursorHand.position.set(point.x, point.y, point.z);
          cursorHandBaseY = point.y;
        }
        if (gripping) cursorHand.position.y = cursorHandBaseY;
        cursorHand.visible = true;
        element.classList.add('is-hand-cursor-enabled');
        if (!cursorHandAnimationFrame) {
          cursorHandAnimationFrame = requestAnimationFrame(animateCursorHand);
        }
      }

      function positionCursorHandAtFinger(point) {
        const index = cursorDigits[2];
        const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), theta);
        const tipOffset = new THREE.Vector3(0, 0, -0.62 * 1.03)
          .applyEuler(index.rotation)
          .add(index.position)
          .multiplyScalar(cursorHand.scale.x)
          .applyQuaternion(yaw);
        cursorHand.position.set(
          point.x - tipOffset.x,
          point.y - tipOffset.y,
          point.z - tipOffset.z
        );
        cursorHandBaseY = cursorHand.position.y;
      }

      function pointerLeave() {
        if (dragging) return;
        cursorHand.visible = false;
        if (cursorHandAnimationFrame) {
          cancelAnimationFrame(cursorHandAnimationFrame);
          cursorHandAnimationFrame = 0;
        }
      }

      function getPlanePoint(event, height) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -height);
        return raycaster.ray.intersectPlane(plane, new THREE.Vector3());
      }

      function getBoardDropPoint(event) {
        const point = getPlanePoint(event, 0.2);
        if (!point || Math.abs(point.x) > 8.8 || Math.abs(point.z) > 6.8) return null;
        return point;
      }

      function isOverPlayerRack(event) {
        if (!playerRackDropTarget) return false;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObject(playerRackDropTarget, false).length > 0;
      }

      function restoreHandTile(handDrag) {
        restoreForeground(handDrag.foregroundState);
        handDrag.parent.attach(handDrag.mesh);
        handDrag.mesh.position.copy(handDrag.position);
        handDrag.mesh.quaternion.copy(handDrag.quaternion);
        handDrag.mesh.scale.copy(handDrag.scale);
        draw();
      }

      function setForeground(object, renderOrder) {
        const state = [];
        object.traverse((part) => {
          state.push({ part, renderOrder: part.renderOrder });
          part.renderOrder = renderOrder;
          if (!part.isMesh) return;
          const materials = Array.isArray(part.material) ? part.material : [part.material];
          materials.forEach((material) => {
            state.push({
              material,
              depthTest: material.depthTest,
              depthWrite: material.depthWrite
            });
            material.depthTest = false;
            material.depthWrite = false;
            material.needsUpdate = true;
          });
        });
        return state;
      }

      function restoreForeground(state) {
        if (!state) return;
        state.forEach((entry) => {
          if (entry.part) entry.part.renderOrder = entry.renderOrder;
          if (entry.material) {
            entry.material.depthTest = entry.depthTest;
            entry.material.depthWrite = entry.depthWrite;
            entry.material.needsUpdate = true;
          }
        });
      }

      function cancelPointer() {
        if (handDragging) restoreHandTile(handDragging);
        dragging = null;
        handDragging = null;
        heldHandTile = null;
        element.classList.remove('is-grabbing-tile');
      }

      function wheel(event) {
        event.preventDefault();
        radius = Math.max(17, Math.min(34, radius + event.deltaY * 0.018));
        userZoomed = true;
        updateCamera();
      }

      renderer.domElement.addEventListener('pointerdown', pointerDown);
      renderer.domElement.addEventListener('pointermove', pointerMove);
      renderer.domElement.addEventListener('pointerup', pointerUp);
      renderer.domElement.addEventListener('pointercancel', cancelPointer);
      renderer.domElement.addEventListener('pointerleave', pointerLeave);
      renderer.domElement.addEventListener('wheel', wheel, { passive: false });
      controls.forEach((button) => button.addEventListener('click', () => view(button.dataset.boardView)));
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
      if (observer) observer.observe(element);
      else window.addEventListener('resize', resize);
      view(currentView);
      resize();

      return {
        update,
        animateBotTurn,
        pauseBotTurn,
        dispose() {
          pauseBotTurn();
          disposed = true;
          if (observer) observer.disconnect();
          else window.removeEventListener('resize', resize);
          if (cursorHandAnimationFrame) cancelAnimationFrame(cursorHandAnimationFrame);
          clearPieces();
          disposeTree(table);
          disposeTree(cursorHand);
          element.classList.remove('is-hand-cursor-enabled', 'is-grabbing-tile');
          const boardPanel = element.closest('.board-panel');
          if (boardPanel) delete boardPanel.dataset.boardView;
          rackTileGeometry.dispose();
          tileTextures.forEach((texture) => texture.dispose());
          woodTexture.dispose();
          woodBumpTexture.dispose();
          plasticBump.dispose();
          plasticTexture.dispose();
          renderer.dispose();
          element.replaceChildren();
        }
      };
    });
  }

  window.PartyKubTable3D = { create: createTable, createRack };
})();
