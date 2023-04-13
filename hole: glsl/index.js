(async () => {



    // ---------------------
    // Common
    // ---------------------

    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl');
    const program = createProgram();



    // ---------------------
    // Helpers
    // ---------------------

    function createShader (type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) return shader;
        const error = gl.getShaderInfoLog(shader);
        console.log(error);
        gl.deleteShader(shader);
    }

    function createProgram () {
        const vScript = document.querySelector(`script[type="x-shader/x-vertex"]`);
        const fScript = document.querySelector(`script[type="x-shader/x-fragment"]`);
        const vShader = createShader(gl.VERTEX_SHADER, vScript.textContent);
        const fShader = createShader(gl.FRAGMENT_SHADER, fScript.textContent);
        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) return program;
        const error = gl.getProgramInfoLog(program);
        console.log(error);
        gl.deleteProgram(program);
    }

    function getUniform (name) {
        return gl.getUniformLocation(program, name);
    }

    function defineAttribute (name, data, size = 2, type = gl.FLOAT, normalize = false, stride = 0, offset = 0) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
        return buffer;
    }




    defineAttribute('a_pos', new Float32Array([-1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1]))




    // ---------------------
    // Render
    // ---------------------

    const start = Date.now();
    const iResolution = getUniform('iResolution')
    const iTime = getUniform('iTime')

    function resize () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.uniform2f(iResolution, canvas.width, canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render () {
        gl.uniform1f(iTime, (Date.now() - start) / 1000);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }

    resize();
    render();
    window.addEventListener('resize', resize);



})()