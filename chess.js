import {
  fetchContentJson,
  fetchContentText,
  createShaderProgramAsync,
  bufferData,
  setUniform_mat4,
  setUniform_vec3,
} from "./utils.js";
import { Checkerboard } from "./pieces.js";
import { mat4 } from "gl-matrix";

class Chess {
  constructor() {
    this.checkerboard = new Checkerboard();
    this.cameraAngles = [0, Math.PI / 4];
    this.atTopView = false;
    /** @type {[number, number] | null} */
    this.gridSelected = null;
  }

  position(x, y) {
    return [8.3 - x * 0.95, 8.45 - y * 0.95, 0.01];
  }

  preFetchResources() {
    this.resources = {
      chessObjPromise: fetchContentJson("./assets/objects/chess-pieces.json"),
      pieceVertexShaderPromise: fetchContentText(
        "./assets/shaders/piece-vert.glsl"
      ),
      pieceFragmentShaderPromise: fetchContentText(
        "./assets/shaders/piece-frag.glsl"
      ),
      boardVertexShaderPromise: fetchContentText(
        "./assets/shaders/board-vert.glsl"
      ),
      boardFragmentShaderPromise: fetchContentText(
        "./assets/shaders/board-frag.glsl"
      ),
      // textureImagePromise: fetchContentBuffer("./assets/textures/board.jpg"),
    };
  }

  init() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("gl-canvas");
    /** @type {WebGL2RenderingContext} */
    const gl = canvas.getContext("webgl2");
    if (gl === null) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    const pieceShaderProgramPromise = createShaderProgramAsync(
      gl,
      this.resources.pieceVertexShaderPromise,
      this.resources.pieceFragmentShaderPromise
    );
    const boardShaderProgramPromise = createShaderProgramAsync(
      gl,
      this.resources.boardVertexShaderPromise,
      this.resources.boardFragmentShaderPromise
    );
    this.gl = gl;
    this.program = { pieceShaderProgramPromise, boardShaderProgramPromise };

    const textureImage = new Image();
    const textureImagePromise = new Promise(resolve => {
      textureImage.addEventListener("load", () => resolve(textureImage));
    });
    textureImage.src = "./assets/textures/board.jpg";
    /** @type {Promise<HTMLImageElement>} */
    this.textureImagePromise = textureImagePromise;
  }

  fetchResources() {
    return Promise.all([
      this.resources.chessObjPromise,
      this.program.pieceShaderProgramPromise,
      this.program.boardShaderProgramPromise,
      this.textureImagePromise,
    ]);
  }

  createObjects(resources) {
    const gl = this.gl;
    const [chessObj, pieceShaderProgram, boardShaderProgram, textureImage] =
      resources;
    // board
    gl.useProgram(boardShaderProgram);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    {
      const level = 0;
      const internalFormat = gl.RGBA;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        textureImage
      );
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);

    const bindBoard = bufferData(
      gl,
      boardShaderProgram,
      new Float32Array([0, 0, 0, 0, 8, 0, 8, 8, 0, 8, 0, 0]),
      null,
      new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]),
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      "vertPosition",
      null,
      "texCoord"
    );

    // pieces
    gl.useProgram(pieceShaderProgram);
    const pieces = chessObj.meshes;
    const verticesConcat = pieces.map(piece => piece.vertices).flat();
    const originsList = pieces.map(piece =>
      piece.vertices.slice(0, 3).map(x => -x)
    );
    const normalsConcat = pieces.map(piece => piece.normals).flat();
    const offsets = [];
    let vertexOffset = 0;
    let indexOffset = 0;
    const indicesConcat = pieces
      .map(piece => {
        const indices = piece.faces.flat().map(x => x + vertexOffset);
        vertexOffset += piece.vertices.length / 3;
        indexOffset += piece.faces.length * 3;
        offsets.push(indexOffset);
        return indices;
      })
      .flat();
    const bindPiece = bufferData(
      gl,
      pieceShaderProgram,
      new Float32Array(verticesConcat),
      new Float32Array(normalsConcat),
      null,
      new Uint16Array(indicesConcat),
      "vertPosition",
      "vertNormal",
      null
    );

    setUniform_vec3(gl, pieceShaderProgram, "lightPosition", [-10, 10, 10]);
    const setPieceWhite = () => {
      setUniform_vec3(
        gl,
        pieceShaderProgram,
        "ambientLightColor",
        [0.5, 0.5, 0.5]
      );
      setUniform_vec3(
        gl,
        pieceShaderProgram,
        "diffuseLightColor",
        [0.8, 0.8, 0.8]
      );
      setUniform_vec3(gl, pieceShaderProgram, "specularLightColor", [1, 1, 1]);
    };
    const setPieceBlack = () => {
      setUniform_vec3(
        gl,
        pieceShaderProgram,
        "ambientLightColor",
        [0.2, 0.2, 0.2]
      );
      setUniform_vec3(
        gl,
        pieceShaderProgram,
        "diffuseLightColor",
        [0.3, 0.3, 0.3]
      );
      setUniform_vec3(gl, pieceShaderProgram, "specularLightColor", [1, 1, 1]);
    };

    this.programInfo = {
      pieceShaderProgram,
      boardShaderProgram,
      bindBoard,
      bindPiece,
      pieceOffsets: offsets,
      pieceOrigins: originsList,
      setPieceWhite,
      setPieceBlack,
    };
  }

  resetCamera() {
    const [originLongitude, originLatitude] = this.cameraAngles;
    const targetLongitude = 0;
    const targetLatitude = Math.PI / 2 - 0.01;
    let percentage = 0;
    let then = null;
    let resolve;
    const promise = new Promise(r => (resolve = r));
    const draw = time => {
      if (percentage >= 1) {
        this.cameraAngles = [targetLongitude, targetLatitude];
        this.draw();
        resolve();
        return;
      }
      if (then === null) {
        then = time;
      }
      const now = time;
      const deltaTime = now - then;
      then = now;
      percentage += deltaTime * 0.0005;

      this.cameraAngles = [
        originLongitude + (targetLongitude - originLongitude) * percentage,
        originLatitude + (targetLatitude - originLatitude) * percentage,
      ];

      this.draw();
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    return promise;
  }

  movePieceAnimate(x, y, newX, newY) {
    const animate = this.checkerboard.movePieceAnimate(x, y, newX, newY);
    let percentage = 0;
    let then = null;
    const draw = time => {
      if (percentage >= 1) {
        animate(1);
        this.draw();
        return;
      }
      if (then === null) {
        then = time;
      }
      const now = time;
      const deltaTime = now - then;
      then = now;
      percentage += deltaTime * 0.0005;
      animate(percentage);
      this.draw();
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  mouseClicked(x, y) {
    const gridX = Math.floor((x - 120) / 50);
    const gridY = Math.floor((y - 20) / 50);
    if (gridX < 0 || gridX > 7 || gridY < 0 || gridY > 7) {
      return;
    }
    const boardX = gridX + 1;
    const boardY = 8 - gridY;
    this.boardClicked(boardX, boardY);
  }

  boardClicked(x, y) {
    if (this.gridSelected === null) {
      if (this.checkerboard.getPieceIndex(x, y) === -1) {
        return;
      }
      this.gridSelected = [x, y];
      this.draw();
      return;
    }
    if (this.gridSelected[0] === x && this.gridSelected[1] === y) {
      // deselect
      this.gridSelected = null;
      this.draw();
      return;
    }
    this.movePieceAnimate(this.gridSelected[0], this.gridSelected[1], x, y);
    this.gridSelected = null;
  }

  addControllers() {
    const longitudeController = document.getElementById("vertical-controller");
    const latitudeController = document.getElementById("horizontal-controller");
    const chessControlBtn = document.getElementById("chess-control");
    const canvas = document.getElementById("gl-canvas");

    chessControlBtn.addEventListener("click", e => {
      this.resetCamera().then(() => {
        canvas.classList.remove("forbidden");
        this.atTopView = true;
      });
      longitudeController.value = 89;
      latitudeController.value = 0;
    });

    longitudeController.addEventListener("input", e => {
      canvas.classList.add("forbidden");
      this.atTopView = false;
      this.cameraAngles[1] = (e.target.value / 180) * Math.PI;
      this.draw();
    });

    latitudeController.addEventListener("input", e => {
      canvas.classList.add("forbidden");
      this.atTopView = false;
      this.cameraAngles[0] = (e.target.value / 180) * Math.PI;
      this.draw();
    });

    const canvasRect = canvas.getBoundingClientRect();
    canvas.addEventListener("click", e => {
      if (!this.atTopView) {
        return;
      }
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      this.mouseClicked(x, y);
    });
  }

  draw() {
    const gl = this.gl;
    const {
      pieceShaderProgram,
      boardShaderProgram,
      bindBoard,
      bindPiece,
      pieceOffsets,
      pieceOrigins,
      setPieceWhite,
      setPieceBlack,
    } = this.programInfo;
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // camera
    const projectionMatrix = mat4.create();
    {
      const fieldOfView = (45 * Math.PI) / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.1;
      const zFar = 50.0;
      mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    }

    const [cameraLongitude, cameraLatitude] = this.cameraAngles;

    const cameraMatrix = mat4.create();
    mat4.lookAt(
      cameraMatrix,
      [
        4 + 10 * Math.sin(cameraLongitude) * Math.cos(cameraLatitude),
        4 + 10 * Math.cos(cameraLongitude) * Math.cos(cameraLatitude),
        1 + 10 * Math.sin(cameraLatitude),
      ],
      [4, 4, 0],
      [0, 0, 1]
    );

    mat4.multiply(projectionMatrix, projectionMatrix, cameraMatrix);
    0;
    gl.useProgram(boardShaderProgram);
    setUniform_mat4(gl, boardShaderProgram, "projMatrix", projectionMatrix);
    bindBoard();
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(pieceShaderProgram);
    setUniform_mat4(gl, pieceShaderProgram, "projMatrix", projectionMatrix);
    // setUniform_mat4(gl, pieceShaderProgram, "viewMatrix", modelViewMatrix);

    // gl.drawElements(gl.TRIANGLES, this.length, gl.UNSIGNED_SHORT, 0);
    const pieceScale = visible => [3.5 * visible, 3.5 * visible, 3.5 * visible];

    bindPiece();
    setPieceWhite();
    for (let i = 0; i < 16; i++) {
      const [x, y, visible] = this.checkerboard.positions[i];
      if (visible === 0) continue;

      const modelViewMatrix = mat4.create();
      mat4.translate(modelViewMatrix, modelViewMatrix, this.position(x, y));
      mat4.scale(modelViewMatrix, modelViewMatrix, pieceScale(visible));
      mat4.translate(modelViewMatrix, modelViewMatrix, pieceOrigins[i]);
      setUniform_mat4(gl, pieceShaderProgram, "viewMatrix", modelViewMatrix);
      const previousOffset = pieceOffsets[i - 1] || 0;
      const length = pieceOffsets[i] - previousOffset;
      gl.drawElements(
        gl.TRIANGLES,
        length,
        gl.UNSIGNED_SHORT,
        previousOffset * 2
      );
    }
    setPieceBlack();
    for (let i = 0; i < 16; i++) {
      const [x, y, visible] = this.checkerboard.positions[i + 16];
      if (visible === 0) continue;

      const modelViewMatrix = mat4.create();
      mat4.translate(modelViewMatrix, modelViewMatrix, this.position(x, y));
      mat4.scale(modelViewMatrix, modelViewMatrix, pieceScale(visible));
      mat4.translate(modelViewMatrix, modelViewMatrix, pieceOrigins[i]);
      setUniform_mat4(gl, pieceShaderProgram, "viewMatrix", modelViewMatrix);
      const previousOffset = pieceOffsets[i - 1] || 0;
      const length = pieceOffsets[i] - previousOffset;
      gl.drawElements(
        gl.TRIANGLES,
        length,
        gl.UNSIGNED_SHORT,
        previousOffset * 2
      );
    }
  }

  clearLoadingText() {
    document.getElementById("loading-text").remove();
  }
}

async function main() {
  if (window.location.protocol === "file:") {
    const errorMessage =
      "This example requires a web server to load the model. Please run this example from a web server.";

    alert(errorMessage);
    throw new Error(errorMessage);
  }
  const chess = new Chess();
  chess.preFetchResources();
  chess.init();
  const resources = await chess.fetchResources();
  chess.createObjects(resources);
  chess.draw();
  chess.addControllers();
  chess.clearLoadingText();
}

if (document.readyState !== "loading") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}
