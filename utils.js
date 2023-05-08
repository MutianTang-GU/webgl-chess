export async function fetchContentBuffer(url) {
  let response = await fetch(url);
  let buffer = await response.arrayBuffer();
  return buffer;
}

export async function fetchContentText(url) {
  let response = await fetch(url);
  let text = await response.text();
  return text;
}

export async function fetchContentJson(url) {
  let response = await fetch(url);
  let json = await response.json();
  return json;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} vertexShaderSource
 * @param {string} fragmentShaderSource
 * @returns {WebGLProgram}
 */
export function createShaderProgram(
  gl,
  vertexShaderSource,
  fragmentShaderSource
) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw new Error(
      "An error occurred compiling the shaders" +
        gl.getShaderInfoLog(vertexShader)
    );
  }
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw new Error(
      "An error occurred compiling the shaders" +
        gl.getShaderInfoLog(fragmentShader)
    );
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(program)
    );
  }
  return program;
}
/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {Promise<string>} vertexShaderSourcePromise
 * @param {Promise<string>} fragmentShaderSourcePromise
 * @returns {Promise<WebGLProgram>}
 */
export async function createShaderProgramAsync(
  gl,
  vertexShaderSourcePromise,
  fragmentShaderSourcePromise
) {
  const vertexShaderSource = await vertexShaderSourcePromise;
  const fragmentShaderSource = await fragmentShaderSourcePromise;
  return createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
}
/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {Float32Array} vertices
 * @param {Float32Array} normals
 * @param {Float32Array} textureCoords
 * @param {Uint16Array} indices
 * @param {string} positionAttributeName
 * @param {string} normalAttributeName
 * @param {string} textureCoordAttributeName
 * @returns {() => void}
 */
export function bufferData(
  gl,
  program,
  vertices,
  normals,
  textureCoords,
  indices,
  positionAttributeName,
  normalAttributeName,
  textureCoordAttributeName
) {
  gl.useProgram(program);
  const locations = {};
  const buffers = {};

  buffers.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  locations.positionAttributeLocation = gl.getAttribLocation(
    program,
    positionAttributeName
  );
  if (normals) {
    buffers.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    locations.normalAttributeLocation = gl.getAttribLocation(
      program,
      normalAttributeName
    );
  }
  if (textureCoords) {
    buffers.textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);
    locations.textureCoordAttributeLocation = gl.getAttribLocation(
      program,
      textureCoordAttributeName
    );
  }
  if (indices) {
    buffers.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }
  return () => {
    gl.enableVertexAttribArray(locations.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    {
      const size = 3;
      const type = gl.FLOAT;
      const normalized = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(
        locations.positionAttributeLocation,
        size,
        type,
        normalized,
        stride,
        offset
      );
    }
    if (normals) {
      gl.enableVertexAttribArray(locations.normalAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
      {
        const size = 3;
        const type = gl.FLOAT;
        const normalized = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(
          locations.normalAttributeLocation,
          size,
          type,
          normalized,
          stride,
          offset
        );
      }
    }
    if (textureCoords) {
      gl.enableVertexAttribArray(locations.textureCoordAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoordBuffer);
      {
        const size = 2;
        const type = gl.FLOAT;
        const normalized = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(
          locations.textureCoordAttributeLocation,
          size,
          type,
          normalized,
          stride,
          offset
        );
      }
    }
  };
}

export function setUniform_mat4(gl, program, name, value) {
  const location = gl.getUniformLocation(program, name);
  gl.uniformMatrix4fv(location, false, value);
}

export function setUniform_vec3(gl, program, name, value) {
  const location = gl.getUniformLocation(program, name);
  gl.uniform3fv(location, value);
}
