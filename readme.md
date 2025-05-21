# 🌀 Was ist ein Fraktal?


Ein **Fraktal** ist eine geometrische Struktur, die aus ähnlichen Mustern besteht, die sich auf verschiedenen Größenskalen wiederholen.  
Typisch sind **Selbstähnlichkeit** und  **unendliche Detailtiefe**. 
Fraktale entstehen meist durch **iterative Prozesse**.  
Beispiele: Mandelbrot-Menge, Sierpinski-Dreieck, natürliche Formen wie Blitze oder Küstenlinien.  
Sie finden Anwendung in Grafik, Naturmodellierung und Wissenschaft.
---

# 🌀 Mandelbrot- und Julia-Mengen: Einfache Erklärung

## 🔷 Die Mandelbrot-Menge

### 🧮 Grundprinzip

* Jeder Punkt auf dem Bildschirm wird als **(x, y)** interpretiert (z. B. eine Pixelposition, umgerechnet auf einen Zahlenbereich).
* Diese Koordinaten füttern wir in eine **einfache Rechenregel**, die wir wiederholt anwenden.

### 📜 Rechenregel (Pseudocode)

```pseudocode
zx = 0
zy = 0

Wiederhole viele Male:
    xtemp = zx*zx - zy*zy + x
    zy = 2*zx*zy + y
    zx = xtemp
```

### 🧠 Was passiert dabei?

1. Start mit `zx = 0`, `zy = 0`.
2. Einsetzen in die Formel → neue Zahlen.
3. Diese neuen Zahlen werden wieder eingesetzt.
4. **Abbruchbedingung**:

   * Wenn `zx*zx + zy*zy > 4`, explodieren die Zahlen → **Punkt gehört **nicht** zur Mandelbrot-Menge**.
   * Wenn das auch nach z. B. **100 Wiederholungen** nicht passiert → **Punkt gehört zur Mandelbrot-Menge**.

### ✨ Ergebnis

Aus dieser simplen Regel entsteht ein komplexes, faszinierendes Bild: **das Mandelbrot-Fraktal**.

---

## 🔶 Die Julia-Menge

### 🧮 Grundprinzip

* Der Ablauf ist fast gleich wie bei der Mandelbrot-Menge – aber mit einem **entscheidenden Unterschied**.

### 📜 Julia-Formel (Pseudocode)

```pseudocode
zx = pixelX   // Startwert = die Koordinate des Pixels
zy = pixelY

Wiederhole viele Male:
    xtemp = zx*zx - zy*zy + x   // x ist hier fest!
    zy = 2*zx*zy + y            // y ist hier fest!
    zx = xtemp
```

### 📌 Was ist anders?

|                        | **Mandelbrot**                          | **Julia**                                      |
| ---------------------- | --------------------------------------- | ---------------------------------------------- |
| **Startwert**          | `zx = 0`, `zy = 0`                      | `zx = pixelX`, `zy = pixelY`                   |
| **Konstante**          | `x, y = vom Pixel` (jeder Punkt anders) | `x, y = vorher festgelegt` (immer gleich)      |
| **Was wird getestet?** | Ob ein Punkt **selbst** ruhig bleibt    | Wie ein Punkt auf eine **feste Zahl** reagiert |

---

## 🧪 Beispiel: Julia-Menge mit fester Konstante

Stelle `x = -0.8` und `y = 0.156` ein.

Dann gilt für jeden Bildschirmpunkt:

1. Nimm Pixel-Koordinaten als `zx`, `zy`.
2. Stecke sie in die Formel (mit festem `x`, `y`).
3. Wiederhole die Regel.
4. Wenn `zx*zx + zy*zy > 4` → **Punkt gehört nicht zur Julia-Menge**.
5. Bleibt der Wert stabil → **Punkt gehört zur Julia-Menge**.

---

## 🎨 Ergebnis und Unterschiede

### Mandelbrot

* „Ich verändere die Formel bei **jedem Punkt**.“
* Testet, **ob** ein Punkt zur Menge gehört.

### Julia

* „Ich nehme eine **feste Formel** und schaue, **was jeder Punkt** damit macht.“
* Jeder feste Wert `(x, y)` ergibt eine eigene, einzigartige Julia-Menge.

---

## 🌿 Fazit

* Die **Mandelbrot-Menge** zeigt, wo das Verhalten stabil bleibt.
* Die **Julia-Menge** zeigt, wie sich Punkte unter einer bestimmten Regel verhalten.
* Beides erzeugt **fraktale**, oft **natürlich wirkende Muster** – wie Wurzeln, Blumen oder Korallen.

---
Erklärung der Funktion `hslToRgb(h, s, l)` – Schritt für Schritt:

---

## 🎨 Was macht die Funktion?

Die Funktion **wandelt Farben von HSL in RGB um**.

* **HSL** steht für:

  * **H** = Farbton (Hue), z. B. Rot, Blau, Gelb... (0 bis 360 Grad)
  * **S** = Sättigung (Saturation), wie kräftig die Farbe ist (0 bis 100 %)
  * **L** = Helligkeit (Lightness), wie hell oder dunkel die Farbe ist (0 bis 100 %)

* **RGB** steht für Rot, Grün, Blau – das Farbsystem, das auf Bildschirmen verwendet wird (Werte von 0 bis 255).

---

## 🧮 Schritt-für-Schritt-Erklärung

```js
h /= 360;
s /= 100;
l /= 100;
```

➡️ Die Eingabewerte `h`, `s` und `l` werden in den Bereich von 0 bis 1 umgerechnet (damit sie leichter berechnet werden können).

---

### 🧠 Falls die Farbe **grau oder schwarz/weiß** ist:

```js
if (s === 0) {
  r = g = b = l;
}
```

➡️ Wenn die **Sättigung = 0** ist, bedeutet das: keine Farbe – nur ein **Grauton**.
Dann sind Rot, Grün und Blau **alle gleich** (abhängig von der Helligkeit).

---

### 🌈 Falls es eine „richtige“ Farbe ist:

```js
const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
const p = 2 * l - q;
```

➡️ Diese zwei Werte helfen dabei, **den genauen Farbton** zu berechnen. Es hängt davon ab, ob die Helligkeit unter oder über 50 % liegt.

Dann kommt die wichtigste Hilfe-Funktion:

```js
const hue2rgb = (p, q, t) => { ... }
```

➡️ Diese Funktion berechnet, wie viel **Rot**, **Grün** oder **Blau** ein bestimmter Farbton haben soll – je nachdem, wo er im Farbkreis liegt.

```js
r = hue2rgb(p, q, h + 1 / 3);
g = hue2rgb(p, q, h);
b = hue2rgb(p, q, h - 1 / 3);
```

➡️ Jetzt wird für jeden RGB-Kanal separat der richtige Wert berechnet.

---

### 🎯 Am Ende:

```js
return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
```

➡️ Die Ergebnisse (zwischen 0 und 1) werden in **Werte von 0 bis 255** umgerechnet und **gerundet** – genau das, was RGB braucht.

---

## ✅ Zusammenfassung

Die Funktion:

1. Rechnet HSL in mathematische Werte um.
2. Wenn kein Farbton vorhanden ist (Sättigung = 0), gibt sie einen Grauwert zurück.
3. Wenn Farbe vorhanden ist, berechnet sie präzise RGB-Werte anhand von Farbkreis-Formeln.
4. Gibt die Farbe als `[Rot, Grün, Blau]` mit Werten zwischen 0 und 255 zurück.



# 🌫️ `applyFogLayer()` – Wie der Nebel über das Fraktal gelegt wird

## 🧩 Funktion: `applyFogLayer()`

Diese Methode wird genutzt, um **mehrschichtigen Nebel** auf das erzeugte Fraktalbild zu legen. Der Nebel sieht durch die Verwendung von **Perlin Noise** (eine Art natürliches Rauschen) realistisch und strukturiert aus – ähnlich wie Wolken oder Nebelschwaden.

Ziel: Das Bild soll **tiefer, geheimnisvoller und atmosphärischer** wirken.

---

## 🔍 Übersicht – Was macht die Funktion?

1. Holt sich alle Bildpixel-Daten.
2. Prüft jeden Pixel darauf, ob dort Nebel erlaubt ist.
3. Erzeugt eine zufällige Nebelstruktur mit mehreren „Schichten“ Noise.
4. Rechnet für jeden Pixel eine Nebel-Intensität aus.
5. Überlagert die Originalfarbe mit einer aufgehellten Farbe.

---

## 🧠 Schritt-für-Schritt Erklärung

### 1. 📦 Bilddaten holen

```js
const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
const data = imgData.data;
→ Holt sich die rohen Farbwerte aller Pixel (RGBA = Rot, Grün, Blau, Alpha).

2. 🔁 Über jedes Pixel laufen

for (let px = 0; px < this.width; px++) {
  for (let py = 0; py < this.height; py++) {
→ Es wird jeder Punkt im Bild nacheinander untersucht.

3. ❌ Bestimmte Pixel vom Nebel ausschließen
a) Sterne bleiben klar

for (const star of this.starPositions) {
  const distance = Math.sqrt((px - star.x) ** 2 + (py - star.y) ** 2);
  if (distance <= star.radius) {
    skipFog = true;
    break;
  }
}
→ Sterne sollen nicht vom Nebel verdeckt werden. Sie bleiben leuchtend klar.

b) Optional: Schwarze Bereiche aussparen

if (this.keepBlackAreasClear && !this.coloredAreas[pixelIndex]) {
  skipFog = true;
}
→ Falls aktiviert, wird Nebel nicht auf komplett schwarze Bereiche gelegt.

4. 🌫️ Nebelstruktur mit Perlin Noise berechnen

let noiseSum = 0;
for (let layer = 0; layer < this.fogLayerCount; layer++) {
  const frequency = this.fogSize * Math.pow(2, layer);
  const amplitude = 1 / Math.pow(2, layer);
  noiseSum += this.noise2D(px * frequency, py * frequency) * amplitude;
}
→ Die Nebelstruktur entsteht durch mehrere Schichten Rauschen:

Frequenz (Strukturgröße) verdoppelt sich je Schicht.

Amplitude (Stärke) wird pro Schicht halbiert.


const fogIntensity = (noiseSum + 1) / 2;
→ Der finale Wert wird in den Bereich 0–1 gebracht.

5. 🎨 Farbe und Transparenz des Nebels berechnen

const baseColor = [data[i], data[i + 1], data[i + 2]];
const fogColor = [
  Math.min(255, baseColor[0] + 40),
  Math.min(255, baseColor[1] + 40),
  Math.min(255, baseColor[2] + 60),
];
→ Die Nebelfarbe ist ein aufgehelltes, leicht bläuliches Grau.


const alpha = fogIntensity * this.fogDensity;
→ Die Deckkraft hängt von der Nebelstärke (fogIntensity) und der allgemeinen Dichte (fogDensity) ab.

6. 🖌️ Nebelfarbe mit Originalfarbe mischen

data[i]     = this.blend(data[i],     fogColor[0], alpha);
data[i + 1] = this.blend(data[i + 1], fogColor[1], alpha);
data[i + 2] = this.blend(data[i + 2], fogColor[2], alpha);
→ Der Nebel wird weich über die aktuelle Farbe gelegt, je nach Intensität.

Die Methode blend(bg, fg, alpha) berechnet:

return bg * (1 - alpha) + fg * alpha;
🎯 Ziel erreicht: Was bringt das?
✅ Das Fraktal bekommt:

realistisch wirkenden Nebel

verschiedene Tiefen durch Noise-Schichten

mehr Stimmung und Atmosphäre

klare Sterne und wahlweise saubere schwarze Flächen

🧪 Parameter, die Einfluss haben
Parameter	Bedeutung
fogDensity	Wie stark der Nebel sichtbar ist (0.1–0.8)
fogSize	Wie groß die Strukturen sind
fogLayerCount	Wie viele Noise-Schichten verwendet werden
keepBlackAreasClear	Ob schwarze Flächen nebellos bleiben

📷 Beispielbild
Nach Anwendung dieser Funktion sieht das Fraktal „nebliger“, mystischer und weicher aus – wie ein Weltraum- oder Traumlandschaftsbild.

🧾 Fazit
Die Methode applyFogLayer() macht aus einem normalen Fraktalbild ein kunstvolles, atmosphärisches Werk.
Durch intelligente Berechnung wird nur dort Nebel gezeichnet, wo er sinnvoll ist.
Dadurch bleiben wichtige Bildelemente wie Sterne klar sichtbar und das Ergebnis wirkt natürlich und detailreich.


