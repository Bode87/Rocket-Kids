// Globale Variablen
let hintergrundMusik, gasgebenTon, bewegungHoch, bewegungRechts, bewegungLinks, tonGespielt, hindernisse = [], ei, score, leben, spielStartZeit, spielAktiv;
let hindernisIntervall = 60; // Startintervall für Hindernisse
let letzterScoreFuerIntervallUpdate = 0; // Speichert den letzten Score, bei dem das Intervall aktualisiert wurde
let nachrichtAnzeigeZeit = 0; // Zeitpunkt, zu dem die Nachricht angezeigt wird
let nachricht = ""; // Die Nachricht, die angezeigt wird
let geschwindigkeitsMultiplikator = 1;
let scoreboard = [];
let touchStartX = 0;
let touchEndX = 0;

function setup() {
    console.log("Setup wird aufgerufen");
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('spielbereich');
    
    ei = new Ei();
    hindernisse.push(new Hindernis());
    score = 0;
    leben = 3;
    spielStartZeit = millis(); // Speichert die Startzeit des Spiels
    noLoop();
    canvas.touchStarted(handleTouchStart);
    canvas.touchMoved(e => false);
    canvas.touchEnded(handleTouchEnd);
}
function preload() {
    // Assuming 'hintergrundMusik' and 'kollisionTon' are the IDs of your audio elements
    hintergrundMusik = document.getElementById('hintergrundMusik');
    kollisionTon = document.getElementById('kollisionTon');
  }

  class Ei {
    constructor() {
        this.x = 64;
        this.y = height / 2;
        this.gravity = 0.6;
        this.lift = -15;
        this.velocity = 5;
        this.width = 80; // Gesamtlänge der Rakete
        this.height = 25; // Höhe der Rakete
        this.isMoving = false;
    }

    update() {
        this.velocity += this.gravity;
        this.velocity *= 0.9;
        this.y += this.velocity;

        if (this.y > height) {
            this.y = height;
            this.velocity = 0;
        }

        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Setze isMoving zurück, wenn die Rakete nicht mehr beschleunigt
        this.isMoving = Math.abs(this.velocity) > 0.1;
    }

    up() {
        this.velocity += -2;
        this.isMoving = true;
        spieleGasgebenTon(); // Spielt den Ton ab, wenn die Rakete nach oben bewegt wird
    }

    move(dx) {
        this.x += dx;
        this.x = constrain(this.x, 0, width - this.width);
        this.isMoving = true;
        spieleGasgebenTon(); // Spielt den Ton ab, wenn die Rakete seitlich bewegt wird
    }

    show() {
        // Raketenfarbe
        fill(200, 200, 200);

        // Hauptkörper der Rakete
        rect(this.x, this.y - this.height / 2, this.width, this.height, 10);

        // Kabine als halbkreisförmiges Vorderteil
        fill(150, 150, 255); // Farbe der Kabine
        arc(this.x + this.width / 2, this.y - this.height / 2, this.width, this.width, PI, 0);

        // Dynamischere eckige Flammen am unteren Ende der Rakete
        if (bewegungHoch || bewegungRechts || bewegungLinks) {
            fill(255, 100, 0); // Farbe der Flammen
            this.drawFlames(this.x + this.width / 2, this.y + this.height / 2, this.width * 1.5, 100);
            spieleGasgebenTon(); // Spielt den Ton ab, wenn die Flammen erscheinen
        }
    }

    drawFlames(x, y, width, height) {
        push(); // Startet einen neuen Zeichenkontext
        translate(x, y + this.height / 2); // Verschiebt den Ursprung zu den Flammen

        // Zeichnet mehrere Schichten von Flammen mit unterschiedlichen Farben und Transparenzen
        for (let i = 0; i < 7; i++) {
            let flameWidth = width * (0.5 + i / 14); // Die Breite der Flamme nimmt nach unten zu
            let flameHeight = height * (0.6 + i / 10); // Die Höhe der Flamme nimmt nach unten zu
            let alpha = 255 - i * 30; // Die Transparenz der Flamme nimmt nach unten ab

            // Farbe der Flamme: von Gelb zu Rot zu Dunkelrot
            let col = lerpColor(color(255, 150, 0, alpha), color(255, 0, 0, alpha), i / 7);

            fill(col);
            noStroke();

            // Zeichnet die Flamme als eine Reihe von Punkten, die zufällig verteilt sind, um ein Flackern zu simulieren
            beginShape();
            for (let j = 0; j < 6; j++) {
                let xFlame = random(-flameWidth / 2, flameWidth / 2);
                let yFlame = random(0, flameHeight);
                vertex(xFlame, yFlame);
            }
            endShape(CLOSE);
        }

        pop(); // Stellt den vorherigen Zeichenkontext wieder her
    }
}

    class Hindernis {
        constructor() {
          this.top = 0; // Startet am oberen Rand
          this.w = random(50, 150); // Zufällige Breite des Hindernisses
          this.h = random(20, 100); // Zufällige Höhe des Hindernisses
          this.x = random(width); // Zufällige Position auf der X-Achse
          this.points = []; // Punkte für die individuelle Form des Steins
          this.broken = false; // Zustand des Hindernisses
          this.fragments = []; // Trümmerteile nach Zerstörung
          this.createShape();
        }
      
        createShape() {
          let pointsCount = floor(random(5, 10)); // Zufällige Anzahl von Punkten
          for (let i = 0; i < pointsCount; i++) {
            let angle = map(i, 0, pointsCount, 0, TWO_PI);
            let r = random(this.w / 2, this.w); // Radius variiert
            let x = this.w / 2 + r * cos(angle);
            let y = this.h / 2 + r * sin(angle);
            this.points.push(createVector(x, y));
          }
        }
      
        breakApart() {
          this.broken = true;
          // Erstellen von 5 Trümmerteilen
          for (let i = 0; i < 5; i++) {
            let fragment = {
              x: this.x + this.w / 2,
              y: this.top + this.h / 2,
              vx: random(-5, 5),
              vy: random(-5, 5)
            };
            this.fragments.push(fragment);
          }
        }
      
        update() {
          if (this.broken) {
            // Bewegen der Trümmerteile
            this.fragments.forEach(fragment => {
              fragment.x += fragment.vx;
              fragment.y += fragment.vy;
              // Trümmerteile entfernen, wenn sie den Rand erreichen
              if (fragment.x < 0 || fragment.x > width || fragment.y < 0 || fragment.y > height) {
                let index = this.fragments.indexOf(fragment);
                this.fragments.splice(index, 1);
              }
            });
          } else {
            // Bewegen des Hindernisses nach unten
            this.top += 6;
          }
        }
      
        show() {
          if (this.broken) {
            // Zeichnen der Trümmerteile
            this.fragments.forEach(fragment => {
              fill(150); // Trümmerfarbe
              ellipse(fragment.x, fragment.y, 10, 10);
            });
          } else {
            // Zeichnen des unzerstörten Hindernisses
            fill(139, 69, 19); // Farbe des Hindernisses
            beginShape();
            this.points.forEach(p => {
              vertex(this.x + p.x, this.top + p.y);
            });
            endShape(CLOSE);
          }
        }
        hits(ei) {
            if (this.broken) {
              return false;
            }
            // Überprüft, ob das Ei sich innerhalb der horizontalen Grenzen des Hindernisses befindet
            if (ei.x + ei.width > this.x && ei.x < this.x + this.w) {
              // Überprüft, ob der Hauptkörper des Eies mit dem Hindernis kollidiert
              if ((ei.y + ei.height > this.top) && (ei.y < this.top + this.h)) {
                spieleKollisionTon(); // Ton abspielen bei Kollision
                this.breakApart(); // Zerspringen in Trümmer
                return true;
              }
              // Überprüft, ob die Kuppel des Eies mit dem Hindernis kollidiert
              let kuppelX = ei.x + ei.width / 2;
              let kuppelY = ei.y - ei.height / 2;
              let nearestX = max(this.x, min(kuppelX, this.x + this.w));
              let nearestY = max(this.top, min(kuppelY, this.top + this.h));
              let distX = kuppelX - nearestX;
              let distY = kuppelY - nearestY;
              if (distX * distX + distY * distY < (ei.width / 2) * (ei.width / 2)) {
                spieleKollisionTon(); // Ton abspielen bei Kollision
                this.breakApart(); // Zerspringen in Trümmer
                return true;
              }
            }
            return false;
          }
          offscreen() {
            // Überprüft, ob das Hindernis den unteren Rand überschritten hat
            return this.top > height;
          }
    }

function spieleGasgebenTon() {
    let gasgebenTon = document.getElementById('gasgebenTon');
    if (gasgebenTon) {
        if (gasgebenTon.paused) {
            gasgebenTon.play().then(() => {
                console.log("Gasgeben-Ton wird abgespielt");
            }).catch((error) => {
                console.error("Fehler beim Abspielen des Gasgeben-Tons:", error);
            });
        } else {
            // Der Ton wird bereits abgespielt, setzen Sie ihn zurück und spielen Sie ihn erneut ab
            gasgebenTon.currentTime = 0;
        }
    } else {
        console.error('Audio-Element für Gasgeben-Ton wurde nicht gefunden.');
    }}
function stoppeGasgebenTon() {
    let gasgebenTon = document.getElementById('gasgebenTon');
    if (gasgebenTon && !gasgebenTon.paused) {
        gasgebenTon.pause(); // Pausiert den Ton
        gasgebenTon.currentTime = 0; // Setzt den Ton zurück
    }
}

// Funktion zum Abspielen des Kollisionstons
function spieleKollisionTon() {
    let kollisionTon = document.getElementById('kollisionTon');
    kollisionTon.currentTime = 0; // Setzt den Ton zurück, falls er bereits spielt
    kollisionTon.play();
}
document.getElementById('startButton').addEventListener('click', function() {
    console.log("Spiel Starten geklickt");
    document.getElementById('startBildschirm').style.display = 'none';
    loop();
});

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    console.log("Draw wird aufgerufen");
    background(0);
    ei.update();
    ei.show();

    // Überprüfen, ob der Score ein Vielfaches von 20 ist und ob das Intervall seit dem letzten Update nicht geändert wurde
    if (score % 20 === 0 && score !== letzterScoreFuerIntervallUpdate) {
        hindernisIntervall = max(30, hindernisIntervall - 10); // Verringere das Intervall, aber nicht weniger als alle 30 Frames
        letzterScoreFuerIntervallUpdate = score; // Aktualisiere den letzten Score für das Intervallupdate
        nachricht = "Wow! jetzt wirds schwieriger"; // Setze die Nachricht
        nachrichtAnzeigeZeit = millis(); // Speichere die aktuelle Zeit
    }
    if (score % 50 === 0 && score !== 0) {
        geschwindigkeitsMultiplikator *= 1.2; // Erhöht die Geschwindigkeit um 20%
    }
    // Erzeugt Hindernisse basierend auf dem aktuellen Intervall
    if (frameCount % hindernisIntervall === 0) {
        hindernisse.push(new Hindernis());
    }

    // Zeige die Nachricht für 1 Sekunde an
    if (nachricht !== "" && millis() - nachrichtAnzeigeZeit < 1000) {
        textSize(32);
        fill(255, 255, 0); // Gelbe Farbe für die Nachricht
        textAlign(CENTER, CENTER);
        text(nachricht, width / 2, height / 4); // Zentriere die Nachricht auf dem Bildschirm
    } else if (millis() - nachrichtAnzeigeZeit >= 1000) {
        nachricht = ""; // Lösche die Nachricht nach 1 Sekunde
    }
    for (let i = hindernisse.length - 1; i >= 0; i--) {
        hindernisse[i].update();
        hindernisse[i].show();

        if (hindernisse[i].hits(ei)) {
            hindernisse.splice(i, 1);
            leben--;
            if (leben <= 0) {
                spielBeendet();
                return;
            }
        } else if (hindernisse[i].offscreen()) {
            hindernisse.splice(i, 1);
            score++;
        }
    }     
    
    if (bewegungRechts) {
        ei.move(5);
    }
    if (bewegungLinks) {
        ei.move(-5);
    }
    if (bewegungHoch) {
        ei.up();
    }

    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Score: " + score, 10, 30);
    text("Leben: " + leben, 10, 60);
}

document.getElementById('speichernButton').addEventListener('click', function() {
    // ...
    spielZuruecksetzen(); // Spiel zurücksetzen nach dem Speichern
});

document.getElementById('weiterButton').addEventListener('click', function() {
    // ...
    spielZuruecksetzen(); // Spiel zurücksetzen, wenn der Spieler weitermachen möchte
});

// Funktion, um das Spiel zurückzusetzen
function spielZuruecksetzen() {
    leben = 3;
    geschwindigkeitsMultiplikator = 1; // Zurücksetzen des Geschwindigkeitsmultiplikators
    hindernisIntervall = 60; // Zurücksetzen des Hindernisintervalls
    letzterScoreFuerIntervallUpdate = 0; // Setzen Sie auch diese Variable zurück, um sicherzustellen, dass das Intervall korrekt aktualisiert wird
    hindernisse = [];
    ei = new Ei(); // Erstellt eine neue Instanz der Rakete (Ei), um die Position zurückzusetzen
    loop(); // Startet das Spiel neu
    hintergrundMusik.pause(); // Stoppt die Musik
    hintergrundMusik.currentTime = 0; // Setzt die Musik zurück

    // Setzt die Bewegungsvariablen zurück
    bewegungRechts = false;
    bewegungLinks = false;
    bewegungHoch = false;
}

function keyPressed() {
    if (keyCode === UP_ARROW) {
        bewegungHoch = true;
        spieleGasgebenTon();
    } else if (keyCode === RIGHT_ARROW) {
        bewegungRechts = true;
        spieleGasgebenTon();
    } else if (keyCode === LEFT_ARROW) {
        bewegungLinks = true;
        spieleGasgebenTon();
    }
}
function keyReleased() {
    if (keyCode === UP_ARROW) {
        bewegungHoch = false;
    } else if (keyCode === RIGHT_ARROW) {
        bewegungRechts = false;
    } else if (keyCode === LEFT_ARROW) {
        bewegungLinks = false;
    }
    let gasgebenTon = document.getElementById('gasgebenTon');
    if (gasgebenTon && !gasgebenTon.paused) {
        gasgebenTon.pause(); // Pausiert den Ton, wenn die Tasten losgelassen werden
        gasgebenTon.currentTime = 0; // Setzt den Ton zurück
    }
}
function setup() {
    console.log("Setup wird aufgerufen");
    console.log("p5-Version:", p5.VERSION); // Testen, ob p5 geladen ist
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('spielbereich');
    
    ei = new Ei();
    hindernisse.push(new Hindernis());
    score = 0;
    leben = 3;
    spielStartZeit = millis(); // Speichert die Startzeit des Spiels
    noLoop();
}
 // Event-Listener für Start-Button
 document.getElementById('startButton').addEventListener('click', function() {
    console.log("Spiel Starten geklickt");
    document.getElementById('startBildschirm').style.display = 'none';
    spielAktiv = true; // Setzt den Spielstatus auf aktiv
    if (typeof loop === 'function') {
        loop();
    }
    hintergrundMusik.play(); // Startet die Musik
});

// Event-Listener für Anleitung
var anleitungModal = document.getElementById('anleitungModal');
var anleitungBtn = document.getElementById('anleitungButton');
var closeButton = document.getElementsByClassName('closeButton')[0];

anleitungBtn.onclick = function() {
    anleitungModal.style.display = 'block';
}

closeButton.onclick = function() {
    anleitungModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == anleitungModal) {
        anleitungModal.style.display = 'none';
    }
}


// Funktion, um zum Startbildschirm zurückzukehren
function zumStartBildschirmZurueckkehren() {
    document.getElementById('spielEndeFormular').style.display = 'none'; // Formular ausblenden
    document.getElementById('startBildschirm').style.display = 'block'; // Startbildschirm anzeigen
    noLoop(); // Stoppt das Spiel
    hintergrundMusik.pause(); // Stoppt die Musik
    hintergrundMusik.currentTime = 0; // Setzt die Musik zurück
}


// Event-Listener für Weiter-Button
document.getElementById('weiterButton').addEventListener('click', function() {
    console.log("Aktueller Score vor dem Weitermachen:", score);
    spielZuruecksetzen(); // Spiel zurücksetzen, wenn der Spieler weitermachen möchte
    zumStartBildschirmZurueckkehren();
        // Ruft die Funktion auf, um das Spiel sauber zu beenden
        spielSauberBeenden();
        score=0;
});
// Event-Listener für Speichern-Button
document.getElementById('speichernButton').addEventListener('click', function() {
    let spielerName = document.getElementById('spielerName').value;
    let aktuellerScore = score; // Speichern des aktuellen Scores in einer lokalen Variablen
    console.log("Aktueller Score vor dem Speichern:", aktuellerScore);
    let datum = new Date().toLocaleDateString();

    if (spielerName) {
        // Füge den neuen Score zum Array hinzu
        scoreboard.push({ name: spielerName, score: aktuellerScore, date: datum });

        // Sortiere das Array absteigend nach Score
        scoreboard.sort((a, b) => b.score - a.score);

        // Aktualisiere die Anzeige
        updateScoreboard();
    }

    spielSauberBeenden(); // Ruft die Funktion auf, um das Spiel sauber zu beenden

    // Setzt den Score zurück, nachdem er gespeichert wurde
    score = 0;
});
function updateScoreboard() {
    const scoreListe = document.getElementById('scoreListe');
    scoreListe.innerHTML = ''; // Leere die aktuelle Liste

    // Erstelle die Liste neu
    scoreboard.forEach(scoreEntry => {
        let li = document.createElement('li');
        li.textContent = `${scoreEntry.name} - Score: ${scoreEntry.score} - Datum: ${scoreEntry.date}`;
        scoreListe.appendChild(li);
    });
}
function spielSauberBeenden() {
    console.log("Spiel wird sauber beendet.");

    // Stoppt das Spiel
    noLoop();

    // Setzt den Spielstatus auf inaktiv
    spielAktiv = false;

    // Stoppt und setzt die Hintergrundmusik zurück
    hintergrundMusik.pause();
    hintergrundMusik.currentTime = 0;

    // Setzt die Bewegungsvariablen zurück
    bewegungRechts = false;
    bewegungLinks = false;
    bewegungHoch = false;

    // Setzt die Leben zurück
    leben = 3;

    // Leert das Array der Hindernisse
    hindernisse = [];

    // Erstellt eine neue Instanz der Rakete (Ei), um die Position zurückzusetzen
    ei = new Ei();

    // Setzt das Spielende-Formular zurück
    document.getElementById('spielEndeFormular').style.display = 'none';

    // Zeigt den Startbildschirm an
    document.getElementById('startBildschirm').style.display = 'block';
}

// Ändern Sie die spielBeendet-Funktion, um spielSauberBeenden aufzurufen
function spielBeendet() {
    console.log("Spiel beendet. Score zum Zeitpunkt des Spielendes:", score);
    document.getElementById('finalScore').textContent = "Dein Score: " + score;
    document.getElementById('spielEndeFormular').style.display = 'block';
    
    noLoop(); // Stoppt das Spiel
    hintergrundMusik.pause(); // Stoppt die Musik
}
function handleTouchStart() {
    touchStartX = touches[0].x;
    bewegungHoch = true;
    return false;
}

function handleTouchEnd() {
    touchEndX = touches.length > 0 ? touches[0].x : touchStartX;
    let deltaX = touchEndX - touchStartX;

    if (deltaX > 30) { // Wischen nach rechts
        bewegungRechts = true;
        bewegungLinks = false;
    } else if (deltaX < -30) { // Wischen nach links
        bewegungLinks = true;
        bewegungRechts = false;
    } else { // Tippen
        bewegungHoch = false;
    }

    // Setzen Sie einen Timeout, um die Seitwärtsbewegung zu beenden
    setTimeout(() => {
        bewegungLinks = false;
        bewegungRechts = false;
        bewegungHoch = false;
    }, 100);

    return false;
}