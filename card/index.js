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
            image.crossOrigin = 'anonymous';
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        return texture;
    }

    function getTextureUv (n = 1) {
        return [0, 0, 0, n, n, n, n, n, n, 0, 0, 0]
    }


    // ---------------------
    // Plane
    // ---------------------

    function createPlane (width, height) {

        const w = width / 2, h = height / 2;

        let points = [
            [-w,  h, 0],
            [-w, -h, 0],
            [ w, -h, 0],
            [ w,  h, 0],
        ]

        return {

            translateX (val) {
                points.forEach(point => point[0] += val);
                return this;
            },

            translateY (val) {
                points.forEach(point => point[1] += val);
                return this;
            },

            translateZ (val) {
                points.forEach(point => point[2] += val);
                return this;
            },

            rotateX (a) {
                const sin = Math.sin(a), cos = Math.cos(a);
                points = points.map(([x, y, z]) => [x, y * cos - z * sin, y * sin + z * cos]);
                return this;
            },

            rotateY (a) {
                const sin = Math.sin(a), cos = Math.cos(a);
                points = points.map(([x, y, z]) => [x * cos + z * sin, y, x * sin + z * cos]);
                return this;
            },

            get positions () {
                const [a, b, c, d] = points;
                return [a, b, c, c, d, a].flat();
            }

        }

    }



    // ---------------------
    // Frame
    // ---------------------

    async function createFrame () {

        const positions = [
            ...createPlane(2, 2).rotateX(Math.PI / 2).translateY(-1).positions,
            ...createPlane(2, 2).rotateX(-Math.PI / 2).translateY(1).positions,
            ...createPlane(2, 2).rotateY(-Math.PI / 2).translateX(1).positions,
            ...createPlane(2, 2).rotateY(Math.PI / 2).translateX(-1).positions,
        ]

        const image = await load('./frame.png');
        const texture = defineTexture(image);
        const uv = Array(4).fill(getTextureUv(32)).flat();

        function render (first = 0) {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.drawArrays(gl.TRIANGLES, first, positions.length / 3);
        }

        return {
            uv,
            positions,
            render
        }

    }



    // ---------------------
    // Depth
    // ---------------------

    async function createDepth () {

        const length = 20;

        const positions = Array(length).fill().map((_, i, { length }) => {
            const z = -1 + i / (length - 1) * 2;
            return createPlane(2, 2).translateZ(z).positions;
        }).flat();

        const image = await load('./image.png');
        const texture = defineTexture(image);
        const uv = Array(length).fill(getTextureUv()).flat();

        function render (first = 0) {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.drawArrays(gl.TRIANGLES, first, positions.length / 3);
        }

        return {
            uv,
            positions,
            render
        }

    }



    // ---------------------
    // Setup
    // ---------------------

    const frame = await createFrame();
    const depth = await createDepth();

    defineAttribute('a_pos', new Float32Array([...frame.positions, ...depth.positions]), 3);
    defineAttribute('a_tex', new Float32Array([...frame.uv, ...depth.uv]));




    // ---------------------
    // Render
    // ---------------------

    function render () {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        frame.render();
        depth.render(frame.positions.length / 3);
        requestAnimationFrame(render);
    }

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    // gl.enable(gl.CULL_FACE);
    // gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(1, 1, 1, 1);
    render();



    // ---------------------
    // Hover
    // ---------------------

    (() => {

        const uniform = getUniform('u_rotation');

        const state = {
            x: 0,
            y: 0,
        }

        const options = {
            duration: 2,
            // repeat: -1,
            ease: 'power2.out',
            onUpdate () {
                gl.uniform2f(uniform, state.x, state.y);
            }
        }

        canvas.addEventListener('mouseenter', () => {
            gsap.killTweensOf(state);
            gsap.to(state, { ...options, x: Math.PI / 6, y: Math.PI / 6 });
        })

        canvas.addEventListener('mouseleave', () => {
            gsap.killTweensOf(state);
            gsap.to(state, { ...options, x: 0 , y: 0});
        })

    })();


})()