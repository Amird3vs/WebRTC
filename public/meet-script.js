const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
const userNames = {};

const queryParams = new URLSearchParams(window.location.search);
const user = queryParams.get('displayName');

var peer = new Peer({
    host: '127.0.0.1',
    port: '3000',
    path: '/peerjs',
    config: {
        'iceServers': [
            { url: 'stun:stun01.sipphone.com' },
            { url: 'stun:stun.ekiga.net' },
            { url: 'stun:stunserver.org' },
            {
                url: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            }
        ]
    },
    debug: 3
});

let myUserId;

function handlePeerOpen(id) {
    console.log('my id is' + id);
    myUserId = id;
    socket.emit("join-room", ROOM_ID, id, user);
    if (myVideoStream) {
        addVideoStream(myVideo, myVideoStream, myUserId);
    }
}

peer.on("open", handlePeerOpen);

let myVideoStream;
navigator.mediaDevices
    .getUserMedia({
        audio: true,
        video: true,
    })
    .then((stream) => {
        myVideoStream = stream;

        if (myUserId) {
            addVideoStream(myVideo, myVideoStream, myUserId);
        }

        peer.on("call", (call) => {
            console.log('someone call me');
            const userId = call.peer;
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream, userId);
            });
        });

        socket.on("user-connected", (userId, userName) => {
            connectToNewUser(userId, stream, userName);
        });

        socket.on("user-disconnected", (userId) => {
            if (peers[userId]) peers[userId].close()
        });

    });

window.addEventListener('beforeunload', () => {
    for (const userId in peers) {
        if (peers.hasOwnProperty(userId)) {
            const call = peers[userId];
            call.close();
        }
    }
    socket.disconnect();
});

const connectToNewUser = (userId, stream, userName) => {
    console.log('I call someone' + userId);
    const call = peer.call(userId, stream);
    userNames[userId] = userName;
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, userId);
    });

    call.on("close", () => {
        removeVideoContainer(userId);
    });

    peers[userId] = call;
};

const removeVideoContainer = (userId) => {
    const container = document.getElementById(`container-${userId}`);
    if (container) {
        container.remove();
        delete peers[userId];
    }
};

const addVideoStream = (video, stream, userId) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        let container = document.getElementById(`container-${userId}`);
        if (!container) {
            container = document.createElement("div");
            container.id = `container-${userId}`;
            container.classList.add("video-container");
            const userNameDisplay = document.createElement("div");
            userNameDisplay.innerText = userId;
            userNameDisplay.classList.add("user-name");
            container.appendChild(userNameDisplay);
            videoGrid.appendChild(container);
        }
        container.appendChild(video);
    });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".chatLogs");
let unreadMessages = 0;
let sentMessage = false;

// send.addEventListener("click", (e) => {
//   if (text.value.length !== 0) {
//     socket.emit("message", text.value);
//     text.value = "";
//     sentMessage = true;
//   }
// });

// text.addEventListener("keydown", (e) => {
//   if (e.key === "Enter" && text.value.length !== 0) {
//     socket.emit("message", text.value);
//     text.value = "";
//     sentMessage = true;
//   }
// });

const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        html = `<i class="fas fa-microphone-slash"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        html = `<i class="fas fa-microphone"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    }
});

document.querySelector(".end-call").addEventListener("click", () => {
    peer.disconnect();
    window.location.href = "https://salinsenyas.000webhostapp.com/Calls";
});

stopVideo.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        html = `<i class="fas fa-video-slash"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        html = `<i class="fas fa-video"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    }
});

function createReaction(reaction, userName) {
    const reactionContainer = document.createElement('div');
    reactionContainer.classList.add('reaction-container');

    const reactionElement = document.createElement('img');
    reactionElement.src = `img/animated-reactions/${reaction}.gif`;
    reactionElement.classList.add('reaction');

    const senderElement = document.createElement('div');
    senderElement.classList.add('reaction-name');
    senderElement.textContent = userName === user ? "Me" : userName;

    reactionContainer.appendChild(reactionElement);
    reactionContainer.appendChild(senderElement);

    const mainContainer = document.querySelector('.main-cont');
    const mainWidth = mainContainer.offsetWidth;
    const mainHeight = mainContainer.offsetHeight;
    const reactionWidth = 200;
    const reactionHeight = 200;

    let collisionDetected = false;
    let randomX, randomY;

    do {
        randomX = Math.random() * (mainWidth - reactionWidth);
        randomY = Math.random() * (mainHeight - reactionHeight);

        const existingReactions = document.querySelectorAll('.reaction-container');
        collisionDetected = Array.from(existingReactions).some((existingReaction) => {
            const existingRect = existingReaction.getBoundingClientRect();
            const newRect = {
                left: randomX,
                top: randomY,
                right: randomX + reactionWidth,
                bottom: randomY + reactionHeight,
            };
            return (
                newRect.left < existingRect.right &&
                newRect.right > existingRect.left &&
                newRect.top < existingRect.bottom &&
                newRect.bottom > existingRect.top
            );
        });
    } while (collisionDetected);

    reactionContainer.style.left = `${randomX}px`;
    reactionContainer.style.top = `${randomY}px`;

    document.getElementById('reactionsContainer').appendChild(reactionContainer);

    setTimeout(() => {
        reactionContainer.remove();
    }, 3000);
}

socket.on("receiveReaction", (reaction, userName) => {
    createReaction(reaction, userName);
});

socket.on("send-file", function ({ fileData, fileName, fileType, userName }) {
    saveFileFromBinary(fileData, fileName, fileType, userName);
});

socket.on("receive-file", function ({ fileData, fileName, fileType, userName }) {
    saveFileFromBinary(fileData, fileName, fileType, userName);
    console.log('File received');
});

let selectedFile = null;

function handleFileSelect(event) {
    const file = event.target.files[0];
    selectedFile = file;
}

function sendFile() {
    if (selectedFile) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(selectedFile);
        reader.onload = function () {
            const fileData = reader.result;
            const fileName = selectedFile.name;
            const fileType = selectedFile.type;
            const userName = user;
            const filePreview = createFilePreview(selectedFile);

            appendFilePreviewToChat(filePreview, fileName, userName);
            socket.emit("send-file", { fileData, fileName, fileType, userName });

            selectedFile = null;
            document.getElementById('fileInput').value = '';
        };
        reader.onerror = function (error) {
            console.log('Error:', error);
        };
    } else {
        console.log('No file selected');
    }
}

function createFilePreview(file) {
    if (file.type.startsWith('image/')) {
        const filePreview = document.createElement('img');
        filePreview.classList.add('file-preview');
        filePreview.file = file;
        const reader = new FileReader();
        reader.onload = (function (aImg) {
            return function (e) {
                aImg.src = e.target.result;
            };
        })(filePreview);
        reader.readAsDataURL(file);
        return filePreview;
    } else {
        const filePreview = document.createElement('div');
        filePreview.classList.add('file-preview');
        filePreview.textContent = 'File: ' + file.name;
        return filePreview;
    }
}

function appendFilePreviewToChat(filePreview, fileName, userName) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');

    const senderInfo = document.createElement('div');
    senderInfo.classList.add('sender-info');

    const senderName = document.createElement('span');
    senderName.classList.add('sender-name');
    senderName.textContent = userName === user ? "Me" : userName;

    const timeInfo = document.createElement('span');
    timeInfo.classList.add('time');
    const currentTime = new Date();
    timeInfo.textContent = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageText = document.createElement('span');
    messageText.classList.add('message-text');
    messageText.appendChild(filePreview);

    senderInfo.appendChild(senderName);
    senderInfo.appendChild(timeInfo);

    messageContainer.appendChild(senderInfo);
    messageContainer.appendChild(messageText);

    messages.appendChild(messageContainer);

    messages.scrollTop = messages.scrollHeight;
}

function saveFileFromBinary(binaryData, fileName, fileType, userName) {
    const blob = new Blob([binaryData], { type: fileType });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.textContent = fileName;
    downloadLink.style.cursor = 'pointer';

    socket.emit("file-message", fileName);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 60000);

    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');

    const senderInfo = document.createElement('div');
    senderInfo.classList.add('sender-info');

    const senderName = document.createElement('span');
    senderName.classList.add('sender-name');
    senderName.textContent = userName === user ? "Me" : userName;

    const timeInfo = document.createElement('span');
    timeInfo.classList.add('time');
    const currentTime = new Date();
    timeInfo.textContent = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageText = document.createElement('span');
    messageText.classList.add('message-text');

    messageText.appendChild(downloadLink);

    const filePreview = createFilePreview(new File([binaryData], fileName, { type: fileType }));
    messageText.appendChild(filePreview);

    senderInfo.appendChild(senderName);
    senderInfo.appendChild(timeInfo);

    messageContainer.appendChild(senderInfo);
    messageContainer.appendChild(messageText);

    messages.appendChild(messageContainer);

    messages.scrollTop = messages.scrollHeight;

    return messageContainer;
}

// let lastMessageSender = '';
// let lastMessageTime = '';
// let lastMessageContainer = null;

// socket.on("createMessage", (message, userName) => {
//   const currentTime = new Date();
//   const currentTimeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//   if (userName === lastMessageSender && currentTimeString === lastMessageTime) {
//     const messageText = document.createElement('span');
//     messageText.classList.add('message-text');
//     messageText.textContent = message;

//     lastMessageContainer.appendChild(messageText);
//   } else {
//     const messageContainer = document.createElement('div');
//     messageContainer.classList.add('message');

//     const senderInfo = document.createElement('div');
//     senderInfo.classList.add('sender-info');

//     const senderName = document.createElement('span');
//     senderName.classList.add('sender-name');
//     senderName.textContent = userName === user ? "Me" : userName;

//     const timeInfo = document.createElement('span');
//     timeInfo.classList.add('time');
//     timeInfo.textContent = currentTimeString;

//     const messageText = document.createElement('span');
//     messageText.classList.add('message-text');
//     messageText.textContent = message;

//     senderInfo.appendChild(senderName);
//     senderInfo.appendChild(timeInfo);

//     messageContainer.appendChild(senderInfo);
//     messageContainer.appendChild(messageText);

//     messages.appendChild(messageContainer);
//     lastMessageContainer = messageContainer;
//   }

//   messages.scrollTop = messages.scrollHeight;

//   if (!sentMessage) {
//     const isChatWindowOpen = document.querySelector('.main__chat_window').style.display === 'flex';
//     if (!isChatWindowOpen) {
//       updateUnreadMessageCount(unreadMessages + 1);
//     }
//   }
//   sentMessage = false;

//   lastMessageSender = userName;
//   lastMessageTime = currentTimeString;
// });

function toggleReactions() {
    const button = document.querySelector(".reactions-btn");
    const popup = document.getElementById("reactionsPopup");
    const deafPopup = document.getElementById("reactionsPopupDeaf");

    const urlParams = new URLSearchParams(window.location.search);
    const joinAs = urlParams.get('joinAs');

    if (joinAs === 'Deaf') {
        if (deafPopup.classList.contains("show")) {
            deafPopup.classList.remove("show");
            button.classList.remove("active");
        } else {
            deafPopup.classList.add("show");
            button.classList.add("active");
        }
        popup.classList.remove("show");
    } else {
        if (popup.classList.contains("show")) {
            popup.classList.remove("show");
            button.classList.remove("active");
        } else {
            popup.classList.add("show");
            button.classList.add("active");
        }
        deafPopup.classList.remove("show");
    }
}

function sendReaction(reaction) {
    const userName = user;
    createReaction(reaction, userName);
    socket.emit("reaction", reaction, userName);
}

function updateUnreadMessageCount(count) {
    unreadMessages = count;
    const chatButton = document.getElementById("chatButton");
    if (unreadMessages > 0) {
        chatButton.innerHTML = `<span class="material-symbols-outlined">mms</span> <div class="unread-messages-count">${unreadMessages}</div>`;
    } else {
        chatButton.innerHTML = `<span class="material-symbols-outlined">mms</span>`;
    }
}

function generateQRCode() {
    var meetingUrlInput = document.getElementById('meeting-url');
    var meetingUrl = meetingUrlInput.value;

    var qrCodeContainer = document.getElementById('qrcode');
    qrCodeContainer.innerHTML = '';

    var qrCode = new QRCode(qrCodeContainer, {
        text: meetingUrl,
        width: 150,
        height: 150,
        colorDark: "#000",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.H,
    });
}

document.addEventListener("DOMContentLoaded", function () {
    generateQRCode();
});

function copyMeetingUrl() {
    var meetingUrlInput = document.getElementById('meeting-url');
    meetingUrlInput.select();
    document.execCommand('copy');

    meetingUrlInput.blur();

    Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Meeting URL copied to clipboard',
        showConfirmButton: false,
        timer: 1500
    });
}

document.getElementById('listCameraDevices').addEventListener('click', listCameraDevices);
document.getElementById('listMicrophoneDevices').addEventListener('click', listMicrophoneDevices);
let cameras = [];
let microphones = [];

document.getElementById('deviceList').addEventListener('change', function () {
    const selectedCamera = this.value;

    const selectedCameraDevice = cameras.find(camera => camera.label === selectedCamera);

    if (selectedCameraDevice) {
        navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: { exact: selectedCameraDevice.deviceId }
            }
        })
            .then((stream) => {
                if (myVideo.srcObject) {
                    const tracks = myVideo.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }

                myVideo.srcObject = stream;
                myVideoStream = stream;
                myVideo.play();
            })
            .catch(err => {
                console.error('Error updating video stream:', err);
            });
    }
});

function listCameraDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            cameras = devices.filter(device => device.kind === 'videoinput');
            if (cameras.length === 0) {
                showModal('No camera devices found.');
            } else {
                const cameraNames = cameras.map(camera => camera.label);
                showModal('Available Camera Devices:', cameraNames);

                const deviceList = document.getElementById('deviceList');
                deviceList.innerHTML = '';
                cameraNames.forEach(name => {
                    const option = document.createElement('option');
                    option.textContent = name;
                    deviceList.appendChild(option);
                });

                deviceList.dispatchEvent(new Event('change'));
            }
        })
        .catch(err => {
            console.error('Error listing camera devices:', err);
            showModal('Error', 'Error listing camera devices. Please check your browser permissions.');
        });
}

function listMicrophoneDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            microphones = devices.filter(device => device.kind === 'audioinput');
            if (microphones.length === 0) {
                showModal('No microphone devices found.');
            } else {
                const microphoneNames = microphones.map(microphone => microphone.label);
                showModal('Available Microphone Devices:', microphoneNames);

                const deviceList = document.getElementById('deviceList');
                deviceList.innerHTML = '';
                microphoneNames.forEach(name => {
                    const option = document.createElement('option');
                    option.textContent = name;
                    deviceList.appendChild(option);
                });

                deviceList.dispatchEvent(new Event('change'));
            }
        })
        .catch(err => {
            console.error('Error listing microphone devices:', err);
            showModal('Error', 'Error listing microphone devices. Please check your browser permissions.');
        });
}

function showModal(title, content) {
    const modal = document.getElementById('deviceListModal');
    const modalTitle = document.getElementById('modalTitle');
    const deviceList = document.getElementById('deviceList');

    modal.style.display = 'block';
    modalTitle.textContent = title;

    deviceList.innerHTML = '';

    if (Array.isArray(content)) {
        content.forEach(item => {
            const option = document.createElement('option');
            option.textContent = item;
            deviceList.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.textContent = content;
        deviceList.appendChild(option);
    }
    document.getElementsByClassName('close')[0].onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

function toggleSection(sectionId) {
    var mainRight = document.getElementById("mainRight");
    var sections = document.querySelectorAll('.main__chat_window section');
    var buttons = document.querySelectorAll('.options__button');

    var isActive = mainRight.style.display === "flex";
    var activeSectionId = "";
    var isSectionOpen = false;

    sections.forEach(function (section) {
        if (section.style.display === "flex") {
            activeSectionId = section.classList[0];
            if (activeSectionId === sectionId) {
                isSectionOpen = true;
            }
        }
    });

    buttons.forEach(function (button) {
        button.classList.remove('active');
    });

    var activeButtonId = sectionId === 'meet-info' ? 'infoButton' : 'chatButton';
    document.getElementById(activeButtonId).classList.add('active');
    var isChatButtonActive = document.getElementById('chatButton').classList.contains('active');

    if (isActive && isSectionOpen && (activeButtonId === 'chatButton' || activeButtonId === 'infoButton')) {
        mainRight.style.display = "none";
        buttons.forEach(function (button) {
            button.classList.remove('active');
        });
        if (sectionId === 'messages') {
            updateUnreadMessageCount(0);
        }
    } else {
        if (!isActive) {
            mainRight.style.display = "flex";
            if (sectionId === 'messages') {
                updateUnreadMessageCount(0);
            }
        }
    }

    sections.forEach(function (section) {
        if (section.classList.contains(sectionId)) {
            section.style.display = 'flex';
        } else {
            section.style.display = 'none';
        }
    });
}

function updateTimeAndCode() {
    var now = new Date();

    var hours = now.getHours();
    var meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    var minutes = now.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;

    var currentTimeString = hours + ':' + minutes + ' ' + meridiem;

    var urlParts = window.location.href.split('/');
    var lastPart = urlParts[urlParts.length - 1];
    var meetingCode = lastPart.split('?')[0];

    if (meetingCode) {
        var fullContent = currentTimeString + "   |   " + meetingCode;
        document.getElementById('current-time').textContent = fullContent;

        var meetingURL = "https://salin-senyas.github.io/Join/" + meetingCode;
        document.getElementById('meeting-url').value = meetingURL;
    } else {
        document.getElementById('current-time').textContent = "Meeting Code not found | " + currentTimeString;
    }
}

async function runHandpose() {
    const net = await handpose.load();
    console.log('Handpose model loaded.');
    detectSign(net);
}

async function detectSign(net) {
    setInterval(async () => {
        const video = document.querySelector('video');
        const handData = await net.estimateHands(video);

        const userId = myUserId;
        const containerId = `container-${userId}`;
        const container = document.getElementById(containerId);

        if (handData.length > 0) {
            container.style.borderColor = '#15E8D8';
            socket.emit('gesture-detected', 'blue', containerId);

            const Handsigns = await importHandsigns();

            const GE = new fp.GestureEstimator(Object.values(Handsigns));
            const gesture = GE.estimate(handData[0].landmarks, 8.5);
            const mostConfidentPrediction = gesture.gestures[0];

            if (mostConfidentPrediction) {
                socket.emit('recognized-gesture', mostConfidentPrediction.name);
                console.log('Recognized gesture:', mostConfidentPrediction.name);
            }
        } else {
            container.style.borderColor = 'rgba(220, 220, 220, 0.1)';
        }
    }, 100);
}

async function importHandsigns() {
    const handsignsDir = '/handsigns';

    const files = await fetchHandsigns(handsignsDir);

    const handsignsPaths = files.map(file => `${handsignsDir}/${file}`);

    const Handsigns = await Promise.all(handsignsPaths.map(async filePath => {
        const module = await import(filePath);
        const gesture = module.aSign;
        return gesture;
    }));

    return Handsigns;
}

async function fetchHandsigns(dir) {
    const response = await fetch(dir);
    const files = await response.text();
    return files.split('\n').filter(file => file.trim() !== '');
}

socket.on('receive-gesture', (gesture, containerId) => {
    console.log(`Received gesture "${gesture}" for container ${containerId}`);
    const container = document.getElementById(containerId);
    if (container) {
        if (gesture === 'blue') {
            container.style.borderColor = '#15E8D8';
        } else {
            container.style.borderColor = 'rgba(220, 220, 220, 0.1)';
        }
    } else {
        console.error(`Container with id ${containerId} not found.`);
    }
});

runHandpose();
updateTimeAndCode();
setInterval(updateTimeAndCode, 1000);