/* Current — rotate tiles so power can travel from the source to the goal. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Current = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DIRS = [
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
  ];

  const DIR_NAME = ["north", "east", "south", "west"];

  /* Openings at rotation 0. Clockwise turns add 1 (mod 4). */
  const BASE = {
    straight: [1, 3],
    corner: [0, 1],
    tee: [0, 1, 3],
    cross: [0, 1, 2, 3],
    source: [1],
    goal: [3],
    empty: [],
  };

  const TYPE_NAME = {
    straight: "Straight",
    corner: "Corner",
    tee: "Tee",
    cross: "Cross",
    source: "Source",
    goal: "Goal",
    empty: "Empty",
  };

  function openings(type, rot) {
    const base = BASE[type] || [];
    const r = ((rot % 4) + 4) % 4;
    return base.map(function (d) {
      return (d + r) % 4;
    });
  }

  function sameOpenings(a, b) {
    if (a.length !== b.length) return false;
    const set = new Set(b);
    return a.every(function (d) {
      return set.has(d);
    });
  }

  function keyOf(r, c) {
    return r + "," + c;
  }

  function dirBetween(a, b) {
    const dr = b[0] - a[0];
    const dc = b[1] - a[1];
    for (let i = 0; i < 4; i++) {
      if (DIRS[i].dr === dr && DIRS[i].dc === dc) return i;
    }
    throw new Error("Cells are not neighbors: " + a + " -> " + b);
  }

  function rotationFor(type, desired) {
    for (let rot = 0; rot < 4; rot++) {
      if (sameOpenings(openings(type, rot), desired)) return rot;
    }
    return -1;
  }

  function typeFromOpenings(dirs, role) {
    if (role === "source") return "source";
    if (role === "goal") return "goal";
    const sorted = dirs.slice().sort(function (a, b) {
      return a - b;
    });
    if (sorted.length === 2) {
      return Math.abs(sorted[0] - sorted[1]) === 2 ? "straight" : "corner";
    }
    if (sorted.length === 3) return "tee";
    if (sorted.length === 4) return "cross";
    throw new Error("Cannot classify openings " + sorted.join(","));
  }

  function link(map, a, b) {
    const d = dirBetween(a, b);
    const ka = keyOf(a[0], a[1]);
    const kb = keyOf(b[0], b[1]);
    if (!map.has(ka)) map.set(ka, new Set());
    if (!map.has(kb)) map.set(kb, new Set());
    map.get(ka).add(d);
    map.get(kb).add((d + 2) % 4);
  }

  function compileLevel(spec) {
    const map = new Map();
    const seen = new Set();
    const path = spec.path;
    if (!path || path.length < 2) throw new Error(spec.name + ": path too short");

    for (let i = 0; i < path.length; i++) {
      const cell = path[i];
      if (cell[0] < 0 || cell[1] < 0 || cell[0] >= spec.rows || cell[1] >= spec.cols) {
        throw new Error(spec.name + ": path out of bounds at " + cell);
      }
      const k = keyOf(cell[0], cell[1]);
      if (seen.has(k)) throw new Error(spec.name + ": path revisits " + k);
      seen.add(k);
      if (i > 0) link(map, path[i - 1], path[i]);
    }

    (spec.spurs || []).forEach(function (spur) {
      if (!spur.length) return;
      const junction = keyOf(spur[0][0], spur[0][1]);
      if (!seen.has(junction)) {
        throw new Error(spec.name + ": spur does not start on the path at " + junction);
      }
      for (let i = 1; i < spur.length; i++) {
        const cell = spur[i];
        if (cell[0] < 0 || cell[1] < 0 || cell[0] >= spec.rows || cell[1] >= spec.cols) {
          throw new Error(spec.name + ": spur out of bounds at " + cell);
        }
        const k = keyOf(cell[0], cell[1]);
        if (seen.has(k)) throw new Error(spec.name + ": spur revisits " + k);
        seen.add(k);
        link(map, spur[i - 1], spur[i]);
      }
    });

    const sourceKey = keyOf(path[0][0], path[0][1]);
    const goalKey = keyOf(path[path.length - 1][0], path[path.length - 1][1]);

    /* Spur tips have one opening. Give them a second that leaves the network
       so the piece is a real pipe and the extra arm does not join another wire. */
    map.forEach(function (set, k) {
      if (k === sourceKey || k === goalKey || set.size !== 1) return;
      const parts = k.split(",");
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      const only = Array.from(set)[0];
      const candidates = [(only + 2) % 4, (only + 1) % 4, (only + 3) % 4];
      for (let i = 0; i < candidates.length; i++) {
        const dir = candidates[i];
        const nr = r + DIRS[dir].dr;
        const nc = c + DIRS[dir].dc;
        const off = nr < 0 || nc < 0 || nr >= spec.rows || nc >= spec.cols;
        if (off || !map.has(keyOf(nr, nc))) {
          set.add(dir);
          return;
        }
      }
      throw new Error(spec.name + ": spur tip boxed in at " + k);
    });

    const scramble = spec.scramble || {};
    const fixedExtra = new Set(spec.fixed || []);
    const tiles = [];

    for (let r = 0; r < spec.rows; r++) {
      for (let c = 0; c < spec.cols; c++) {
        const k = keyOf(r, c);
        if (!map.has(k)) {
          tiles.push({
            type: "empty",
            rot: 0,
            initial: 0,
            solution: 0,
            fixed: true,
            row: r,
            col: c,
          });
          continue;
        }
        const desired = Array.from(map.get(k));
        const role = k === sourceKey ? "source" : k === goalKey ? "goal" : "pipe";
        const type = typeFromOpenings(desired, role);
        const solution = rotationFor(type, desired);
        if (solution < 0) {
          throw new Error(spec.name + ": no rotation for " + type + " at " + k);
        }
        const delta = ((scramble[k] || 0) % 4 + 4) % 4;
        const initial = (solution + delta) % 4;
        const fixed =
          type === "cross" || fixedExtra.has(k) || ((role === "source" || role === "goal") && delta === 0);
        tiles.push({
          type: type,
          rot: initial,
          initial: initial,
          solution: solution,
          fixed: fixed,
          row: r,
          col: c,
        });
      }
    }

    return {
      name: spec.name,
      hint: spec.hint || "",
      rows: spec.rows,
      cols: spec.cols,
      tiles: tiles,
    };
  }

  function cloneTile(tile) {
    return {
      type: tile.type,
      rot: tile.rot,
      initial: tile.initial,
      solution: tile.solution,
      fixed: tile.fixed,
      row: tile.row,
      col: tile.col,
    };
  }

  function createState(levelIndex) {
    const level = levels[levelIndex];
    return {
      index: levelIndex,
      tiles: level.tiles.map(cloneTile),
      moves: 0,
      undo: [],
    };
  }

  function snapshot(state) {
    state.undo.push({
      rots: state.tiles.map(function (tile) {
        return tile.rot;
      }),
      moves: state.moves,
    });
  }

  function turnTile(state, index) {
    const tile = state.tiles[index];
    if (!tile || tile.fixed || tile.type === "empty") return false;
    snapshot(state);
    tile.rot = (tile.rot + 1) % 4;
    state.moves += 1;
    return true;
  }

  function undo(state) {
    const prev = state.undo.pop();
    if (!prev) return false;
    state.tiles.forEach(function (tile, i) {
      tile.rot = prev.rots[i];
    });
    state.moves = prev.moves;
    return true;
  }

  function reset(state) {
    const changed =
      state.moves !== 0 ||
      state.tiles.some(function (tile) {
        return tile.rot !== tile.initial;
      });
    if (!changed) return false;
    snapshot(state);
    state.tiles.forEach(function (tile) {
      tile.rot = tile.initial;
    });
    state.moves = 0;
    return true;
  }

  function power(tiles, cols, rows) {
    const flags = new Array(tiles.length).fill(false);
    let source = -1;
    let goal = -1;
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i].type === "source") source = i;
      else if (tiles[i].type === "goal") goal = i;
    }
    if (source < 0) return { flags: flags, solved: false };
    const queue = [source];
    flags[source] = true;
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head];
      const tile = tiles[i];
      const open = openings(tile.type, tile.rot);
      for (let n = 0; n < open.length; n++) {
        const dir = open[n];
        const nr = tile.row + DIRS[dir].dr;
        const nc = tile.col + DIRS[dir].dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const ni = nr * cols + nc;
        if (flags[ni]) continue;
        const neighbor = tiles[ni];
        const back = (dir + 2) % 4;
        if (openings(neighbor.type, neighbor.rot).indexOf(back) === -1) continue;
        flags[ni] = true;
        queue.push(ni);
      }
    }
    return { flags: flags, solved: goal >= 0 && flags[goal] };
  }

  function tileLabel(tile) {
    const open = openings(tile.type, tile.rot).map(function (d) {
      return DIR_NAME[d];
    });
    const where = open.length ? " Open " + open.join(" and ") + "." : "";
    const act = tile.fixed || tile.type === "empty" ? "" : " Press to turn.";
    return TYPE_NAME[tile.type] + "." + where + act;
  }

  /*
   * Each level is a path from source to goal, plus optional dead-end spurs
   * that turn a joint into a tee or a cross. `scramble` is how many clockwise
   * quarter-turns the piece starts away from the solved orientation.
   * Straights use +1 (one click). Corners, tees, and loose ends use +3 for
   * one click or +2 for two, so the puzzle stays about seeing the circuit.
   */
  const SPECS = [
    {
      name: "Spark",
      hint: "Click a tile, or press Enter, to turn it.",
      rows: 1,
      cols: 3,
      path: [[0, 0], [0, 1], [0, 2]],
      scramble: { "0,1": 1 },
    },
    {
      name: "Elbow",
      rows: 3,
      cols: 3,
      path: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
      scramble: { "0,2": 3, "1,2": 1 },
    },
    {
      name: "Switchback",
      rows: 3,
      cols: 4,
      path: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [2, 3]],
      scramble: { "0,1": 3, "2,1": 3, "1,1": 1 },
    },
    {
      name: "Snake",
      rows: 4,
      cols: 4,
      path: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [2, 2], [2, 1], [3, 1], [3, 0]],
      scramble: { "0,3": 3, "2,3": 3, "2,1": 3, "3,1": 3 },
    },
    {
      name: "Junction",
      rows: 4,
      cols: 4,
      path: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [3, 3]],
      spurs: [[[0, 2], [0, 3]]],
      scramble: { "0,2": 3, "2,2": 3, "2,3": 3, "1,2": 1, "0,1": 1 },
    },
    {
      name: "Island",
      rows: 5,
      cols: 5,
      path: [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
        [1, 4], [2, 4], [3, 4], [4, 4],
        [4, 3], [4, 2], [4, 1], [4, 0],
        [3, 0], [2, 0],
      ],
      scramble: { "0,4": 3, "4,4": 2, "4,0": 3, "0,2": 1, "4,2": 1, "2,4": 1 },
    },
    {
      name: "Courtyard",
      rows: 5,
      cols: 5,
      path: [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
        [1, 4], [2, 4], [3, 4],
        [3, 3], [3, 2], [3, 1],
        [2, 1], [2, 2],
      ],
      scramble: { "0,4": 3, "3,4": 2, "3,1": 3, "2,1": 2, "0,2": 1, "2,4": 1, "3,2": 1 },
    },
    {
      name: "Spiral",
      rows: 5,
      cols: 5,
      path: [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
        [1, 4], [2, 4], [3, 4], [4, 4],
        [4, 3], [4, 2], [4, 1], [4, 0],
        [3, 0], [2, 0], [1, 0],
        [1, 1], [1, 2], [1, 3],
        [2, 3], [3, 3],
        [3, 2], [3, 1],
        [2, 1], [2, 2],
      ],
      scramble: { "0,4": 3, "4,4": 2, "4,0": 3, "1,0": 2, "1,3": 3, "3,3": 2, "3,1": 3, "2,1": 2 },
    },
    {
      name: "Live end",
      rows: 5,
      cols: 5,
      path: [
        [0, 4], [0, 3], [0, 2], [0, 1], [0, 0],
        [1, 0], [2, 0],
        [2, 1], [2, 2], [2, 3], [2, 4],
        [3, 4], [4, 4],
        [4, 3], [4, 2], [4, 1], [4, 0],
      ],
      scramble: {
        "0,4": 3,
        "0,0": 3,
        "2,0": 2,
        "2,4": 3,
        "4,4": 2,
        "0,2": 1,
        "2,2": 1,
        "4,2": 1,
        "1,0": 1,
      },
    },
    {
      name: "Crossbar",
      rows: 6,
      cols: 6,
      path: [
        [0, 0], [1, 0], [2, 0], [3, 0],
        [3, 1], [3, 2], [3, 3], [3, 4], [3, 5],
        [4, 5], [5, 5], [5, 4], [5, 3],
      ],
      spurs: [
        [[3, 2], [2, 2], [1, 2], [0, 2]],
        [[3, 2], [4, 2], [5, 2]],
      ],
      scramble: {
        "3,0": 3,
        "3,5": 2,
        "5,5": 3,
        "1,0": 1,
        "2,0": 1,
        "3,1": 1,
        "3,4": 1,
        "4,5": 1,
        "5,4": 1,
        "1,2": 1,
      },
    },
    {
      name: "Switchyard",
      rows: 6,
      cols: 6,
      path: [
        [0, 0], [1, 0], [2, 0],
        [2, 1], [2, 2], [2, 3], [2, 4], [2, 5],
        [3, 5], [4, 5],
        [4, 4], [4, 3], [4, 2],
        [5, 2],
      ],
      spurs: [
        [[2, 2], [1, 2], [0, 2]],
        [[4, 4], [3, 4], [3, 3]],
      ],
      scramble: {
        "2,0": 3,
        "2,5": 2,
        "4,5": 3,
        "4,2": 2,
        "2,2": 3,
        "4,4": 2,
        "1,0": 1,
        "2,3": 1,
        "3,5": 1,
        "4,3": 1,
        "0,2": 1,
      },
    },
    {
      name: "Long haul",
      rows: 6,
      cols: 6,
      path: [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 5], [2, 5],
        [2, 4], [2, 3], [2, 2], [2, 1], [2, 0],
        [3, 0], [4, 0],
        [4, 1], [4, 2], [4, 3], [4, 4], [4, 5],
        [5, 5], [5, 4], [5, 3], [5, 2], [5, 1], [5, 0],
      ],
      scramble: {
        "0,5": 3,
        "2,5": 2,
        "2,0": 3,
        "4,0": 2,
        "4,5": 3,
        "5,5": 2,
        "0,2": 1,
        "2,3": 1,
        "4,2": 1,
        "5,3": 1,
        "1,5": 1,
        "3,0": 1,
      },
    },
    {
      name: "Knot",
      rows: 6,
      cols: 7,
      path: [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
        [1, 6], [2, 6],
        [2, 5], [2, 4], [2, 3], [2, 2], [2, 1], [2, 0],
        [3, 0], [4, 0],
        [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6],
        [5, 6], [5, 5], [5, 4], [5, 3],
      ],
      spurs: [
        [[2, 4], [3, 4], [3, 5], [3, 6]],
        [[4, 2], [3, 2]],
      ],
      scramble: {
        "0,6": 3,
        "2,6": 2,
        "2,0": 3,
        "4,0": 2,
        "4,6": 3,
        "5,6": 2,
        "2,4": 3,
        "4,2": 2,
        "0,3": 1,
        "2,2": 1,
        "2,5": 1,
        "4,4": 1,
        "5,4": 1,
      },
    },
    {
      name: "Gridlock",
      rows: 7,
      cols: 7,
      path: [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
        [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
        [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
        [5, 0], [4, 0], [3, 0], [2, 0], [1, 0],
        [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 5], [3, 5], [4, 5], [5, 5],
        [5, 4], [5, 3], [5, 2], [5, 1],
        [4, 1], [3, 1], [2, 1],
        [2, 2], [2, 3], [2, 4],
        [3, 4], [4, 4],
        [4, 3], [4, 2],
        [3, 2],
        [3, 3],
      ],
      scramble: {
        "0,6": 3,
        "6,6": 2,
        "6,0": 3,
        "1,0": 2,
        "1,5": 3,
        "5,5": 2,
        "5,1": 3,
        "2,1": 2,
        "2,4": 3,
        "4,4": 2,
        "4,2": 3,
        "3,2": 2,
        "0,3": 1,
        "3,3": 3,
      },
    },
  ];

  const levels = SPECS.map(compileLevel);

  return {
    levels: levels,
    openings: openings,
    sameOpenings: sameOpenings,
    power: power,
    createState: createState,
    turnTile: turnTile,
    undo: undo,
    reset: reset,
    tileLabel: tileLabel,
    DIR_NAME: DIR_NAME,
  };
});
