import { aSign } from './handsigns/Asign.js';
import { bSign } from './handsigns/Bsign.js';
import { cSign } from './handsigns/Csign.js';
import { dSign } from './handsigns/Dsign.js';
import { eSign } from './handsigns/Esign.js';
import { fSign } from './handsigns/Fsign.js';
import { gSign } from './handsigns/Gsign.js';
import { hSign } from './handsigns/Hsign.js';
import { iSign } from './handsigns/Isign.js';
import { jSign } from './handsigns/Jsign.js';
import { kSign } from './handsigns/Ksign.js';
import { lSign } from './handsigns/Lsign.js';
import { mSign } from './handsigns/Msign.js';
import { nSign } from './handsigns/Nsign.js';
import { oSign } from './handsigns/Osign.js';
import { pSign } from './handsigns/Psign.js';
import { qSign } from './handsigns/Qsign.js';
import { rSign } from './handsigns/Rsign.js';
import { sSign } from './handsigns/Ssign.js';
import { tSign } from './handsigns/Tsign.js';
import { uSign } from './handsigns/Usign.js';
import { vSign } from './handsigns/Vsign.js';
import { wSign } from './handsigns/Wsign.js';
import { xSign } from './handsigns/Xsign.js';
import { ySign } from './handsigns/Ysign.js';
import { zSign } from './handsigns/Zsign.js';

async function runHandpose() {
    const net = await handpose.load();
    console.log('Handpose model loaded.');
    Swal.fire({
        icon: 'success',
        title: 'ChismiSign',
        text: 'Handpose Model Loaded!',
        showConfirmButton: false,
        timer: 1000
    });
    detectSign(net);
}

async function detectSign(net) {
    let letters = [];
    let letterAccumulation = true;

    setInterval(async () => {
        const video = document.querySelector('video');
        const handData = await net.estimateHands(video);

        const userId = myUserId;
        const containerId = `container-${userId}`;
        const container = document.getElementById(containerId);

        if (handData.length > 0) {
            container.style.borderColor = '#15E8D8';
            socket.emit('gesture-detected', 'blue', containerId);

            const GE = new fp.GestureEstimator([
                aSign, bSign, cSign, dSign, eSign, fSign, gSign, hSign, iSign, jSign,
                kSign, lSign, mSign, nSign, oSign, pSign, qSign, rSign, sSign, tSign,
                uSign, vSign, wSign, xSign, ySign, zSign
            ]);

            const gesture = GE.estimate(handData[0].landmarks, 8.5);
            const mostConfidentPrediction = gesture.gestures[0];

            if (mostConfidentPrediction) {
                socket.emit('recognized-gesture', mostConfidentPrediction.name);

                if (letterAccumulation) {
                    letters.push(mostConfidentPrediction.name);
                }

                if (letters.length === 10) {
                    const mostFrequentLetter = findMostFrequentLetter(letters);
                    console.log('Most frequent letter:', mostFrequentLetter);

                    socket.emit('recognized-gesture-letter', { letter: mostFrequentLetter });

                    letters = [];
                    letterAccumulation = false;

                    setTimeout(() => {
                        letterAccumulation = true;
                    }, 3000);
                }
            }
        } else {
            container.style.borderColor = 'rgba(220, 220, 220, 0.1)';
        }
    }, 100);

    function findMostFrequentLetter(letters) {
        const letterCount = {};
        letters.forEach(letter => {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        });

        let mostFrequentLetter = '';
        let maxCount = 0;
        for (const letter in letterCount) {
            if (letterCount[letter] > maxCount) {
                maxCount = letterCount[letter];
                mostFrequentLetter = letter;
            }
        }
        return mostFrequentLetter;
    }

    let accumulatedLetters = '';
    let displayTimeout;

    socket.on('receive-gesture-letter', (letter) => {
        accumulatedLetters += letter;
        updateUIWithLetters(accumulatedLetters);
        resetTimeout();
    });

    function updateUIWithLetters(letters) {
        const letterDisplay = document.getElementById('letterDisplay');
        if (letters) {
            letterDisplay.textContent = `${letters}`;
            clearTimeout(displayTimeout);
            displayTimeout = setTimeout(() => {
                accumulatedLetters = '';
                letterDisplay.textContent = '';
            }, 10000);
        } else {
            letterDisplay.textContent = '';
        }
    }

    function resetTimeout() {
        clearTimeout(displayTimeout);
        displayTimeout = setTimeout(() => {
            accumulatedLetters = '';
            updateUIWithLetters(accumulatedLetters);
        }, 5000);
    }
}

runHandpose();