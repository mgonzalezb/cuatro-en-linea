// =====================================
// 🧩 Parámetros del juego y estado
// =====================================
const FILAS = 6;
const COLUMNAS = 7;
let turnoJugador1 = true;
let tablero = [];
let juegoFinalizado = false;
let reiniciando = false;
let modoIA = false;

// =====================================
// 🔗 Elementos del DOM
// =====================================
const contenedorTablero = document.getElementById('tablero');
const textoTurno = document.getElementById('turno-actual');
const mensajeFinal = document.getElementById('mensaje-final');
const botonReiniciar = document.getElementById('reiniciar');
const selectorModo = document.getElementById('modo');
const selectorDificultad = document.getElementById('dificultad');


// =====================================
// ▶️ Inicializa el juego
// =====================================
function iniciarJuego() {
  reiniciando = true;

  modoIA = selectorModo.value === 'ia';

  contenedorTablero.innerHTML = '';
  mensajeFinal.classList.add('oculto');
  mensajeFinal.textContent = '';
  juegoFinalizado = false;
  turnoJugador1 = true;
  tablero = Array.from({ length: FILAS }, () => Array(COLUMNAS).fill(null));

  for (let fila = 0; fila < FILAS; fila++) {
    for (let col = 0; col < COLUMNAS; col++) {
      const celda = document.createElement('div');
      celda.classList.add('celda');
      celda.dataset.fila = fila;
      celda.dataset.col = col;
      celda.addEventListener('click', manejarClick);
      contenedorTablero.appendChild(celda);
    }
  }

  actualizarTurno();
  setTimeout(() => reiniciando = false, 100);
}

// =====================================
// 🔄 Actualiza el texto de turno
// =====================================
function actualizarTurno() {
  if (!juegoFinalizado) {
    textoTurno.textContent = modoIA
      ? (turnoJugador1 ? 'Tu turno 🔴' : 'Turno IA 🤖')
      : `Turno: ${turnoJugador1 ? 'Jugador 1 🔴' : 'Jugador 2 🟡'}`;
  }
}

// =====================================
// 🖱️ Manejo del click en una celda
// =====================================
function manejarClick(evento) {
  if (juegoFinalizado) return;
  if (!turnoJugador1 && modoIA) return; // IA está pensando

  const col = parseInt(evento.target.dataset.col);
  jugarTurno(col);
}

// =====================================
// 🧠 Ejecuta un turno de juego
// =====================================
function jugarTurno(col) {
  for (let fila = FILAS - 1; fila >= 0; fila--) {
    if (!tablero[fila][col]) {
      tablero[fila][col] = turnoJugador1 ? 'R' : 'A';
      const celdaDOM = obtenerCeldaDOM(fila, col);
      const ficha = document.createElement('div');
      ficha.classList.add(turnoJugador1 ? 'ficha-roja' : 'ficha-amarilla');
      celdaDOM.appendChild(ficha);

      if (verificarVictoria(fila, col)) {
        juegoFinalizado = true;
        mostrarMensaje(`${turnoJugador1 ? (modoIA ? '¡Ganaste! 🎉' : 'Jugador 1 🔴') : (modoIA ? 'La IA gana 🤖' : 'Jugador 2 🟡')} ha ganado 🎉`);
        lanzarConfetti();
      } else if (tableroLleno()) {
        juegoFinalizado = true;
        mostrarMensaje('Empate 😐');
      } else {
        turnoJugador1 = !turnoJugador1;
        actualizarTurno();

        // Llamar a IA si es su turno
        if (modoIA && !turnoJugador1 && !juegoFinalizado) {
          setTimeout(turnoIA, 500); // Simula "pensar"
        }
      }
      return;
    }
  }
}

// =====================================
// 🤖 Turno de la IA (modo fácil)
// =====================================
function turnoIA() {
  const dificultad = selectorDificultad.value;

  if (dificultad === 'facil') {
    iaFacil();
  } else if (dificultad === 'media') {
    iaMedia();
  } else {
    iaDificil(); // A implementar en el próximo paso
  }
}

function iaFacil() {
  const columnasDisponibles = [];
  for (let c = 0; c < COLUMNAS; c++) {
    if (!tablero[0][c]) {
      columnasDisponibles.push(c);
    }
  }
  const randomCol = columnasDisponibles[Math.floor(Math.random() * columnasDisponibles.length)];
  jugarTurno(randomCol);
}

function iaMedia() {
  const columnasDisponibles = [];
  for (let c = 0; c < COLUMNAS; c++) {
    if (!tablero[0][c]) {
      columnasDisponibles.push(c);
    }
  }

  // Gana si puede
  for (const col of columnasDisponibles) {
    const fila = obtenerFilaDisponible(col);
    if (fila !== -1) {
      tablero[fila][col] = 'A';
      if (verificarVictoria(fila, col)) {
        tablero[fila][col] = null;
        jugarTurno(col);
        return;
      }
      tablero[fila][col] = null;
    }
  }

  // Bloquea si jugador puede ganar
  for (const col of columnasDisponibles) {
    const fila = obtenerFilaDisponible(col);
    if (fila !== -1) {
      tablero[fila][col] = 'R';
      if (verificarVictoria(fila, col)) {
        tablero[fila][col] = null;
        jugarTurno(col);
        return;
      }
      tablero[fila][col] = null;
    }
  }

  // Si no, aleatorio
  const randomCol = columnasDisponibles[Math.floor(Math.random() * columnasDisponibles.length)];
  jugarTurno(randomCol);
}

function iaDificil() {
  const profundidadMaxima = 4;
  const mejorMovimiento = minimax(tablero, profundidadMaxima, true, -Infinity, Infinity).col;
  if (mejorMovimiento !== null) {
    jugarTurno(mejorMovimiento);
  } else {
    iaMedia(); // fallback
  }
}

function minimax(tableroActual, profundidad, esMaximizador, alpha, beta) {
  const columnasDisponibles = obtenerColumnasDisponibles(tableroActual);
  const esTerminal = tableroLleno(tableroActual) || profundidad === 0;

  if (esTerminal || columnasDisponibles.length === 0) {
    return { puntuacion: evaluarTablero(tableroActual), col: null };
  }

  let mejorCol = null;

  if (esMaximizador) {
    let maxEval = -Infinity;
    for (const col of columnasDisponibles) {
      const fila = obtenerFilaDisponibleEnTablero(tableroActual, col);
      if (fila !== -1) {
        const copia = clonarTablero(tableroActual);
        copia[fila][col] = 'A';
        const resultado = minimax(copia, profundidad - 1, false, alpha, beta);
        if (resultado.puntuacion > maxEval) {
          maxEval = resultado.puntuacion;
          mejorCol = col;
        }
        alpha = Math.max(alpha, maxEval);
        if (beta <= alpha) break;
      }
    }
    return { puntuacion: maxEval, col: mejorCol };
  } else {
    let minEval = Infinity;
    for (const col of columnasDisponibles) {
      const fila = obtenerFilaDisponibleEnTablero(tableroActual, col);
      if (fila !== -1) {
        const copia = clonarTablero(tableroActual);
        copia[fila][col] = 'R';
        const resultado = minimax(copia, profundidad - 1, true, alpha, beta);
        if (resultado.puntuacion < minEval) {
          minEval = resultado.puntuacion;
          mejorCol = col;
        }
        beta = Math.min(beta, minEval);
        if (beta <= alpha) break;
      }
    }
    return { puntuacion: minEval, col: mejorCol };
  }
}

function obtenerColumnasDisponibles(tableroActual) {
  const disponibles = [];
  for (let c = 0; c < COLUMNAS; c++) {
    if (!tableroActual[0][c]) disponibles.push(c);
  }
  return disponibles;
}

function obtenerFilaDisponibleEnTablero(tableroActual, col) {
  for (let f = FILAS - 1; f >= 0; f--) {
    if (!tableroActual[f][col]) return f;
  }
  return -1;
}

function clonarTablero(original) {
  return original.map(fila => fila.slice());
}

function evaluarTablero(tab) {
  let puntaje = 0;

// Premiar fichas en el centro (columna 3)
const columnaCentral = 3;
let fichasCentro = 0;
for (let f = 0; f < FILAS; f++) {
  if (tab[f][columnaCentral] === 'A') fichasCentro++;
}
puntaje += fichasCentro * 3;

  // Heurística: +5 si hay 3 fichas IA alineadas sin bloqueo
  // -5 si hay 3 del jugador humano

  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) {
      const celda = tab[f][c];
      if (!celda) continue;

      const color = celda === 'A' ? 1 : -1;

      // horizontal
      if (c <= COLUMNAS - 4) {
        const grupo = [tab[f][c], tab[f][c+1], tab[f][c+2], tab[f][c+3]];
        puntaje += evaluarGrupo(grupo, color);
      }

      // vertical
      if (f <= FILAS - 4) {
        const grupo = [tab[f][c], tab[f+1][c], tab[f+2][c], tab[f+3][c]];
        puntaje += evaluarGrupo(grupo, color);
      }

      // diagonal ↘
      if (f <= FILAS - 4 && c <= COLUMNAS - 4) {
        const grupo = [tab[f][c], tab[f+1][c+1], tab[f+2][c+2], tab[f+3][c+3]];
        puntaje += evaluarGrupo(grupo, color);
      }

      // diagonal ↙
      if (f <= FILAS - 4 && c >= 3) {
        const grupo = [tab[f][c], tab[f+1][c-1], tab[f+2][c-2], tab[f+3][c-3]];
        puntaje += evaluarGrupo(grupo, color);
      }
    }
  }

  return puntaje;
}
function evaluarGrupo(grupo, color) {
  const conteoIA = grupo.filter(c => c === 'A').length;
  const conteoHumano = grupo.filter(c => c === 'R').length;
  const vacios = grupo.filter(c => c === null).length;

  if (conteoIA > 0 && conteoHumano > 0) return 0; // bloqueado

  if (conteoIA === 4) return 100;
  if (conteoIA === 3 && vacios === 1) return 10;
  if (conteoIA === 2 && vacios === 2) return 4;

  if (conteoHumano === 4) return -100;
  if (conteoHumano === 3 && vacios === 1) return -15;
  if (conteoHumano === 2 && vacios === 2) return -6;

  return 0;
}



// =====================================
// 📦 Verifica si el tablero está lleno
// =====================================
function tableroLleno() {
  return tablero.every(fila => fila.every(celda => celda !== null));
}

// =====================================
// 📍 Devuelve celda DOM por fila y columna
// =====================================
function obtenerCeldaDOM(fila, col) {
  return contenedorTablero.querySelector(`.celda[data-fila="${fila}"][data-col="${col}"]`);
}

// =====================================
// 🪧 Muestra mensaje final
// =====================================
function mostrarMensaje(texto) {
  if (!reiniciando && juegoFinalizado) {
    mensajeFinal.textContent = texto;
    mensajeFinal.classList.remove('oculto');
  }
}

// =====================================
// 🏆 Verifica si hay 4 en línea
// =====================================
function verificarVictoria(fila, col) {
  const color = tablero[fila][col];
  return (
    contarConsecutivos(fila, col, 0, 1, color) + contarConsecutivos(fila, col, 0, -1, color) > 2 ||
    contarConsecutivos(fila, col, 1, 0, color) + contarConsecutivos(fila, col, -1, 0, color) > 2 ||
    contarConsecutivos(fila, col, 1, 1, color) + contarConsecutivos(fila, col, -1, -1, color) > 2 ||
    contarConsecutivos(fila, col, 1, -1, color) + contarConsecutivos(fila, col, -1, 1, color) > 2
  );
}

// =====================================
// 🔍 Cuenta fichas consecutivas
// =====================================
function contarConsecutivos(fila, col, df, dc, color) {
  let count = 0;
  let f = fila + df;
  let c = col + dc;

  while (f >= 0 && f < FILAS && c >= 0 && c < COLUMNAS && tablero[f][c] === color) {
    count++;
    f += df;
    c += dc;
  }
  return count;
}

function obtenerFilaDisponible(col) {
  for (let fila = FILAS - 1; fila >= 0; fila--) {
    if (!tablero[fila][col]) {
      return fila;
    }
  }
  return -1;
}

// =====================================
// 🔁 Reiniciar juego
// =====================================
botonReiniciar.addEventListener('click', iniciarJuego);
selectorModo.addEventListener('change', iniciarJuego);
selectorDificultad.addEventListener('change', iniciarJuego);


// =====================================
// 🚀 Iniciar al cargar
// =====================================
iniciarJuego();

// =====================================
// 🎉 Confetti al ganar
// =====================================
function lanzarConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = getRandomColor();
    confetti.style.animationDuration = (1 + Math.random()) + 's';
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
}

// =====================================
// 🎨 Colores aleatorios para confetti
// =====================================
function getRandomColor() {
  const colores = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
  return colores[Math.floor(Math.random() * colores.length)];
}
