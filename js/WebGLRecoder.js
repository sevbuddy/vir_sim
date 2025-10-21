let mediaRecorder;
let recordedBlobs;
let canvas;
let stream;

function ScreenShot(fileName) {
	console.log('ScreenShot', fileName);
	canvas = document.querySelector('canvas');
	console.log(typeof(canvas));
	console.log(canvas);
	var dataURL = canvas.toDataURL('image/png');
	var a = document.createElement("a");
	a.style.display = 'none';
	a.href = dataURL;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	setTimeout(() =>{
		document.body.removeChild(a);
		//window.URL.revokeObjectURL(url);
	},
	100);
	console.log('ScreenShot', dataURL);
}


function handleDataAvailable(event) {
	if (event.data && event.data.size > 0) {
		recordedBlobs.push(event.data);
		console.log('收到数据块', event.data.size, 'B');
	} else {
		console.warn('数据块为空！');
	}
}

function handleStop(event) {
	console.log('Recorder stopped: ', event);
	const blob = new Blob(recordedBlobs, { type: 'video/webm' });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = 'canvas_' + Date.now() + '.webm';
	document.body.appendChild(a);
	a.click();
	setTimeout(() => {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 100);
	console.log('录屏文件已下载');
}

function findCanvas() {
	// 1. 当前 document
	let c = document.querySelector('canvas');
	if (c) return c;

	// 2. 所有 iframe 内部
	const frames = document.querySelectorAll('iframe');
	for (let i = 0; i < frames.length; i++) {
		try {
			c = frames[i].contentDocument.querySelector('canvas');
			if (c) return c;
		} catch (e) {
			// 跨域会抛异常，跳过
		}
	}
	return null;
}

function StartRecording () {
	canvas = findCanvas();
	if (!canvas) {
		console.error('无论哪里都找不到 canvas！');
		return;
	}
	console.log('找到 canvas', canvas);

	// 继续剩余逻辑
	stream = canvas.captureStream(30);
	console.log('流状态', stream.getVideoTracks()[0].readyState);

	canvas = document.querySelector('canvas');
	stream = canvas.captureStream(30); // frames per second， 30fps
	let options = {mimeType: 'video/webm'};
	recordedBlobs = [];
	try {
		mediaRecorder = new MediaRecorder(stream, options);
	} catch(e0) {
		console.log('Unable to create MediaRecorder with options Object: ', e0);
		try {
			options = {
				mimeType: 'video/webm,codecs=vp9'
			};
			mediaRecorder = new MediaRecorder(stream, options);
		} catch(e1) {
			console.log('Unable to create MediaRecorder with options Object: ', e1);
			try {
				options = 'video/vp8'; // Chrome 47
				mediaRecorder = new MediaRecorder(stream, options);
			} catch(e2) {
				alert('MediaRecorder is not supported by this browser.\n\n' + 'Try Firefox 29 or later, or Chrome 47 or later, ' + 'with Enable experimental Web Platform features enabled from chrome://flags.');
				console.error('Exception while creating MediaRecorder:', e2);
				return;
			}
		}
	}
	console.log('Created MediaRecorder', mediaRecorder, 'with MIME_TYPE', options);
	mediaRecorder.onstop = handleStop;
	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.start(100); // collect 100ms of data
	console.log('MediaRecorder started', mediaRecorder);
}

function StopRecording () {
	console.log("WebGLRecoder: Stopping recording"),
	mediaRecorder.stop();
}

function RecordDownload (fileName) {
	console.log('RecordDownload');
	const blob = new Blob(recordedBlobs, {
		type: 'video/webm'
	});
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	//a.download = 'test.webm';
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	setTimeout(() =>{
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	},
	100);
}