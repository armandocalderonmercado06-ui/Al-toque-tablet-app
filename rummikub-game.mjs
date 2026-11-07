import { randomInt, randomUUID } from 'node:crypto';

const COLORS = ['red', 'blue', 'yellow', 'black'];
const ROOM_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_MAX_AGE_MS = 3 * 60 * 60 * 1000;

export const RUMMIKUB_QUESTIONS = [
  '¿Cómo te llamas, en qué ciclo vas y qué carrera estudias?',
  '¿Qué edad tienes?',
  '¿Cómo eres fuera de la universidad?',
  '¿Cuál es tu color favorito?',
  '¿Cuándo es tu cumpleaños?',
  '¿En qué distrito vives?',
  '¿Tienes mascotas? ¿Cuántas y cuáles son?',
  '¿Desde cuándo usas lentes?',
  '¿Cuál es tu comida favorita?',
  '¿Cuál es tu deporte favorito y por qué?',
  '¿Qué profesor(a) te cae mejor?',
  '¿Qué curso te gusta más este ciclo?',
  '¿Qué curso te gusta menos este ciclo?',
  '¿Por qué elegiste tu carrera?',
  '¿Qué consejo me darías para sobrevivir la universidad?',
  '¿Alguna vez has copiado en un examen o usado IA? ¿Por qué?',
  '¿Prefieres trabajos grupales o individuales?',
  '¿Cuál ha sido tu mejor experiencia universitaria?',
  '¿Qué aplicación usas más?',
  '¿Qué haces los fines de semana?',
  '¿Qué país te gustaría visitar?',
  '¿Qué superpoder te gustaría tener?',
  '¿Qué canción escuchas mucho últimamente?',
  '¿Qué harías si ganaras la lotería?',
  '¿Qué medio prefieres para mantenerte en contacto con tus amistades?',
  '¿Te ha gustado alguien de otro ciclo o carrera? Puedes pasar si no deseas contarlo.',
  'Dime algo bonito.',
  '¿Qué cualidad valoras en alguien que te interesa?',
  '¿Qué intereses en común ayudan a que dos personas conecten?'
];

class RummikubError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function assert(condition, message, status = 400) {
  if (!condition) throw new RummikubError(message, status);
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function createRummikubTiles() {
  const tiles = [];
  for (const color of COLORS) {
    for (let value = 1; value <= 13; value += 1) {
      for (let copy = 0; copy < 2; copy += 1) {
        tiles.push({ id: randomUUID(), color, value, joker: false });
      }
    }
  }
  tiles.push(
    { id: randomUUID(), color: null, value: null, joker: true },
    { id: randomUUID(), color: null, value: null, joker: true }
  );
  return tiles;
}

export function resolveRummikubMeld(tiles) {
  if (!Array.isArray(tiles) || tiles.length < 3 || tiles.length > 13) return null;
  const jokers = tiles.filter((tile) => tile.joker);
  const numbered = tiles.filter((tile) => !tile.joker);
  if (tiles.some((tile) => !tile || (!tile.joker && (!COLORS.includes(tile.color) || !Number.isInteger(tile.value) || tile.value < 1 || tile.value > 13)))) return null;

  if (tiles.length <= 4 && numbered.every((tile) => tile.value === numbered[0]?.value)) {
    const usedColors = new Set(numbered.map((tile) => tile.color));
    if (usedColors.size === numbered.length && tiles.length <= 4) {
      const availableColors = COLORS.filter((color) => !usedColors.has(color));
      if (availableColors.length >= jokers.length) {
        const assignments = {};
        jokers.forEach((joker, index) => {
          assignments[joker.id] = { color: availableColors[index], value: numbered[0]?.value ?? 1 };
        });
        return { type: 'set', assignments };
      }
    }
  }

  if (numbered.every((tile) => tile.color === numbered[0]?.color)
    && new Set(numbered.map((tile) => tile.value)).size === numbered.length) {
    for (let start = 1; start <= 14 - tiles.length; start += 1) {
      const values = Array.from({ length: tiles.length }, (_, index) => start + index);
      if (!numbered.every((tile) => values.includes(tile.value))) continue;
      const missingValues = values.filter((value) => !numbered.some((tile) => tile.value === value));
      if (missingValues.length !== jokers.length) continue;
      const assignments = {};
      jokers.forEach((joker, index) => {
        assignments[joker.id] = { color: numbered[0]?.color ?? 'red', value: missingValues[index] };
      });
      return { type: 'run', assignments };
    }
  }

  return null;
}

function makeShuffledBag() {
  return shuffle(createRummikubTiles());
}

function drawTiles(room, player, amount) {
  const drawn = room.bag.splice(0, Math.min(amount, room.bag.length));
  player.hand.push(...drawn);
  return drawn.length;
}

function drawQuestion(room) {
  if (room.questionDeck.length === 0) room.questionDeck = shuffle(RUMMIKUB_QUESTIONS.map((_, index) => index));
  const questionIndex = room.questionDeck.pop();
  return RUMMIKUB_QUESTIONS[questionIndex];
}

function nextTurn(room) {
  room.currentSeat = (room.currentSeat + 1) % room.players.length;
  room.turnPhase = 'question';
  room.currentQuestion = drawQuestion(room);
  room.questionTarget = null;
  room.lastUpdatedAt = Date.now();
}

function startGame(room) {
  room.bag = makeShuffledBag();
  room.players.forEach((player) => {
    player.hand = room.bag.splice(0, 14);
    player.opened = false;
  });
  room.status = 'playing';
  room.board = [];
  room.currentSeat = randomInt(room.players.length);
  room.questionDeck = shuffle(RUMMIKUB_QUESTIONS.map((_, index) => index));
  room.currentQuestion = drawQuestion(room);
  room.turnPhase = 'question';
  room.questionTarget = null;
  room.message = 'La partida comenzó. Roba una carta de integración.';
}

function findBotMelds(hand) {
  const candidates = [];
  const indexes = [];
  const visit = (start) => {
    if (indexes.length >= 3) {
      const tiles = indexes.map((index) => hand[index]);
      const resolved = resolveRummikubMeld(tiles);
      if (resolved) {
        const mask = indexes.reduce((value, index) => value | (1 << index), 0);
        candidates.push({
          mask,
          tiles,
          points: tiles.reduce((sum, tile) => sum + (tile.joker ? 0 : tile.value), 0)
        });
      }
    }
    if (indexes.length === 13) return;
    for (let index = start; index < hand.length; index += 1) {
      indexes.push(index);
      visit(index + 1);
      indexes.pop();
    }
  };
  visit(0);

  const candidatesByFirstIndex = Array.from({ length: hand.length }, () => []);
  for (const candidate of candidates) {
    const firstIndex = Math.log2(candidate.mask & -candidate.mask);
    candidatesByFirstIndex[firstIndex].push(candidate);
  }
  for (const groups of candidatesByFirstIndex) {
    groups.sort((left, right) => right.points - left.points || right.tiles.length - left.tiles.length);
  }
  return candidatesByFirstIndex;
}

function findBotOpening(hand) {
  const candidatesByFirstIndex = findBotMelds(hand);
  const failed = new Set();
  const search = (availableMask, points) => {
    if (points >= 30) return [];
    if (!availableMask) return null;
    const key = `${availableMask}:${points}`;
    if (failed.has(key)) return null;

    const firstIndex = Math.log2(availableMask & -availableMask);
    for (const candidate of candidatesByFirstIndex[firstIndex]) {
      if ((candidate.mask & availableMask) !== candidate.mask) continue;
      const rest = search(availableMask & ~candidate.mask, Math.min(30, points + candidate.points));
      if (rest) return [candidate, ...rest];
    }
    const skipped = search(availableMask & ~(1 << firstIndex), points);
    if (skipped) return skipped;
    failed.add(key);
    return null;
  };
  return search((1 << hand.length) - 1, 0);
}

function findBestBotMelds(hand) {
  const candidatesByFirstIndex = findBotMelds(hand);
  const cache = new Map();
  const search = (availableMask) => {
    if (!availableMask) return { count: 0, points: 0, groups: [] };
    if (cache.has(availableMask)) return cache.get(availableMask);

    const firstIndex = Math.log2(availableMask & -availableMask);
    let best = search(availableMask & ~(1 << firstIndex));
    for (const candidate of candidatesByFirstIndex[firstIndex]) {
      if ((candidate.mask & availableMask) !== candidate.mask) continue;
      const rest = search(availableMask & ~candidate.mask);
      const option = {
        count: candidate.tiles.length + rest.count,
        points: candidate.points + rest.points,
        groups: [candidate, ...rest.groups]
      };
      if (option.count > best.count || (option.count === best.count && option.points > best.points)) best = option;
    }
    cache.set(availableMask, best);
    return best;
  };
  return search((1 << hand.length) - 1).groups;
}

function findBotBoardExtension(room, player) {
  for (let meldIndex = 0; meldIndex < room.board.length; meldIndex += 1) {
    const meld = room.board[meldIndex];
    for (const tile of player.hand) {
      const resolved = resolveRummikubMeld([...meld.tiles, tile]);
      if (!resolved) continue;
      const preservesJokers = Object.entries(meld.assignments).every(([jokerId, assignment]) => (
        resolved.assignments[jokerId]?.color === assignment.color
        && resolved.assignments[jokerId]?.value === assignment.value
      ));
      if (!preservesJokers) continue;
      return room.board.map((boardMeld, index) => (
        index === meldIndex
          ? [...boardMeld.tiles.map((boardTile) => boardTile.id), tile.id]
          : boardMeld.tiles.map((boardTile) => boardTile.id)
      ));
    }
  }
  return null;
}

function playBotTurn(room, player) {
  const groups = player.opened ? findBestBotMelds(player.hand) : findBotOpening(player.hand);
  let melds = groups?.map((group) => group.tiles.map((tile) => tile.id)) || [];
  if (player.opened && melds.length === 0) melds = findBotBoardExtension(room, player) || [];
  if (melds.length > 0) {
    const boardMelds = player.opened && groups?.length
      ? room.board.map((meld) => meld.tiles.map((tile) => tile.id))
      : [];
    applyPlay(room, player, { melds: [...boardMelds, ...melds] });
    return;
  }

  const drawn = drawTiles(room, player, 1);
  room.message = drawn ? `${player.name} pasó y robó una ficha.` : `${player.name} pasó; la reserva está vacía.`;
  nextTurn(room);
}

function advanceBotTurns(room) {
  for (let actions = 0; room.status === 'playing' && actions < 64; actions += 1) {
    const player = room.players[room.currentSeat];
    if (!player?.isBot) return;

    if (room.turnPhase === 'question') {
      const targets = room.players.filter((candidate) => candidate.seat !== player.seat);
      const target = targets[randomInt(targets.length)];
      room.questionTarget = target.seat;
      room.turnPhase = 'answer';
      room.message = `${player.name} hizo una pregunta a ${target.name}.`;
      if (!target.isBot) return;
      continue;
    }

    if (room.turnPhase === 'answer') {
      const target = room.players[room.questionTarget];
      if (!target?.isBot) return;
      room.turnPhase = 'play';
      room.questionTarget = null;
      room.message = `${target.name} respondió la pregunta.`;
      continue;
    }

    playBotTurn(room, player);
  }
}

function publicPlayer(player, seat, now) {
  if (!player) return { seat, joined: false };
  return {
    seat,
    joined: true,
    name: player.name,
    isBot: player.isBot === true,
    tileCount: player.hand.length,
    online: player.isBot === true || now - player.lastSeenAt < 12_000,
    opened: player.opened
  };
}

function getSnapshot(room, player) {
  const now = Date.now();
  player.lastSeenAt = now;
  room.lastUpdatedAt = now;
  return {
    roomCode: room.code,
    status: room.status,
    gameMode: room.mode,
    viewerSeat: player.seat,
    isHost: player.token === room.hostToken,
    players: room.players.map((candidate, seat) => candidate ? publicPlayer(candidate, seat, now) : { seat, joined: false }),
    hand: player.hand,
    board: room.board,
    reserveCount: room.bag.length,
    currentSeat: room.currentSeat,
    turnPhase: room.turnPhase,
    currentQuestion: room.currentQuestion,
    questionTarget: room.questionTarget,
    refusals: room.refusals,
    winnerSeat: room.winnerSeat,
    message: room.message
  };
}

function validateRoomCode(code) {
  return typeof code === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(code.toUpperCase());
}

function normalizePlayerName(name) {
  assert(typeof name === 'string', 'Escribe un nombre para jugar.');
  const cleanName = name.trim().replace(/\s+/g, ' ');
  assert(cleanName.length >= 2 && cleanName.length <= 24, 'El nombre debe tener entre 2 y 24 caracteres.');
  return cleanName;
}

function validateMelds(room, player, melds) {
  assert(Array.isArray(melds) && melds.length > 0 && melds.length <= 30, 'Forma al menos una combinación válida.');
  const tileById = new Map([
    ...player.hand.map((tile) => [tile.id, tile]),
    ...room.board.flatMap((meld) => meld.tiles.map((tile) => [tile.id, tile]))
  ]);
  const usedIds = new Set();
  const resolvedMelds = [];
  for (const ids of melds) {
    assert(Array.isArray(ids) && ids.length >= 3, 'Cada combinación necesita al menos 3 fichas.');
    const tiles = ids.map((id) => {
      assert(typeof id === 'string' && !usedIds.has(id), 'Una ficha no puede repetirse en la mesa.');
      usedIds.add(id);
      const tile = tileById.get(id);
      assert(tile, 'La jugada contiene una ficha que no está en tu soporte o en la mesa.');
      return tile;
    });
    const resolved = resolveRummikubMeld(tiles);
    assert(resolved, 'Una combinación no forma una serie o escalera válida.');
    resolvedMelds.push({ ids, tiles, ...resolved });
  }
  return { usedIds, resolvedMelds, tileById };
}

function applyPlay(room, player, payload) {
  const { usedIds, resolvedMelds, tileById } = validateMelds(room, player, payload.melds);
  const isOpening = !player.opened;
  const boardIds = new Set(room.board.flatMap((meld) => meld.tiles.map((tile) => tile.id)));
  const handIds = new Set(player.hand.map((tile) => tile.id));

  if (isOpening) {
    assert([...usedIds].every((id) => handIds.has(id)), 'La apertura inicial solo puede usar fichas de tu soporte.');
    const openingPoints = [...usedIds].reduce((sum, id) => sum + (tileById.get(id).joker ? 0 : tileById.get(id).value), 0);
    assert(openingPoints >= 30, 'Tu apertura inicial debe sumar al menos 30 puntos sin contar comodines.');
    player.opened = true;
  } else {
    const selectedHandIds = [...usedIds].filter((id) => handIds.has(id));
    const absentBoardIds = [...boardIds].filter((id) => !usedIds.has(id));
    const oldJokers = new Map();
    for (const meld of room.board) {
      for (const [jokerId, assignment] of Object.entries(meld.assignments)) oldJokers.set(jokerId, assignment);
    }
    assert(absentBoardIds.every((id) => oldJokers.has(id)), 'No puedes retirar fichas de la mesa, salvo un comodín reemplazado.');
    const replacementIds = new Set();
    for (const jokerId of absentBoardIds) {
      const represented = oldJokers.get(jokerId);
      const replacement = selectedHandIds.find((id) => {
        const tile = tileById.get(id);
        return !tile.joker && tile.color === represented.color && tile.value === represented.value && !replacementIds.has(id);
      });
      assert(replacement, 'Recupera el comodín colocando la ficha exacta que representa.');
      replacementIds.add(replacement);
    }
    for (const meld of resolvedMelds) {
      for (const [jokerId, assignment] of Object.entries(meld.assignments)) {
        const previous = oldJokers.get(jokerId);
        if (previous) {
          assert(previous.color === assignment.color && previous.value === assignment.value, 'No cambies la ficha que representa un comodín que ya estaba en la mesa.');
        }
      }
    }
    assert(selectedHandIds.length > 0, 'Incluye al menos una ficha de tu soporte en la jugada.');
    assert([...usedIds].every((id) => boardIds.has(id) || handIds.has(id)), 'La jugada contiene fichas que no te pertenecen.');
  }

  const playedHandIds = new Set([...usedIds].filter((id) => handIds.has(id)));
  player.hand = player.hand.filter((tile) => !playedHandIds.has(tile.id));
  const playedMelds = resolvedMelds.map((meld) => ({
    id: randomUUID(),
    tiles: meld.tiles,
    type: meld.type,
    assignments: meld.assignments
  }));
  room.board = isOpening ? [...room.board, ...playedMelds] : playedMelds;
  room.message = `${player.name} realizó una jugada.`;
  if (player.hand.length === 0) {
    room.status = 'complete';
    room.winnerSeat = player.seat;
    room.message = `${player.name} anuncia ¡Rummikub!`;
    return;
  }
  nextTurn(room);
}

function createRoomState(name) {
  return {
    code: '',
    createdAt: Date.now(),
    lastUpdatedAt: Date.now(),
    status: 'lobby',
    mode: 'online',
    players: [],
    hostToken: '',
    bag: [],
    board: [],
    currentSeat: 0,
    turnPhase: 'question',
    currentQuestion: null,
    questionTarget: null,
    questionDeck: [],
    refusals: [0, 0, 0, 0],
    winnerSeat: null,
    message: `${name} creó la sala.`
  };
}

export class RummikubRooms {
  constructor() {
    this.rooms = new Map();
  }

  create(name, { mode = 'online' } = {}) {
    this.pruneExpired();
    const cleanName = normalizePlayerName(name);
    assert(mode === 'online' || mode === 'solo', 'Selecciona una modalidad de juego.');
    let code;
    do {
      code = Array.from({ length: 6 }, () => ROOM_CODE_CHARACTERS[randomInt(ROOM_CODE_CHARACTERS.length)]).join('');
    } while (this.rooms.has(code));
    const room = createRoomState(cleanName);
    const token = randomUUID();
    room.code = code;
    room.mode = mode;
    room.hostToken = token;
    room.players = [{ seat: 0, name: cleanName, token, hand: [], opened: false, isBot: false, lastSeenAt: Date.now() }];
    if (mode === 'solo') {
      for (const [index, botName] of ['Bot Rojo', 'Bot Azul', 'Bot Amarillo'].entries()) {
        room.players.push({
          seat: index + 1,
          name: botName,
          token: randomUUID(),
          hand: [],
          opened: false,
          isBot: true,
          lastSeenAt: Date.now()
        });
      }
      startGame(room);
      advanceBotTurns(room);
    }
    this.rooms.set(code, room);
    return { roomCode: code, playerToken: token, state: getSnapshot(room, room.players[0]) };
  }

  join(code, name) {
    this.pruneExpired();
    const normalizedCode = String(code || '').trim().toUpperCase();
    assert(validateRoomCode(normalizedCode), 'El código de sala debe tener 6 caracteres.');
    const room = this.rooms.get(normalizedCode);
    assert(room, 'No se encontró esa sala. Verifica el código.', 404);
    assert(room.status === 'lobby', 'La partida ya comenzó y no acepta más jugadores.', 409);
    assert(room.players.length < 4, 'La sala ya tiene 4 participantes.', 409);
    const cleanName = normalizePlayerName(name);
    assert(!room.players.some((player) => player.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase()), 'Ese nombre ya está en la sala.');
    const token = randomUUID();
    const player = { seat: room.players.length, name: cleanName, token, hand: [], opened: false, isBot: false, lastSeenAt: Date.now() };
    room.players.push(player);
    room.message = `${cleanName} se unió a la sala.`;
    room.lastUpdatedAt = Date.now();
    return { roomCode: normalizedCode, playerToken: token, state: getSnapshot(room, player) };
  }

  snapshot(code, token) {
    const room = this.getRoom(code);
    const player = this.getPlayer(room, token);
    return getSnapshot(room, player);
  }

  act(code, token, action) {
    const room = this.getRoom(code);
    const player = this.getPlayer(room, token);
    assert(action && typeof action.type === 'string', 'La acción no es válida.');
    assert(room.status !== 'complete', 'La partida ya terminó.', 409);

    if (action.type === 'start') {
      assert(player.token === room.hostToken, 'Solo quien creó la sala puede iniciar la partida.', 403);
      assert(room.status === 'lobby' && room.players.length === 4, 'Se necesitan 4 participantes para comenzar.', 409);
      startGame(room);
    } else if (action.type === 'ask') {
      assert(room.status === 'playing' && room.turnPhase === 'question' && player.seat === room.currentSeat, 'No es tu momento de hacer la pregunta.', 409);
      assert(Number.isInteger(action.targetSeat) && action.targetSeat >= 0 && action.targetSeat < 4 && action.targetSeat !== player.seat, 'Selecciona a otro participante.');
      assert(room.players[action.targetSeat], 'Ese asiento todavía está vacío.');
      room.questionTarget = action.targetSeat;
      room.turnPhase = 'answer';
      room.message = `${player.name} hizo una pregunta a ${room.players[action.targetSeat].name}.`;
      if (room.players[action.targetSeat].isBot) {
        room.turnPhase = 'play';
        room.questionTarget = null;
        room.message = `${room.players[action.targetSeat].name} respondió la pregunta.`;
      }
    } else if (action.type === 'answer') {
      assert(room.status === 'playing' && room.turnPhase === 'answer' && room.questionTarget === player.seat, 'Esta pregunta no está dirigida a ti.', 409);
      assert(action.response === 'answered' || action.response === 'declined', 'Selecciona una respuesta válida.');
      if (action.response === 'declined') {
        room.refusals[player.seat] += 1;
        const penalty = Math.min(room.refusals[player.seat], 3);
        const drawn = drawTiles(room, player, penalty);
        room.message = `${player.name} prefirió no responder y robó ${drawn} ficha${drawn === 1 ? '' : 's'}.`;
      } else {
        room.message = `${player.name} respondió la pregunta.`;
      }
      room.turnPhase = 'play';
      room.questionTarget = null;
    } else if (action.type === 'play') {
      assert(room.status === 'playing' && room.turnPhase === 'play' && player.seat === room.currentSeat, 'No es tu turno para jugar.', 409);
      applyPlay(room, player, action);
    } else if (action.type === 'pass') {
      assert(room.status === 'playing' && room.turnPhase === 'play' && player.seat === room.currentSeat, 'No es tu turno para pasar.', 409);
      const drawn = drawTiles(room, player, 1);
      room.message = drawn ? `${player.name} pasó y robó una ficha.` : `${player.name} pasó; la reserva está vacía.`;
      nextTurn(room);
    } else {
      throw new RummikubError('La acción de juego no está permitida.');
    }

    room.lastUpdatedAt = Date.now();
    advanceBotTurns(room);
    return getSnapshot(room, player);
  }

  getRoom(code) {
    const normalizedCode = String(code || '').trim().toUpperCase();
    assert(validateRoomCode(normalizedCode), 'El código de sala debe tener 6 caracteres.');
    const room = this.rooms.get(normalizedCode);
    assert(room, 'No se encontró esa sala. Verifica el código.', 404);
    return room;
  }

  getPlayer(room, token) {
    assert(typeof token === 'string' && token.length >= 30, 'Vuelve a entrar a la sala desde este dispositivo.', 401);
    const player = room.players.find((candidate) => candidate.token === token);
    assert(player, 'Tu acceso a esta sala no es válido.', 401);
    player.lastSeenAt = Date.now();
    return player;
  }

  pruneExpired(now = Date.now()) {
    for (const [code, room] of this.rooms) {
      if (now - room.lastUpdatedAt > ROOM_MAX_AGE_MS) this.rooms.delete(code);
    }
  }
}

export async function handleRummikubRequest(request, response, requestUrl, rooms, { json, readJson, sameOrigin }) {
  if (!requestUrl.pathname.startsWith('/api/rummikub/')) return false;
  const isOriginlessRead = request.method === 'GET' && !request.headers.origin;
  if (!isOriginlessRead && !sameOrigin(request)) {
    json(response, 403, { error: 'Origen de solicitud no permitido.' });
    return true;
  }

  try {
    if (request.method === 'POST' && requestUrl.pathname === '/api/rummikub/rooms') {
      const body = await readJson(request);
      const mode = body?.mode === undefined ? 'online' : body.mode;
      assert(mode === 'online' || mode === 'solo', 'Selecciona una modalidad de juego.');
      json(response, 201, rooms.create(body?.name, { mode }));
      return true;
    }

    const joinMatch = /^\/api\/rummikub\/rooms\/([A-HJ-NP-Z2-9]{6})\/join$/i.exec(requestUrl.pathname);
    if (request.method === 'POST' && joinMatch) {
      const body = await readJson(request);
      json(response, 200, rooms.join(joinMatch[1], body?.name));
      return true;
    }

    const roomMatch = /^\/api\/rummikub\/rooms\/([A-HJ-NP-Z2-9]{6})$/i.exec(requestUrl.pathname);
    if (request.method === 'GET' && roomMatch) {
      json(response, 200, { state: rooms.snapshot(roomMatch[1], requestUrl.searchParams.get('token')) });
      return true;
    }

    const actionMatch = /^\/api\/rummikub\/rooms\/([A-HJ-NP-Z2-9]{6})\/actions$/i.exec(requestUrl.pathname);
    if (request.method === 'POST' && actionMatch) {
      const body = await readJson(request);
      json(response, 200, { state: rooms.act(actionMatch[1], body?.token, body?.action) });
      return true;
    }

    json(response, 405, { error: 'Método o ruta de Rummikub no permitidos.' });
  } catch (error) {
    json(response, error.status || 500, { error: error.status ? error.message : 'No se pudo procesar la acción de la partida.' });
  }
  return true;
}
