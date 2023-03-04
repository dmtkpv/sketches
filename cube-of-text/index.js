(() => {



    // ---------------------
    // Common
    // ---------------------

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const program = createProgram();

    const u_perspective = gl.getUniformLocation(program, 'u_perspective');
    const u_scene_scale = gl.getUniformLocation(program, 'u_scene_scale');
    const u_scene_ratio = gl.getUniformLocation(program, 'u_scene_ratio');
    const u_texture_scale = gl.getUniformLocation(program, 'u_texture_scale');
    const u_texture_ratio = gl.getUniformLocation(program, 'u_texture_ratio');
    const u_point = gl.getUniformLocation(program, 'u_point');
    const u_origin = gl.getUniformLocation(program, 'u_origin');
    const u_rotateX = gl.getUniformLocation(program, 'u_rotateX');
    const u_rotateY = gl.getUniformLocation(program, 'u_rotateY');
    const u_offsetX = gl.getUniformLocation(program, 'u_offsetX');
    const u_offsetY = gl.getUniformLocation(program, 'u_offsetY');

    const texture = createTexture();
    const slices = createSlices();

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);



    // ---------------------
    // GL Helpers
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

    function defineAttribute (program, name, data, size = 2, type = gl.FLOAT, normalize = false, stride = 0, offset = 0) {
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }



    // ---------------------
    // Texture
    // ---------------------

    function createTexture () {

        const padding = 4;

        const fonts = {
            'Serif': '"Georgia", serif',
            'Sans-serif': '"Verdana", sans-serif',
            'Monospaced': '"Courier New", monospace'
        }

        function write ({ text = 'Hello WebGL!', font = fonts.Serif }) {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d');
            const size = 64;
            text = text.slice(-20);
            ctx.font = `${size}px ${font}`;
            canvas.width  = ctx.measureText(text).width + padding * 2;
            canvas.height = size + padding * 2;
            ctx.font = `${size}px ${font}`;
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFF';
            ctx.fillText(text, padding, padding);
            defineTexture(canvas);
            gl.uniform2f(u_texture_ratio, 1, canvas.height / canvas.width);
        }

        defineAttribute(program, 'a_texture', new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
        defineAttribute(program, 'a_position', new Float32Array([-1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1]));

        return {
            fonts,
            write
        }

    }



    // ---------------------
    // Slices
    // ---------------------

    function createSlices () {

        const perX = 5;
        const perY = 12;
        const slices = [];
        const pow = Math.pow(2, .5);

        function getVal (i, per) {
            return per > 1 ? pow / (per - 1) * i - pow / 2 : 0;
        }

        for (let ix = 0; ix < perX; ix++) {

            const x = getVal(ix, perX);
            const rotation = 0;
            const origin = [x, 0, 0];
            const points = [];

            for (let iy = 0; iy < perY; iy++) {
                const y = getVal(iy, perY);
                for (let iz = 0; iz < perY; iz++) {
                    const z = getVal(iz, perY)
                    points.push([x, y, z]);
                }
            }

            slices.push({
                x,
                points,
                origin,
                rotation
            });

        }

        return slices;

    }



    // ---------------------
    // Settings
    // ---------------------

    const settings = new Proxy({}, {
        set (target, prop, value) {
            target[prop] = value;
            if (prop === 'scale') gl.uniform1f(u_texture_scale, value);
            if (prop === 'perspective') gl.uniform1f(u_perspective, value);
            if (prop === 'font' || prop === 'text') texture.write(target);
            return true;
        }
    })

    settings.font = texture.fonts['Sans-serif'];
    settings.text = 'Hello WebGL!';
    settings.scale = .12;
    settings.perspective = 2;

    const gui = new dat.GUI();
    gui.add(settings, 'font', texture.fonts);
    gui.add(settings, 'text');
    gui.add(settings, 'scale', .04, .16, 0.01);
    gui.add(settings, 'perspective', .4, 3, 0.1);



    // ---------------------
    // Animation
    // ---------------------

    const animation = new Proxy({}, {
        set (target, prop, value) {
            if (prop === 'scale') gl.uniform1f(u_scene_scale, value);
            if (prop === 'offsetX') gl.uniform1f(u_offsetX, value);
            if (prop === 'offsetY') gl.uniform1f(u_offsetY, value);
            if (prop === 'rotateY') gl.uniform1f(u_rotateY, value);
            target[prop] = value;
            return true;
        }
    })

    const duration = 3;
    const tl = gsap.timeline({ repeat: -1 });

    tl.set(animation, {
        scale: .5,
        offsetY: -1,
        offsetX: 0,
        rotateY: 0,
    }, 0)

    tl.to(animation, {
        scale: .8,
        ease: 'power2.out',
        duration,
    }, 0)

    tl.to(animation, {
        offsetY: 0,
        ease: 'power1.out',
        duration: duration * .5,
    }, 0)

    tl.to(animation, {
        offsetX: 1,
        ease: 'power1.inOut',
        duration: duration * .3
    }, duration * .7)

    tl.set(animation, {
        offsetY: 0,
        offsetX: 1,
        rotateY: Math.PI / 6
    }, duration)

    tl.to(animation, {
        offsetX: 0,
        ease: 'power1.out',
        duration: duration * .5
    }, duration)

    tl.to(animation, {
        offsetX: -1,
        ease: 'power1.in',
        duration: duration * .5
    }, duration * 1.5)

    tl.to(animation, {
        rotateY: 0,
        ease: 'power1.out',
        duration: duration * .5
    }, duration)

    tl.to(animation, {
        rotateY: -Math.PI / 6,
        ease: 'power1.in',
        duration: duration * .5
    }, duration * 1.5)


    slices.forEach(slice => {

        const direction = slice.x < 0 ? -1 : 1;
        const rotation = slice.x * 2 + Math.PI / 6 * direction;

        tl.set(slice, {
            rotation
        }, 0)

        tl.to(slice, {
            rotation: 0,
            ease: 'power2.out',
            duration
        }, 0)

        tl.set(slice, {
            rotation
        }, duration)

        tl.to(slice, {
            rotation: 0,
            ease: 'power1.out',
            duration: duration * .5
        }, duration)

        tl.to(slice, {
            rotation: rotation * -1,
            ease: 'power1.in',
            duration: duration * .5
        }, duration * 1.5)

    })



    // ---------------------
    // Render
    // ---------------------

    function render () {

        gl.clear(gl.COLOR_BUFFER_BIT);

        slices.forEach(slice => {

            gl.uniform3fv(u_origin, slice.origin);
            gl.uniform1f(u_rotateX, slice.rotation);

            slice.points.forEach(point => {
                gl.uniform3fv(u_point, point);
                gl.drawArrays(gl.TRIANGLES, 0, 6)
            })

        })

        requestAnimationFrame(render);

    }



    // ---------------------
    // Resize
    // ---------------------

    function resize () {

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const rx = Math.min(canvas.height / canvas.width, 1);
        const ry = Math.min(canvas.width / canvas.height, 1);

        gl.uniform2f(u_scene_ratio, rx, ry);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    }



    // ---------------------
    // Run
    // ---------------------

    document.body.append(canvas);
    window.addEventListener('resize', resize);
    resize();
    render();



})()