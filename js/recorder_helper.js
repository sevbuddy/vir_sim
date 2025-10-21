// recorder_help.js - 浏览器端录屏辅助
(function () {
    let mediaRecorder = null;
    let recordedBlobs = [];
    let canvas = null;
    let stream = null;

    // 万能找 canvas（含 iframe）
    function findCanvas() {
        let c = document.querySelector('canvas');
        if (c) return c;
        const frames = document.querySelectorAll('iframe');
        for (let i = 0; i < frames.length; i++) {
            try { c = frames[i].contentDocument.querySelector('canvas'); if (c) return c; } catch (e) { }
        }
        return null;
    }

    // 延迟启动，确保 canvas 已创建
    function startRecordNow() {
        canvas = findCanvas();
        if (!canvas) {
            console.warn('[recorder_helper] canvas 未就绪，1 秒后重试');
            setTimeout(startRecordNow, 1000);
            return;
        }
        console.log('[recorder_helper] 找到 canvas', canvas);

        stream = canvas.captureStream(30); // 30 fps
        const readyState = stream.getVideoTracks()[0]?.readyState;
        console.log('[recorder_helper] 流 readyState', readyState);
        if (readyState !== 'live') {
            console.error('[recorder_helper] 流不是 live，放弃录制');
            return;
        }

        const options = { mimeType: 'video/webm' };
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.error('[recorder_helper] 创建 MediaRecorder 失败', e);
            return;
        }

        recordedBlobs = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedBlobs.push(event.data);
                console.log('[recorder_helper] 收到数据块', event.data.size, 'B');
            }
        };

        mediaRecorder.onstop = () => {
            console.log('[recorder_helper] 录制结束，开始下载');
            const blob = new Blob(recordedBlobs, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'canvas_' + Date.now() + '.webm';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        };

        mediaRecorder.start(200);
        console.log('[recorder_helper] MediaRecorder 开始录制');
    }

    function stopRecordNow() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
            console.log('[recorder_helper] MediaRecorder 已停止');
        } else {
            console.warn('[recorder_helper] 没有正在进行的录制');
        }
    }

    // 暴露给全局，供 Unity 外部调用
    window.startRecordNow = startRecordNow;
    window.stopRecordNow = stopRecordNow;
})();