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

    function load (src) {
        return new Promise(resolve => {
            const image = new Image();
            image.src = src;
            image.onload = () => resolve(image);
        })
    }

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

    function defineTexture (image) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }




    // ---------------------
    // Funnel
    // ---------------------

    function createFunnel (tsz) {

        const position = [];
        const texture = [];
        const zLength = 20;
        const aLength = 20;
        const zStep = 1 / zLength;
        const aStep = Math.PI * 2 / aLength;
        const scale = z => 1 - Math.sqrt(z);

        for (let zi = 0; zi < zLength; zi++) {

            const z1 = 1 - zStep * zi;
            const z2 = 1 - zStep * (zi + 1);
            const r1 = scale(z1);
            const r2 = scale(z2);

            for (let ai = 0; ai < aLength; ai++) {

                const a1 = aStep * ai;
                const a2 = aStep * (ai + 1);
                const x1 = Math.cos(a1);
                const y1 = Math.sin(a1);
                const x2 = Math.cos(a2);
                const y2 = Math.sin(a2);

                position.push(
                    x1 * r1, y1 * r1, z1,
                    x1 * r2, y1 * r2, z2,
                    x2 * r1, y2 * r1, z1,
                    x2 * r1, y2 * r1, z1,
                    x1 * r2, y1 * r2, z2,
                    x2 * r2, y2 * r2, z2,
                )

                const tx1 = 1 - ai / aLength;
                const tx2 = 1 - (ai + 1) / aLength;
                const ty1 = z1 * tsz;
                const ty2 = z2 * tsz;

                texture.push(
                    tx1, ty1,
                    tx1, ty2,
                    tx2, ty1,
                    tx2, ty1,
                    tx1, ty2,
                    tx2, ty2,
                )

            }
        }

        return { position, texture }

    }




    // ---------------------
    // Setup
    // ---------------------

    const image = await load('./text.png');
    const vertices = createFunnel(image.width / image.height);
    defineAttribute('a_position', new Float32Array(vertices.position), 3);
    defineAttribute('a_texture', new Float32Array(vertices.texture));
    defineTexture(image);




    // ---------------------
    // Bend
    // ---------------------

    (() => {

        const max = Math.PI / 2;
        const uniform = getUniform('u_bend');

        const state = {
            x: max,
            y: 0
        }

        const options = {
            duration: 1,
            ease: 'power2.out',
            onUpdate () {
                gl.uniform2f(uniform, state.x, state.y);
            }
        }

        window.addEventListener('mousemove', event => {
            const x = (event.clientY / window.innerHeight * 2 - 1) * max;
            const y = (event.clientX / window.innerWidth * 2 - 1) * max;
            gsap.killTweensOf(state);
            gsap.to(state, { ...options, x, y });
        });

        gsap.to(state, {
            x: -max,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut',
            duration: 2,
            onUpdate: options.onUpdate
        });

    })();



    // ---------------------
    // Render
    // ---------------------

    function render () {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.position.length / 3);
        requestAnimationFrame(render);
    }

    render();



})()