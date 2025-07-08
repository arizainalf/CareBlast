module.exports = {
    apps: [{
        name: 'careblast',
        script: 'bin/server.js',
        cwd: './build',  // Jika file server ada di folder `build`
        args: '--production',
        autorestart: true,
        watch: false,
        env: {
            NODE_ENV: 'production',
            PORT: 3333  // Sesuaikan port
        }
    }]
}