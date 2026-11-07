import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRummikubMeld, createRummikubTiles, RummikubRooms } from './rummikub-game.mjs';
import { createAlToqueServer } from './server.mjs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

function tile(id, color, value) {
  return { id, color, value, joker: false };
}

function prepareFourPlayerRoom() {
  const rooms = new RummikubRooms();
  const host = rooms.create('Ana');
  const players = [host];
  for (const name of ['Luis', 'Mia', 'Paz']) players.push(rooms.join(host.roomCode, name));
  return { rooms, host, players };
}

function answerTurnQuestion(rooms, roomCode, token, targetSeat) {
  rooms.act(roomCode, token, { type: 'ask', targetSeat });
  const target = rooms.rooms.get(roomCode).players[targetSeat];
  rooms.act(roomCode, target.token, { type: 'answer', response: 'answered' });
}

test('builds the 106 physical tiles and validates runs, sets, and jokers', () => {
  const tiles = createRummikubTiles();
  assert.equal(tiles.length, 106);
  assert.equal(tiles.filter((candidate) => candidate.joker).length, 2);
  assert.equal(tiles.filter((candidate) => !candidate.joker).length, 104);
  assert.ok(resolveRummikubMeld([tile('r1', 'red', 1), tile('r2', 'red', 2), tile('r3', 'red', 3)]));
  assert.ok(resolveRummikubMeld([tile('r7', 'red', 7), tile('b7', 'blue', 7), tile('y7', 'yellow', 7)]));
  assert.equal(resolveRummikubMeld([tile('r7a', 'red', 7), tile('r7b', 'red', 7), tile('b7', 'blue', 7)]), null);
  assert.ok(resolveRummikubMeld([tile('r5', 'red', 5), tile('r7', 'red', 7), { id: 'joker', joker: true }]));
});

test('requires 4 players, protects each hand, and applies progressive question penalties', () => {
  const { rooms, host } = prepareFourPlayerRoom();
  rooms.act(host.roomCode, host.playerToken, { type: 'start' });
  const room = rooms.rooms.get(host.roomCode);
  assert.equal(room.status, 'playing');
  assert.equal(room.players.reduce((sum, player) => sum + player.hand.length, 0), 56);
  assert.equal(room.bag.length, 50);

  const activePlayer = room.players[room.currentSeat];
  const targetSeat = (room.currentSeat + 1) % 4;
  const activeState = rooms.snapshot(host.roomCode, activePlayer.token);
  assert.equal(activeState.hand.length, 14);
  assert.equal('hand' in activeState.players[(activePlayer.seat + 1) % 4], false);
  rooms.act(host.roomCode, activePlayer.token, { type: 'ask', targetSeat });
  const target = room.players[targetSeat];
  rooms.act(host.roomCode, target.token, { type: 'answer', response: 'declined' });
  assert.equal(target.hand.length, 15);
  assert.equal(room.refusals[targetSeat], 1);
  assert.equal(room.turnPhase, 'play');
  rooms.act(host.roomCode, activePlayer.token, { type: 'pass' });
  assert.equal(activePlayer.hand.length, 15);
  assert.equal(room.bag.length, 48);

  const secondPlayer = room.players[room.currentSeat];
  const firstActiveSeat = activePlayer.seat;
  rooms.act(host.roomCode, secondPlayer.token, { type: 'ask', targetSeat: firstActiveSeat });
  rooms.act(host.roomCode, activePlayer.token, { type: 'answer', response: 'answered' });
  rooms.act(host.roomCode, secondPlayer.token, { type: 'pass' });

  const nextPlayer = room.players[room.currentSeat];
  const nextRespondent = secondPlayer;
  rooms.act(host.roomCode, nextPlayer.token, { type: 'ask', targetSeat: secondPlayer.seat });
  rooms.act(host.roomCode, nextRespondent.token, { type: 'answer', response: 'declined' });
  assert.equal(nextRespondent.hand.length, 18);
  assert.equal(room.refusals[secondPlayer.seat], 2);
});

test('enforces the 30-point opening and announces Rummikub when the rack empties', () => {
  const { rooms, host } = prepareFourPlayerRoom();
  rooms.act(host.roomCode, host.playerToken, { type: 'start' });
  const room = rooms.rooms.get(host.roomCode);
  const activePlayer = room.players[room.currentSeat];
  answerTurnQuestion(rooms, host.roomCode, activePlayer.token, (activePlayer.seat + 1) % 4);

  activePlayer.hand = [tile('low-1', 'red', 1), tile('low-2', 'red', 2), tile('low-3', 'red', 3)];
  assert.throws(() => rooms.act(host.roomCode, activePlayer.token, {
    type: 'play',
    melds: [['low-1', 'low-2', 'low-3']]
  }), /30 puntos/);

  activePlayer.hand = [
    tile('set-red-10', 'red', 10),
    tile('set-blue-10', 'blue', 10),
    tile('set-yellow-10', 'yellow', 10),
    tile('run-red-1', 'red', 1),
    tile('run-red-2', 'red', 2),
    tile('run-red-3', 'red', 3)
  ];
  const state = rooms.act(host.roomCode, activePlayer.token, {
    type: 'play',
    melds: [
      ['set-red-10', 'set-blue-10', 'set-yellow-10'],
      ['run-red-1', 'run-red-2', 'run-red-3']
    ]
  });
  assert.equal(state.status, 'complete');
  assert.equal(state.winnerSeat, activePlayer.seat);
  assert.match(state.message, /¡Rummikub!/);
});

test('starts solo games against three bots and advances bots through their turns', () => {
  const rooms = new RummikubRooms();
  const host = rooms.create('Armando', { mode: 'solo' });
  let state = host.state;
  const room = rooms.rooms.get(host.roomCode);

  assert.equal(state.gameMode, 'solo');
  assert.equal(state.status, 'playing');
  assert.equal(state.players.filter((player) => player.isBot).length, 3);
  assert.equal(state.hand.length, 14);
  assert.ok(state.reserveCount <= 50);
  assert.equal(
    state.players.reduce((sum, player) => sum + player.tileCount, 0)
      + state.reserveCount
      + state.board.reduce((sum, meld) => sum + meld.tiles.length, 0),
    106
  );

  if (state.currentSeat !== 0) {
    assert.equal(state.turnPhase, 'answer');
    assert.equal(state.questionTarget, 0);
    state = rooms.act(host.roomCode, host.playerToken, { type: 'answer', response: 'answered' });
  } else {
    assert.equal(state.turnPhase, 'question');
    state = rooms.act(host.roomCode, host.playerToken, { type: 'ask', targetSeat: 1 });
    assert.equal(state.turnPhase, 'play');
    state = rooms.act(host.roomCode, host.playerToken, { type: 'pass' });
  }

  if (state.status === 'playing' && state.currentSeat !== 0) {
    assert.equal(state.turnPhase, 'answer');
    assert.equal(state.questionTarget, 0);
  } else if (state.status === 'playing') {
    assert.equal(state.turnPhase, 'question');
  }
  assert.ok(room.players.filter((player) => player.isBot).every((player) => player.token !== host.playerToken));
});

test('allows lobby departures, transfers the host, and reuses the vacant seat', () => {
  const rooms = new RummikubRooms();
  const host = rooms.create('Ana');
  const guest = rooms.join(host.roomCode, 'Luis');

  rooms.leave(host.roomCode, host.playerToken);

  const room = rooms.rooms.get(host.roomCode);
  assert.equal(room.players[0], null);
  assert.equal(room.hostToken, guest.playerToken);
  assert.equal(rooms.snapshot(host.roomCode, guest.playerToken).isHost, true);
  assert.throws(() => rooms.snapshot(host.roomCode, host.playerToken), /acceso a esta sala/);

  const replacement = rooms.join(host.roomCode, 'Mia');
  assert.equal(replacement.state.viewerSeat, 0);
  assert.equal(replacement.state.players[0].name, 'Mia');
});

test('keeps an online game moving with a bot when a player leaves', () => {
  const { rooms, host, players } = prepareFourPlayerRoom();
  rooms.act(host.roomCode, host.playerToken, { type: 'start' });

  rooms.leave(host.roomCode, host.playerToken);

  const room = rooms.rooms.get(host.roomCode);
  assert.equal(room.players[0].isBot, true);
  assert.equal(room.hostToken, players[1].playerToken);
  assert.throws(() => rooms.snapshot(host.roomCode, host.playerToken), /acceso a esta sala/);
  assert.equal(rooms.snapshot(host.roomCode, players[1].playerToken).isHost, true);
});

test('bots make a valid 30-point opening when their rack allows it', () => {
  const rooms = new RummikubRooms();
  const host = rooms.create('Armando', { mode: 'solo' });
  const room = rooms.rooms.get(host.roomCode);
  const bot = room.players[1];
  bot.opened = false;
  room.board = [{
    id: 'existing-board-meld',
    tiles: [tile('existing-4', 'black', 4), tile('existing-5', 'black', 5), tile('existing-6', 'black', 6)],
    type: 'run',
    assignments: {}
  }];
  bot.hand = [
    tile('bot-set-red', 'red', 10),
    tile('bot-set-blue', 'blue', 10),
    tile('bot-set-yellow', 'yellow', 10),
    tile('bot-run-1', 'red', 1),
    tile('bot-run-2', 'red', 2),
    tile('bot-run-3', 'red', 3)
  ];
  room.currentSeat = bot.seat;
  room.turnPhase = 'answer';
  room.questionTarget = 0;

  rooms.act(host.roomCode, host.playerToken, { type: 'answer', response: 'answered' });

  assert.equal(bot.opened, true);
  assert.ok(room.board.some((meld) => meld.tiles.some((boardTile) => boardTile.id === 'existing-4')));
  assert.ok(room.board.length >= 2);
  assert.equal(room.status, 'playing');
});

test('exposes room creation, joining, private hands, and actions through same-origin API routes', async (t) => {
  const testDir = await mkdtemp(join(tmpdir(), `rummikub-test-${randomUUID()}-`));
  const server = createAlToqueServer({
    ordersFile: join(testDir, 'orders.json'),
    reelsFile: join(testDir, 'reels.json'),
    reelsVideosDir: join(testDir, 'reels-videos')
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(testDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const api = async (path, method = 'GET', body, origin = baseUrl) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { ...(origin ? { Origin: origin } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, payload: await response.json() };
  };

  const created = await api('/api/rummikub/rooms', 'POST', { name: 'Ana' });
  assert.equal(created.status, 201);
  const code = created.payload.roomCode;
  const access = [{ code, token: created.payload.playerToken, seat: 0 }];
  const prematureStart = await api(`/api/rummikub/rooms/${code}/actions`, 'POST', {
    token: access[0].token,
    action: { type: 'start' }
  });
  assert.equal(prematureStart.status, 409);
  for (const [index, name] of ['Luis', 'Mia', 'Paz'].entries()) {
    const joined = await api(`/api/rummikub/rooms/${code}/join`, 'POST', { name });
    assert.equal(joined.status, 200);
    access.push({ code, token: joined.payload.playerToken, seat: index + 1 });
  }
  assert.equal((await api(`/api/rummikub/rooms/${code}?token=bad`)).status, 401);
  assert.equal((await api('/api/rummikub/rooms', 'POST', { name: 'Eva' }, 'https://other.example')).status, 403);
  assert.equal((await api(`/api/rummikub/rooms/${code}?token=${access[0].token}`, 'GET', undefined, null)).status, 200);

  const started = await api(`/api/rummikub/rooms/${code}/actions`, 'POST', {
    token: access[0].token,
    action: { type: 'start' }
  });
  assert.equal(started.status, 200);
  const playerStates = await Promise.all(access.map(async (player) => (
    (await api(`/api/rummikub/rooms/${code}?token=${player.token}`)).payload.state
  )));
  assert.ok(playerStates.every((state) => state.hand.length === 14));
  assert.ok(playerStates.every((state) => state.players.every((candidate) => !('hand' in candidate))));
  const active = playerStates.find((state) => state.viewerSeat === state.currentSeat);
  const activeAccess = access.find((player) => player.seat === active.viewerSeat);
  const targetSeat = (active.viewerSeat + 1) % 4;
  const asked = await api(`/api/rummikub/rooms/${code}/actions`, 'POST', {
    token: activeAccess.token,
    action: { type: 'ask', targetSeat }
  });
  assert.equal(asked.status, 200);
  const target = access.find((player) => player.seat === targetSeat);
  const declined = await api(`/api/rummikub/rooms/${code}/actions`, 'POST', {
    token: target.token,
    action: { type: 'answer', response: 'declined' }
  });
  assert.equal(declined.status, 200);
  assert.equal(declined.payload.state.hand.length, 15);

  const left = await api(`/api/rummikub/rooms/${code}/leave`, 'POST', { token: access[0].token });
  assert.equal(left.status, 200);
  assert.equal(left.payload.left, true);
  assert.equal((await api(`/api/rummikub/rooms/${code}?token=${access[0].token}`)).status, 401);
  const remainingHost = await api(`/api/rummikub/rooms/${code}?token=${access[1].token}`);
  assert.equal(remainingHost.payload.state.isHost, true);
  assert.equal(remainingHost.payload.state.players[0].isBot, true);

  const solo = await api('/api/rummikub/rooms', 'POST', { name: 'Sola', mode: 'solo' });
  assert.equal(solo.status, 201);
  assert.equal(solo.payload.state.gameMode, 'solo');
  assert.equal(solo.payload.state.status, 'playing');
  assert.equal(solo.payload.state.players.filter((player) => player.isBot).length, 3);
  assert.equal((await api(`/api/rummikub/rooms/${solo.payload.roomCode}/leave`, 'POST', { token: solo.payload.playerToken })).status, 200);
  assert.equal((await api(`/api/rummikub/rooms/${solo.payload.roomCode}?token=${solo.payload.playerToken}`)).status, 404);
});
